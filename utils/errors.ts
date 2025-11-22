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
  DB_ERROR = 'DB_ERROR',
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
      [ErrorCode.DB_ERROR]: 'Error de base de datos. Por favor, intenta nuevamente.',
    };

    return messages[this.code] || messages[ErrorCode.UNKNOWN_ERROR];
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Errores operativos del usuario (esperados) - Se loggean como WARNING
   * El sistema funcionó correctamente al bloquear la acción inválida
   */
  private static readonly USER_OPERATION_ERRORS = new Set([
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INSUFFICIENT_FUNDS,
    ErrorCode.TICKET_ALREADY_USED,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.PAYMENT_CANCELLED,
    ErrorCode.TICKET_EXPIRED,
    ErrorCode.MISSING_REQUIRED_FIELD,
    ErrorCode.CAMERA_PERMISSION_DENIED,
  ]);

  /**
   * Errores críticos del sistema - Se loggean como ERROR
   * Algo falló que no debería haber fallado
   */
  private static readonly SYSTEM_CRITICAL_ERRORS = new Set([
    ErrorCode.UNKNOWN_ERROR,
    ErrorCode.SERVER_ERROR,
    ErrorCode.DB_ERROR,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.QR_GENERATION_FAILED,
    ErrorCode.PAYMENT_FAILED,
  ]);

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
   * Log error for debugging with intelligent severity levels
   * - User operation errors (expected): console.warn (amarillo/naranja)
   * - System critical errors (unexpected): console.error (rojo)
   */
  static log(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';

    if (error instanceof AppError) {
      const errorData = {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        details: error.details,
      };

      // Determinar el nivel de severidad
      const isUserOperation = this.USER_OPERATION_ERRORS.has(error.code);
      const isCritical = this.SYSTEM_CRITICAL_ERRORS.has(error.code);

      if (isUserOperation) {
        // Operación de usuario esperada (el sistema funcionó bien al bloquearla)
        console.warn(`⚠️ ${timestamp} ${contextStr} User Operation:`, errorData);
      } else if (isCritical) {
        // Error crítico del sistema (algo falló inesperadamente)
        console.error(`❌ ${timestamp} ${contextStr} System Error:`, errorData);
      } else {
        // Error de nivel medio (ni crítico ni totalmente esperado)
        console.warn(`⚠️ ${timestamp} ${contextStr} AppError:`, errorData);
      }
    } else if (error instanceof Error) {
      // Errores no manejados siempre son críticos
      console.error(`❌ ${timestamp} ${contextStr} Unhandled Error:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      // Errores desconocidos siempre son críticos
      console.error(`❌ ${timestamp} ${contextStr} Unknown Error:`, error);
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
