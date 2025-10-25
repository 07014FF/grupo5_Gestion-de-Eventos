/**
 * Custom error handling utilities
 * Provides structured error handling with specific error types and user-friendly messages
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Ticket errors
  TICKET_NOT_FOUND = 'TICKET_NOT_FOUND',
  TICKET_ALREADY_USED = 'TICKET_ALREADY_USED',
  TICKET_EXPIRED = 'TICKET_EXPIRED',
  TICKET_INVALID = 'TICKET_INVALID',

  // QR errors
  QR_GENERATION_FAILED = 'QR_GENERATION_FAILED',
  QR_SCAN_FAILED = 'QR_SCAN_FAILED',
  INVALID_QR_DATA = 'INVALID_QR_DATA',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Camera errors
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_AVAILABLE = 'CAMERA_NOT_AVAILABLE',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get a user-friendly message for display
   */
  getUserMessage(): string {
    return this.userMessage || this.getDefaultUserMessage();
  }

  /**
   * Get default user-friendly messages based on error code
   */
  private getDefaultUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      [ErrorCode.TIMEOUT]: 'La operación tomó demasiado tiempo. Intenta nuevamente.',
      [ErrorCode.UNAUTHORIZED]: 'Debes iniciar sesión para continuar.',
      [ErrorCode.INVALID_TOKEN]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      [ErrorCode.TICKET_NOT_FOUND]: 'No se encontró la entrada solicitada.',
      [ErrorCode.TICKET_ALREADY_USED]: 'Esta entrada ya fue utilizada.',
      [ErrorCode.TICKET_EXPIRED]: 'Esta entrada ha expirado.',
      [ErrorCode.TICKET_INVALID]: 'Esta entrada no es válida.',
      [ErrorCode.QR_GENERATION_FAILED]: 'No se pudo generar el código QR. Intenta nuevamente.',
      [ErrorCode.QR_SCAN_FAILED]: 'No se pudo escanear el código QR. Intenta nuevamente.',
      [ErrorCode.INVALID_QR_DATA]: 'El código QR no es válido.',
      [ErrorCode.PAYMENT_FAILED]: 'El pago no pudo ser procesado. Intenta nuevamente.',
      [ErrorCode.INSUFFICIENT_FUNDS]: 'Fondos insuficientes para completar la transacción.',
      [ErrorCode.PAYMENT_CANCELLED]: 'El pago fue cancelado.',
      [ErrorCode.VALIDATION_ERROR]: 'Por favor, verifica los datos ingresados.',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Por favor, completa todos los campos requeridos.',
      [ErrorCode.CAMERA_PERMISSION_DENIED]: 'Se requiere permiso de cámara para escanear códigos QR.',
      [ErrorCode.CAMERA_NOT_AVAILABLE]: 'La cámara no está disponible en este dispositivo.',
      [ErrorCode.UNKNOWN_ERROR]: 'Ocurrió un error inesperado. Intenta nuevamente.',
      [ErrorCode.SERVER_ERROR]: 'Error del servidor. Intenta nuevamente más tarde.',
    };

    return messages[this.code] || messages[ErrorCode.UNKNOWN_ERROR];
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle an error and return a user-friendly message
   */
  static handle(error: unknown): { message: string; code: ErrorCode } {
    if (error instanceof AppError) {
      return {
        message: error.getUserMessage(),
        code: error.code,
      };
    }

    if (error instanceof Error) {
      console.error('Unhandled error:', error);
      return {
        message: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        code: ErrorCode.UNKNOWN_ERROR,
      };
    }

    console.error('Unknown error type:', error);
    return {
      message: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
      code: ErrorCode.UNKNOWN_ERROR,
    };
  }

  /**
   * Log error for debugging (can be extended to send to analytics)
   */
  static log(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';

    if (error instanceof AppError) {
      console.error(`${timestamp} ${contextStr} AppError:`, {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        details: error.details,
      });
    } else if (error instanceof Error) {
      console.error(`${timestamp} ${contextStr} Error:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(`${timestamp} ${contextStr} Unknown error:`, error);
    }
  }
}

/**
 * Result type for operations that can fail
 * Inspired by Rust's Result type for better error handling
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper function to create a successful result
 */
export function Ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper function to create a failed result
 */
export function Err<E = AppError>(error: E): Result<never, E> {
  return { success: false, error };
}
