/**
 * Ticket Service with Supabase
 * Manages ticket purchases, storage, and retrieval using Supabase
 * Integrates with QR service for secure ticket generation
 */

import { supabase } from '@/lib/supabase';
import {
  Ticket,
  Purchase,
  Event,
  UserInfo,
  PaymentMethod,
  PaymentStatus,
  TicketStatus,
} from '@/types/ticket.types';
import { QRService } from './qr.service';
import { AppError, ErrorCode, Result, Ok, Err, ErrorHandler } from '@/utils/errors';

export class TicketServiceSupabase {
  /**
   * Create a new ticket purchase
   * Generates QR codes and saves tickets to Supabase
   *
   * @param event - Event information
   * @param quantity - Number of tickets
   * @param userInfo - Buyer information
   * @param paymentMethod - Payment method used
   * @param userId - User identifier
   * @param paymentResult - Optional payment result from payment gateway
   * @returns Result with created purchase or error
   */
  static async createPurchase(
    event: Event,
    quantity: number,
    userInfo: UserInfo,
    paymentMethod: PaymentMethod,
    userId: string,
    paymentResult?: {
      paymentId: string;
      transactionId?: string;
      receiptUrl?: string;
      gateway: string;
      metadata?: any;
    }
  ): Promise<Result<Purchase>> {
    try {
      // Validate inputs
      if (quantity < 1 || quantity > 10) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid quantity',
          'La cantidad de entradas debe estar entre 1 y 10.'
        );
      }

      if (!userInfo.name || !userInfo.email) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required user information',
          'Por favor, completa tu nombre y correo electrónico.'
        );
      }

      // Optimistic check: verify event has enough tickets (soft check)
      // The trigger will do the authoritative check during insertion
      const { data: eventData, error: eventCheckError } = await supabase
        .from('events')
        .select('available_tickets, total_tickets')
        .eq('id', event.id)
        .single();

      if (eventCheckError) {
        console.error('⚠️ No se pudo verificar disponibilidad:', eventCheckError);
      }

      // Si available_tickets es 0 o NULL, intentar actualizarlo primero usando la función
      if (eventData && (eventData.available_tickets === null || eventData.available_tickets === 0)) {
        console.log('⚠️ Evento sin tickets disponibles, intentando actualizar...');

        // Intentar usar la función RPC si existe
        const { error: fixError } = await supabase.rpc('fix_event_available_tickets', {
          event_id_param: event.id
        });

        if (fixError) {
          console.error('❌ No se pudo actualizar available_tickets con RPC:', fixError);
          // Si falla, permitir que el trigger lo maneje (podría funcionar con SECURITY DEFINER)
          console.log('ℹ️ Intentando continuar de todos modos...');
        } else {
          console.log(`✅ available_tickets actualizado para el evento ${event.id}`);
        }
      } else if (eventData && eventData.available_tickets < quantity) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Not enough tickets available',
          `Solo quedan ${eventData.available_tickets} entrada(s) disponible(s) para este evento.`,
          undefined,
          { availableTickets: eventData.available_tickets }
        );
      }

      const purchaseDate = new Date().toISOString();

      // Determine payment status: pending for manual payments, completed for others
      const isManualPayment = paymentResult?.gateway === 'manual';
      const paymentStatus: PaymentStatus = isManualPayment ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;

      // 1. Create purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          event_id: event.id,
          total_amount: event.price * quantity,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          user_name: userInfo.name,
          user_email: userInfo.email,
          user_phone: userInfo.phone,
          user_document: userInfo.document,
          // Payment tracking fields
          payment_gateway: paymentResult?.gateway || 'mock',
          payment_transaction_id: paymentResult?.transactionId,
          payment_receipt_url: paymentResult?.receiptUrl,
          payment_metadata: paymentResult?.metadata,
          payment_completed_at: isManualPayment ? null : new Date().toISOString(),
        })
        .select()
        .single();

      if (purchaseError || !purchaseData) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create purchase',
          'No se pudo crear la compra. Intenta nuevamente.',
          purchaseError
        );
      }

      // 2. Create a SINGLE ticket representing all quantities
      // Generate ticket code FIRST (this will be used in QR)
      const ticketCode = QRService.generateTicketCode();

      console.log(`🎫 Generando ticket con código: ${ticketCode}`);

      // Generate QR data using ticket_code (coherent lookup)
      const qrResult = QRService.generateQRData(
        ticketCode, // Use ticket_code instead of purchase ID
        event.id,
        userId,
        purchaseDate,
        { quantity } // Include quantity in metadata
      );

      if (!qrResult.success) {
        throw qrResult.error;
      }

      // Manually decrement available_tickets by the quantity
      // This bypasses the trigger since we're creating only ONE ticket record
      // Wrapped in try-catch to handle race condition properly
      try {
        const { error: decrementError } = await supabase.rpc('decrement_tickets_by_quantity', {
          event_id_param: event.id,
          decrement_by: quantity
        });

        if (decrementError) {
          // Check if it's a "no tickets available" error from the trigger
          const errorMessage = decrementError.message || '';
          const isInsufficientStock =
            errorMessage.includes('No tickets available') ||
            errorMessage.includes('not enough tickets') ||
            errorMessage.includes('available_tickets') ||
            decrementError.code === 'P0001'; // PostgreSQL RAISE EXCEPTION code

          if (isInsufficientStock) {
            // Race condition detected: Re-query to get current available_tickets
            const { data: currentEvent } = await supabase
              .from('events')
              .select('available_tickets')
              .eq('id', event.id)
              .single();

            const availableTickets = currentEvent?.available_tickets || 0;

            // Rollback purchase
            await supabase.from('purchases').delete().eq('id', purchaseData.id);

            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              'Not enough tickets available',
              availableTickets > 0
                ? `Solo quedan ${availableTickets} entrada(s) disponible(s) para este evento.`
                : 'No quedan entradas disponibles para este evento.',
              decrementError,
              { availableTickets }
            );
          }

          // If the function doesn't exist, try direct update (will be blocked by RLS but let's try)
          console.warn('⚠️ RPC function not found, trying direct update');
          const { error: updateError } = await supabase
            .from('events')
            .update({ available_tickets: supabase.raw(`available_tickets - ${quantity}`) })
            .eq('id', event.id)
            .gte('available_tickets', quantity);

          if (updateError) {
            // Rollback purchase
            await supabase.from('purchases').delete().eq('id', purchaseData.id);

            // Re-query to get current available_tickets for error details
            const { data: currentEvent } = await supabase
              .from('events')
              .select('available_tickets')
              .eq('id', event.id)
              .single();

            const availableTickets = currentEvent?.available_tickets || 0;

            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              'Not enough tickets available',
              availableTickets > 0
                ? `Solo quedan ${availableTickets} entrada(s) disponible(s) para este evento.`
                : 'No quedan entradas disponibles para este evento.',
              updateError,
              { availableTickets }
            );
          }
        }
      } catch (error) {
        // If it's already an AppError, re-throw it
        if (error instanceof AppError) {
          throw error;
        }

        // Otherwise, handle as DB error
        const { data: currentEvent } = await supabase
          .from('events')
          .select('available_tickets')
          .eq('id', event.id)
          .single();

        const availableTickets = currentEvent?.available_tickets || 0;

        // Rollback purchase
        await supabase.from('purchases').delete().eq('id', purchaseData.id);

        throw new AppError(
          ErrorCode.DB_ERROR,
          'Database error during ticket decrement',
          'Hubo un error al procesar tu compra. Por favor intenta nuevamente.',
          error,
          { availableTickets }
        );
      }

      // Create the single ticket with quantity
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          ticket_code: ticketCode,
          purchase_id: purchaseData.id,
          event_id: event.id,
          user_id: userId,
          ticket_type: 'General',
          price: event.price,
          quantity: quantity, // Store the actual quantity
          qr_code_data: qrResult.data,
          status: 'active' as TicketStatus,
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        console.error('❌ Error insertando ticket:', ticketError);
        // Rollback purchase
        await supabase.from('purchases').delete().eq('id', purchaseData.id);

        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create ticket',
          'No se pudo crear el ticket. Intenta nuevamente.',
          ticketError
        );
      }

      console.log(`✅ Ticket único creado con cantidad: ${quantity}`);
      const ticketsData = [ticket];

      // 3. Build tickets with event data for the Purchase object
      const tickets: Ticket[] = ticketsData.map((t) => ({
        id: t.id,
        ticketCode: t.ticket_code,
        eventId: t.event_id,
        event: event,
        userId: t.user_id,
        purchaseDate: t.created_at,
        status: t.status as TicketStatus,
        ticketType: t.ticket_type,
        seatNumber: t.seat_number || undefined,
        price: t.price,
        quantity: t.quantity || 1,
        totalAmount: t.price * (t.quantity || 1),
        qrCodeData: t.qr_code_data,
        usedAt: t.used_at || undefined,
        validatedBy: t.validated_by || undefined,
      }));

      // Create purchase object
      const purchase: Purchase = {
        id: purchaseData.id,
        userId: purchaseData.user_id,
        eventId: purchaseData.event_id,
        tickets,
        totalAmount: purchaseData.total_amount,
        paymentMethod: purchaseData.payment_method as PaymentMethod,
        paymentStatus: purchaseData.payment_status as PaymentStatus,
        purchaseDate: purchaseData.created_at,
        userInfo,
        transactionId: purchaseData.transaction_id || undefined,
      };

      return Ok(purchase);
    } catch (error) {
      ErrorHandler.log(error, 'TicketServiceSupabase.createPurchase');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create purchase',
          'No se pudo completar la compra. Intenta nuevamente.',
          error
        )
      );
    }
  }

  /**
   * Get all tickets for a user
   */
  static async getUserTickets(userId: string): Promise<Result<Ticket[]>> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to fetch tickets',
          'No se pudieron cargar tus entradas.',
          error
        );
      }

      if (!data) {
        return Ok([]);
      }

      // Map to Ticket type
      const tickets: Ticket[] = data.map((t: any) => ({
        id: t.id,
        ticketCode: t.ticket_code,
        eventId: t.event_id,
        event: {
          id: t.events.id,
          title: t.events.title,
          subtitle: t.events.subtitle,
          description: t.events.description,
          imageUrl: t.events.image_url,
          date: t.events.date,
          time: t.events.time,
          location: t.events.location,
          venue: t.events.venue,
          price: t.events.price,
          availableTickets: t.events.available_tickets,
          category: t.events.category,
          rating: t.events.rating,
        },
        userId: t.user_id,
        purchaseDate: t.created_at,
        status: t.status as TicketStatus,
        ticketType: t.ticket_type,
        seatNumber: t.seat_number || undefined,
        price: t.price,
        quantity: t.quantity || 1,
        totalAmount: t.price * (t.quantity || 1),
        qrCodeData: t.qr_code_data,
        usedAt: t.used_at || undefined,
        validatedBy: t.validated_by || undefined,
      }));

      return Ok(tickets);
    } catch (error) {
      ErrorHandler.log(error, 'TicketServiceSupabase.getUserTickets');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to retrieve tickets',
          'No se pudieron cargar tus entradas.',
          error
        )
      );
    }
  }

  /**
   * Get a specific ticket by ID
   */
  static async getTicketById(ticketId: string): Promise<Result<Ticket>> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (*)
        `)
        .eq('id', ticketId)
        .single();

      if (error || !data) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          `Ticket ${ticketId} not found`,
          'No se encontró la entrada solicitada.',
          error
        );
      }

      const ticket: Ticket = {
        id: data.id,
        ticketCode: data.ticket_code,
        eventId: data.event_id,
        event: {
          id: data.events.id,
          title: data.events.title,
          subtitle: data.events.subtitle,
          description: data.events.description,
          imageUrl: data.events.image_url,
          date: data.events.date,
          time: data.events.time,
          location: data.events.location,
          venue: data.events.venue,
          price: data.events.price,
          availableTickets: data.events.available_tickets,
          category: data.events.category,
          rating: data.events.rating,
        },
        userId: data.user_id,
        purchaseDate: data.created_at,
        status: data.status as TicketStatus,
        ticketType: data.ticket_type,
        seatNumber: data.seat_number || undefined,
        price: data.price,
        quantity: data.quantity || 1,
        totalAmount: data.price * (data.quantity || 1),
        qrCodeData: data.qr_code_data,
        usedAt: data.used_at || undefined,
        validatedBy: data.validated_by || undefined,
      };

      return Ok(ticket);
    } catch (error) {
      ErrorHandler.log(error, 'TicketServiceSupabase.getTicketById');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to retrieve ticket',
          'No se pudo cargar la entrada.',
          error
        )
      );
    }
  }

  /**
   * Mark a ticket as used
   */
  static async markTicketAsUsed(ticketId: string, validatedBy: string): Promise<Result<Ticket>> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          validated_by: validatedBy,
        })
        .eq('id', ticketId)
        .select(`
          *,
          events (*)
        `)
        .single();

      if (error || !data) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          `Ticket ${ticketId} not found`,
          'No se encontró la entrada.',
          error
        );
      }

      const ticket: Ticket = {
        id: data.id,
        ticketCode: data.ticket_code,
        eventId: data.event_id,
        event: {
          id: data.events.id,
          title: data.events.title,
          subtitle: data.events.subtitle,
          description: data.events.description,
          imageUrl: data.events.image_url,
          date: data.events.date,
          time: data.events.time,
          location: data.events.location,
          venue: data.events.venue,
          price: data.events.price,
          availableTickets: data.events.available_tickets,
          category: data.events.category,
          rating: data.events.rating,
        },
        userId: data.user_id,
        purchaseDate: data.created_at,
        status: data.status as TicketStatus,
        ticketType: data.ticket_type,
        seatNumber: data.seat_number || undefined,
        price: data.price,
        quantity: data.quantity || 1,
        totalAmount: data.price * (data.quantity || 1),
        qrCodeData: data.qr_code_data,
        usedAt: data.used_at || undefined,
        validatedBy: data.validated_by || undefined,
      };

      // Log validation
      await supabase.from('validations').insert({
        ticket_id: ticketId,
        validated_by: validatedBy,
        validation_result: 'valid',
        validation_message: 'Ticket successfully validated',
      });

      return Ok(ticket);
    } catch (error) {
      ErrorHandler.log(error, 'TicketServiceSupabase.markTicketAsUsed');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to update ticket',
          'No se pudo actualizar la entrada.',
          error
        )
      );
    }
  }

  /**
   * Get purchase history for a user
   */
  static async getPurchaseHistory(userId: string): Promise<Result<Purchase[]>> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          events (*),
          tickets (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to fetch purchase history',
          'No se pudo cargar el historial de compras.',
          error
        );
      }

      if (!data) {
        return Ok([]);
      }

      // Map to Purchase type
      const purchases: Purchase[] = data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        eventId: p.event_id,
        tickets: p.tickets.map((t: any) => ({
          id: t.id,
          ticketCode: t.ticket_code,
          eventId: t.event_id,
          event: {
            id: p.events.id,
            title: p.events.title,
            subtitle: p.events.subtitle,
            description: p.events.description,
            imageUrl: p.events.image_url,
            date: p.events.date,
            time: p.events.time,
            location: p.events.location,
            venue: p.events.venue,
            price: p.events.price,
            availableTickets: p.events.available_tickets,
            category: p.events.category,
            rating: p.events.rating,
          },
          userId: t.user_id,
          purchaseDate: t.created_at,
          status: t.status as TicketStatus,
          ticketType: t.ticket_type,
          seatNumber: t.seat_number || undefined,
          price: t.price,
          quantity: t.quantity || 1,
          totalAmount: t.price * (t.quantity || 1),
          qrCodeData: t.qr_code_data,
          usedAt: t.used_at || undefined,
          validatedBy: t.validated_by || undefined,
        })),
        totalAmount: p.total_amount,
        paymentMethod: p.payment_method as PaymentMethod,
        paymentStatus: p.payment_status as PaymentStatus,
        purchaseDate: p.created_at,
        userInfo: {
          name: p.user_name,
          email: p.user_email,
          phone: p.user_phone,
          document: p.user_document,
        },
        transactionId: p.transaction_id || undefined,
      }));

      return Ok(purchases);
    } catch (error) {
      ErrorHandler.log(error, 'TicketServiceSupabase.getPurchaseHistory');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to retrieve purchase history',
          'No se pudo cargar el historial de compras.',
          error
        )
      );
    }
  }
}
