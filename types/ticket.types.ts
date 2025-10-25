/**
 * Type definitions for ticket management system
 * Provides type safety and clear contracts for all ticket-related operations
 */

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export type PaymentMethod =
  | 'card'
  | 'pse'
  | 'nequi'
  | 'daviplata'
  | 'cash'
  | 'bank_transfer';

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  date: string;
  time: string;
  location: string;
  venue?: string;
  price: number;
  availableTickets: number;
  category?: string;
  rating?: number;
}

export interface Ticket {
  id: string;
  ticketCode: string; // Unique QR code data
  eventId: string;
  event: Event;
  userId: string;
  purchaseDate: string;
  status: TicketStatus;
  ticketType: string;
  seatNumber?: string;
  price: number;
  quantity: number;
  totalAmount: number;
  qrCodeData: string; // Encrypted/signed QR data
  usedAt?: string;
  validatedBy?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  eventId: string;
  tickets: Ticket[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  purchaseDate: string;
  userInfo: UserInfo;
  transactionId?: string;
}

export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

export interface QRCodePayload {
  ticketId: string;
  eventId: string;
  userId: string;
  purchaseDate: string;
  signature: string; // For validation and anti-forgery
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  status: TicketStatus | 'invalid';
  message: string;
  errorCode?: string;
  validatedAt?: string;
}

export interface ScanResult {
  success: boolean;
  data?: string;
  error?: string;
}
