/**
 * Ticket Service
 * Manages ticket purchases, storage, and retrieval
 * Integrates with QR service for secure ticket generation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEYS = {
  TICKETS: '@tickets',
  PURCHASES: '@purchases',
} as const;

export class TicketService {
  /**
   * Create a new ticket purchase
   * Generates QR codes and saves tickets locally
   *
   * @param event - Event information
   * @param quantity - Number of tickets
   * @param userInfo - Buyer information
   * @param paymentMethod - Payment method used
   * @param userId - User identifier
   * @returns Result with created purchase or error
   */
  static async createPurchase(
    event: Event,
    quantity: number,
    userInfo: UserInfo,
    paymentMethod: PaymentMethod,
    userId: string
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

      if (event.availableTickets < quantity) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Not enough tickets available',
          'No hay suficientes entradas disponibles.'
        );
      }

      const purchaseDate = new Date().toISOString();
      const purchaseId = this.generatePurchaseId();

      // Create tickets
      const tickets: Ticket[] = [];

      for (let i = 0; i < quantity; i++) {
        const ticketCode = QRService.generateTicketCode();
        const ticketId = `${purchaseId}-${i + 1}`;

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

        const ticket: Ticket = {
          id: ticketId,
          ticketCode,
          eventId: event.id,
          event,
          userId,
          purchaseDate,
          status: TicketStatus.ACTIVE,
          ticketType: 'General', // TODO: Make this configurable
          price: event.price,
          quantity: 1,
          totalAmount: event.price,
          qrCodeData: qrResult.data,
        };

        tickets.push(ticket);
      }

      // Create purchase record
      const purchase: Purchase = {
        id: purchaseId,
        userId,
        eventId: event.id,
        tickets,
        totalAmount: event.price * quantity,
        paymentMethod,
        paymentStatus: PaymentStatus.COMPLETED, // In production, this would be PENDING until payment confirms
        purchaseDate,
        userInfo,
      };

      // Save purchase and tickets
      await this.savePurchase(purchase);
      await this.saveTickets(tickets);

      return Ok(purchase);
    } catch (error) {
      ErrorHandler.log(error, 'TicketService.createPurchase');

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
      const ticketsJson = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);

      if (!ticketsJson) {
        return Ok([]);
      }

      const allTickets: Ticket[] = JSON.parse(ticketsJson);
      const userTickets = allTickets.filter((ticket) => ticket.userId === userId);

      // Sort by purchase date (newest first)
      userTickets.sort((a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      );

      return Ok(userTickets);
    } catch (error) {
      ErrorHandler.log(error, 'TicketService.getUserTickets');

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
      const ticketsJson = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);

      if (!ticketsJson) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          'No tickets found',
          'No se encontró la entrada.'
        );
      }

      const allTickets: Ticket[] = JSON.parse(ticketsJson);
      const ticket = allTickets.find((t) => t.id === ticketId);

      if (!ticket) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          `Ticket ${ticketId} not found`,
          'No se encontró la entrada solicitada.'
        );
      }

      return Ok(ticket);
    } catch (error) {
      ErrorHandler.log(error, 'TicketService.getTicketById');

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
  static async markTicketAsUsed(ticketId: string): Promise<Result<Ticket>> {
    try {
      const ticketsJson = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);

      if (!ticketsJson) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          'No tickets found',
          'No se encontró la entrada.'
        );
      }

      const allTickets: Ticket[] = JSON.parse(ticketsJson);
      const ticketIndex = allTickets.findIndex((t) => t.id === ticketId);

      if (ticketIndex === -1) {
        throw new AppError(
          ErrorCode.TICKET_NOT_FOUND,
          `Ticket ${ticketId} not found`,
          'No se encontró la entrada.'
        );
      }

      // Update ticket status
      allTickets[ticketIndex] = {
        ...allTickets[ticketIndex],
        status: TicketStatus.USED,
        usedAt: new Date().toISOString(),
      };

      // Save updated tickets
      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(allTickets));

      return Ok(allTickets[ticketIndex]);
    } catch (error) {
      ErrorHandler.log(error, 'TicketService.markTicketAsUsed');

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
      const purchasesJson = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASES);

      if (!purchasesJson) {
        return Ok([]);
      }

      const allPurchases: Purchase[] = JSON.parse(purchasesJson);
      const userPurchases = allPurchases.filter((p) => p.userId === userId);

      // Sort by purchase date (newest first)
      userPurchases.sort((a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      );

      return Ok(userPurchases);
    } catch (error) {
      ErrorHandler.log(error, 'TicketService.getPurchaseHistory');

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

  /**
   * Private helper methods
   */

  private static async savePurchase(purchase: Purchase): Promise<void> {
    try {
      const purchasesJson = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASES);
      const purchases: Purchase[] = purchasesJson ? JSON.parse(purchasesJson) : [];

      purchases.push(purchase);
      await AsyncStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    } catch (error) {
      throw new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to save purchase',
        'No se pudo guardar la compra.',
        error
      );
    }
  }

  private static async saveTickets(tickets: Ticket[]): Promise<void> {
    try {
      const ticketsJson = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      const existingTickets: Ticket[] = ticketsJson ? JSON.parse(ticketsJson) : [];

      const updatedTickets = [...existingTickets, ...tickets];
      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
    } catch (error) {
      throw new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to save tickets',
        'No se pudieron guardar las entradas.',
        error
      );
    }
  }

  private static generatePurchaseId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `PUR-${timestamp}-${random}`.toUpperCase();
  }
}
