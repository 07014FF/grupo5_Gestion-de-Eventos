/**
 * QR Code Service
 * Handles QR code generation and parsing
 * Validation is done server-side via RPC for security
 */

import { QRCodePayload, ValidationResult, TicketStatus } from '@/types/ticket.types';
import { AppError, ErrorCode, Result, Ok, Err } from '@/utils/errors';

export class QRService {
  /**
   * Generate a QR code data string for a ticket
   * Server-side validation ensures security
   * @param ticketId - Unique ticket identifier (ticket_code)
   * @param eventId - Event identifier
   * @param userId - User identifier
   * @param purchaseDate - Purchase date in ISO format
   * @param metadata - Optional metadata (e.g., quantity)
   * @returns Result with QR data string or error
   */
  static generateQRData(
    ticketId: string,
    eventId: string,
    userId: string,
    purchaseDate: string,
    metadata?: Record<string, any>
  ): Result<string> {
    try {
      // Validate inputs
      if (!ticketId || !eventId || !userId || !purchaseDate) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Missing required fields for QR generation',
          'No se pudo generar el código QR. Datos incompletos.'
        );
      }

      // Create simple payload - validation is done server-side
      const payload = {
        ticketId, // This is the ticket_code
        eventId,
        userId,
        purchaseDate,
        ...(metadata && { metadata }),
      };

      // Convert to JSON string (this will be encoded in the QR)
      const qrData = JSON.stringify(payload);

      return Ok(qrData);
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.QR_GENERATION_FAILED,
          'Failed to generate QR data',
          'No se pudo generar el código QR. Intenta nuevamente.',
          error
        )
      );
    }
  }

  /**
   * Parse QR code data
   * Note: Validation is done server-side for security
   * @param qrData - Raw QR data string
   * @returns Result with parsed payload or error
   */
  static parseQRData(qrData: string): Result<QRCodePayload> {
    try {
      // Parse JSON
      const payload = JSON.parse(qrData) as QRCodePayload;

      // Validate structure (basic check)
      if (
        !payload.ticketId ||
        !payload.eventId ||
        !payload.userId ||
        !payload.purchaseDate
      ) {
        throw new AppError(
          ErrorCode.INVALID_QR_DATA,
          'Invalid QR data structure',
          'El código QR no contiene datos válidos.'
        );
      }

      return Ok(payload);
    } catch (error) {
      if (error instanceof AppError) {
        return Err(error);
      }

      if (error instanceof SyntaxError) {
        return Err(
          new AppError(
            ErrorCode.INVALID_QR_DATA,
            'Failed to parse QR data',
            'El código QR no tiene un formato válido.'
          )
        );
      }

      return Err(
        new AppError(
          ErrorCode.QR_SCAN_FAILED,
          'Failed to parse QR data',
          'No se pudo leer el código QR. Intenta nuevamente.',
          error
        )
      );
    }
  }

  /**
   * Validate a ticket using its QR data
   * This would typically check against a backend database
   * For now, it's a mock implementation
   *
   * @param qrData - Raw QR data string
   * @param ticketStatus - Current ticket status from database
   * @param eventDate - Event date to check expiration
   * @returns ValidationResult with ticket validity
   */
  static async validateTicket(
    qrData: string,
    ticketStatus?: TicketStatus,
    eventDate?: string
  ): Promise<ValidationResult> {
    try {
      // Parse QR data
      const parseResult = this.parseQRData(qrData);
      if (!parseResult.success) {
        return {
          isValid: false,
          status: 'invalid',
          message: parseResult.error.getUserMessage(),
          errorCode: parseResult.error.code,
        };
      }

      const payload = parseResult.data;

      // Check if ticket has already been used
      if (ticketStatus === TicketStatus.USED) {
        return {
          isValid: false,
          status: TicketStatus.USED,
          message: 'Esta entrada ya fue utilizada anteriormente.',
          errorCode: ErrorCode.TICKET_ALREADY_USED,
          validatedAt: new Date().toISOString(),
        };
      }

      // Check if ticket is cancelled
      if (ticketStatus === TicketStatus.CANCELLED) {
        return {
          isValid: false,
          status: TicketStatus.CANCELLED,
          message: 'Esta entrada ha sido cancelada.',
          errorCode: ErrorCode.TICKET_INVALID,
        };
      }

      // Check if event has expired
      if (eventDate) {
        const eventDateTime = new Date(eventDate).getTime();
        const now = Date.now();

        // Event expired (more than 24 hours after event date)
        if (now > eventDateTime + 24 * 60 * 60 * 1000) {
          return {
            isValid: false,
            status: TicketStatus.EXPIRED,
            message: 'Esta entrada ha expirado. El evento ya finalizó.',
            errorCode: ErrorCode.TICKET_EXPIRED,
          };
        }
      }

      // TODO: In production, verify against backend database
      // - Check if ticketId exists
      // - Verify userId matches
      // - Ensure ticket hasn't been validated recently (prevent double-scan)
      // - Log validation attempt

      // Ticket is valid
      return {
        isValid: true,
        status: TicketStatus.ACTIVE,
        message: 'Entrada válida. El usuario puede ingresar al evento.',
        validatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(
            ErrorCode.UNKNOWN_ERROR,
            'Validation failed',
            'Error al validar la entrada.',
            error
          );

      return {
        isValid: false,
        status: 'invalid',
        message: appError.getUserMessage(),
        errorCode: appError.code,
      };
    }
  }

  /**
   * Generate a unique ticket code
   * Format: TKT-YYYY-XXXXXX
   */
  static generateTicketCode(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${year}-${random}`;
  }
}
