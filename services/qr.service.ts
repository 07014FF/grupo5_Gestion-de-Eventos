/**
 * QR Code Service
 * Handles QR code generation, validation, and verification
 * Implements security measures to prevent forgery and duplication
 */

import { QRCodePayload, ValidationResult, TicketStatus } from '@/types/ticket.types';
import { AppError, ErrorCode, Result, Ok, Err } from '@/utils/errors';

/**
 * Simple hash function for creating signatures
 * In production, use a proper cryptographic library like crypto-js
 */
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a secure signature for QR code data
 * This prevents forgery by signing the payload with a secret
 */
function generateSignature(payload: Omit<QRCodePayload, 'signature'>): string {
  // In production, use a server-side secret and proper HMAC
  const SECRET_KEY = 'your-secret-key-change-in-production'; // TODO: Move to secure environment variable
  const dataString = `${payload.ticketId}-${payload.eventId}-${payload.userId}-${payload.purchaseDate}-${payload.timestamp}-${SECRET_KEY}`;
  return simpleHash(dataString);
}

/**
 * Verify the signature of QR code data
 */
function verifySignature(payload: QRCodePayload): boolean {
  const { signature, ...dataWithoutSignature } = payload;
  const expectedSignature = generateSignature(dataWithoutSignature);
  return signature === expectedSignature;
}

export class QRService {
  /**
   * Generate a unique, secure QR code data string for a ticket
   * @param ticketId - Unique ticket identifier
   * @param eventId - Event identifier
   * @param userId - User identifier
   * @param purchaseDate - Purchase date in ISO format
   * @returns Result with QR data string or error
   */
  static generateQRData(
    ticketId: string,
    eventId: string,
    userId: string,
    purchaseDate: string
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

      // Create payload
      const payload: Omit<QRCodePayload, 'signature'> = {
        ticketId,
        eventId,
        userId,
        purchaseDate,
        timestamp: Date.now(),
      };

      // Generate signature
      const signature = generateSignature(payload);

      // Create full payload
      const fullPayload: QRCodePayload = {
        ...payload,
        signature,
      };

      // Convert to JSON string (this will be encoded in the QR)
      const qrData = JSON.stringify(fullPayload);

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
   * Parse and validate QR code data
   * @param qrData - Raw QR data string
   * @returns Result with parsed payload or error
   */
  static parseQRData(qrData: string): Result<QRCodePayload> {
    try {
      // Parse JSON
      const payload = JSON.parse(qrData) as QRCodePayload;

      // Validate structure
      if (
        !payload.ticketId ||
        !payload.eventId ||
        !payload.userId ||
        !payload.purchaseDate ||
        !payload.signature ||
        !payload.timestamp
      ) {
        throw new AppError(
          ErrorCode.INVALID_QR_DATA,
          'Invalid QR data structure',
          'El código QR no contiene datos válidos.'
        );
      }

      // Verify signature
      if (!verifySignature(payload)) {
        throw new AppError(
          ErrorCode.TICKET_INVALID,
          'Invalid QR signature - possible forgery',
          'Este código QR no es válido o ha sido alterado.'
        );
      }

      // Check if QR is too old (e.g., generated more than 1 year ago)
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      if (payload.timestamp < oneYearAgo) {
        throw new AppError(
          ErrorCode.TICKET_EXPIRED,
          'QR code is too old',
          'Este código QR ha expirado.'
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
