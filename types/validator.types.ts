/**
 * Tipos para el sistema de validación de entradas
 */

export interface TicketValidation {
  id: string;
  ticketId: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  ticketType: 'general' | 'student';
  quantity: number;
  totalAmount: number;
  validatedAt: string;
  validatedBy: string;
  validatorName: string;
  status: 'valid' | 'invalid' | 'already_used' | 'cancelled';
  synced: boolean; // Para modo offline
}

export interface ValidationResult {
  success: boolean;
  status: 'valid' | 'invalid' | 'already_used' | 'cancelled';
  message: string;
  ticket?: {
    id: string;
    code: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    userId: string;
    userName: string;
    userEmail: string;
    ticketType: 'general' | 'student';
    quantity: number;
    totalAmount: number;
    purchaseDate: string;
    paymentStatus: string;
    previousValidation?: {
      validatedAt: string;
      validatedBy: string;
      validatorName: string;
    };
  };
}

export interface ValidatorStats {
  eventId: string;
  eventTitle: string;
  totalCapacity: number;
  totalValidated: number;
  validatedToday: number;
  validatedByType: {
    general: number;
    student: number;
  };
  validatedByHour: {
    hour: string;
    count: number;
  }[];
  revenue: {
    total: number;
    today: number;
  };
  lastValidation?: {
    time: string;
    userName: string;
  };
}

export interface OfflineValidation {
  id: string;
  ticketCode: string;
  eventId: string;
  validatedAt: string;
  validatedBy: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: string;
}

export interface ValidatorEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  validatedCount: number;
  isActive: boolean;
}
