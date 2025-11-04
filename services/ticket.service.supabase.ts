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

      // Check if event has enough tickets
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('available_tickets')
        .eq('id', event.id)
        .single();

      if (eventError) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to fetch event',
          'No se pudo verificar la disponibilidad del evento.',
          eventError
        );
      }

      if (!eventData || eventData.available_tickets < quantity) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Not enough tickets available',
          'No hay suficientes entradas disponibles.'
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

      // 2. Create tickets
      const ticketsToInsert = [];
      for (let i = 0; i < quantity; i++) {
        const ticketCode = QRService.generateTicketCode();
        const ticketId = `${purchaseData.id}-${i + 1}`;

        // Generate QR data
        const qrResult = QRService.generateQRData(
          ticketId,
          event.id,
          userId,
          purchaseDate
        );

        if (!qrResult.success) {
          throw qrResult.error;
        }

        ticketsToInsert.push({
          ticket_code: ticketCode,
          purchase_id: purchaseData.id,
          event_id: event.id,
          user_id: userId,
          ticket_type: 'General',
          price: event.price,
          qr_code_data: qrResult.data,
          status: 'active' as TicketStatus,
        });
      }

      // Insert all tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .insert(ticketsToInsert)
        .select();

      if (ticketsError || !ticketsData) {
        // Rollback: delete purchase if ticket creation fails
        await supabase.from('purchases').delete().eq('id', purchaseData.id);

        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create tickets',
          'No se pudieron crear las entradas. Intenta nuevamente.',
          ticketsError
        );
      }

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
        quantity: 1,
        totalAmount: t.price,
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
        quantity: 1,
        totalAmount: t.price,
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
        quantity: 1,
        totalAmount: data.price,
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
        quantity: 1,
        totalAmount: data.price,
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
          quantity: 1,
          totalAmount: t.price,
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
