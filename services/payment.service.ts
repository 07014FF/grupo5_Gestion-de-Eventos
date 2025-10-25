/**
 * Payment Service
 * Handles payment processing through different payment gateways
 * Supports: Stripe, Wompi, MercadoPago
 */

import { ErrorHandler, AppError, ErrorCode, Ok, Err, Result } from '@/utils/errors';
import { PaymentMethod } from '@/types/ticket.types';

// ============================================================================
// TYPES
// ============================================================================

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  WOMPI = 'wompi',
  MERCADOPAGO = 'mercadopago',
  MOCK = 'mock', // Para desarrollo/testing
}

export interface PaymentIntent {
  id: string;
  amount: number; // En centavos (ej: 45000 = $450.00)
  currency: string; // 'COP', 'USD', etc.
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  customerId?: string;
  metadata: {
    eventId: string;
    userId: string;
    quantity: number;
    [key: string]: any;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Si no se especifica, se reembolsa todo
  reason?: string;
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export class PaymentService {
  private static currentGateway: PaymentGateway = PaymentGateway.MOCK;

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  /**
   * Set the payment gateway to use
   */
  static setGateway(gateway: PaymentGateway): void {
    this.currentGateway = gateway;
  }

  /**
   * Get current payment gateway
   */
  static getGateway(): PaymentGateway {
    return this.currentGateway;
  }

  // -------------------------------------------------------------------------
  // Payment Processing
  // -------------------------------------------------------------------------

  /**
   * Create a payment intent
   * This initializes the payment process
   */
  static async createPaymentIntent(
    amount: number,
    paymentMethod: PaymentMethod,
    metadata: PaymentIntent['metadata']
  ): Promise<Result<PaymentIntent>> {
    try {
      // Validations
      if (amount <= 0) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid payment amount',
          'El monto del pago debe ser mayor a cero.'
        );
      }

      const paymentIntent: PaymentIntent = {
        id: this.generatePaymentId(),
        amount,
        currency: 'COP', // Por defecto Colombia
        paymentMethod,
        gateway: this.currentGateway,
        metadata,
      };

      return Ok(paymentIntent);
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.createPaymentIntent');
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create payment intent'
        )
      );
    }
  }

  /**
   * Process a payment
   * This is the main payment processing method
   */
  static async processPayment(
    paymentIntent: PaymentIntent
  ): Promise<Result<PaymentResult>> {
    try {
      switch (this.currentGateway) {
        case PaymentGateway.STRIPE:
          return await this.processStripePayment(paymentIntent);

        case PaymentGateway.WOMPI:
          return await this.processWompiPayment(paymentIntent);

        case PaymentGateway.MERCADOPAGO:
          return await this.processMercadoPagoPayment(paymentIntent);

        case PaymentGateway.MOCK:
          return await this.processMockPayment(paymentIntent);

        default:
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'Unsupported payment gateway',
            'Pasarela de pago no soportada.'
          );
      }
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.processPayment');
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Payment processing failed'
        )
      );
    }
  }

  // -------------------------------------------------------------------------
  // Gateway-specific implementations
  // -------------------------------------------------------------------------

  /**
   * Process payment through Stripe
   * TODO: Implement Stripe integration
   */
  private static async processStripePayment(
    intent: PaymentIntent
  ): Promise<Result<PaymentResult>> {
    try {
      // TODO: Integrate Stripe SDK
      // const stripe = require('@stripe/stripe-react-native');
      // const paymentIntent = await stripe.createPaymentIntent({...});
      // const result = await stripe.confirmPayment(paymentIntent);

      console.log('🔵 Stripe payment would be processed here');
      console.log('Payment Intent:', intent);

      return Ok({
        success: true,
        paymentId: intent.id,
        status: PaymentStatus.PENDING,
        errorMessage: 'Stripe integration pending. Please configure Stripe SDK.',
      });
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.processStripePayment');
      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Stripe payment failed',
          'No se pudo procesar el pago con Stripe.'
        )
      );
    }
  }

  /**
   * Process payment through Wompi (Popular in Colombia)
   * Full integration with Wompi API
   */
  private static async processWompiPayment(
    intent: PaymentIntent
  ): Promise<Result<PaymentResult>> {
    try {
      const publicKey = process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY;
      const apiUrl = process.env.EXPO_PUBLIC_WOMPI_API_URL;

      if (!publicKey || publicKey === 'pub_test_PLACEHOLDER') {
        console.warn('⚠️ Wompi not configured, using mock payment instead');
        return this.processMockPayment(intent);
      }

      console.log('🟢 Processing Wompi payment...');

      // Step 1: Get acceptance token (required by Wompi)
      const acceptanceResponse = await fetch(`${apiUrl}/merchants/${publicKey}`);

      if (!acceptanceResponse.ok) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Failed to get Wompi acceptance token',
          'No se pudo conectar con Wompi. Intenta nuevamente.'
        );
      }

      const acceptanceData = await acceptanceResponse.json();
      const acceptanceToken = acceptanceData.data.presigned_acceptance.acceptance_token;

      // Step 2: Create transaction
      const transactionPayload = {
        amount_in_cents: intent.amount, // Already in cents
        currency: 'COP',
        customer_email: intent.metadata.email || 'customer@example.com',
        payment_method: {
          type: this.mapPaymentMethodToWompi(intent.paymentMethod),
          installments: 1,
        },
        reference: intent.id,
        acceptance_token: acceptanceToken,
        customer_data: {
          phone_number: intent.metadata.phone || '3001234567',
          full_name: intent.metadata.name || 'Usuario',
        },
        redirect_url: 'myapp://payment-result', // Deep link para volver a la app
      };

      const transactionResponse = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionPayload),
      });

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json();
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Wompi transaction failed',
          errorData.error?.messages?.join(', ') || 'Error al procesar el pago con Wompi.'
        );
      }

      const transactionData = await transactionResponse.json();
      const transaction = transactionData.data;

      console.log('✅ Wompi transaction created:', transaction.id);

      // Step 3: Map Wompi status to our PaymentStatus
      const status = this.mapWompiStatusToPaymentStatus(transaction.status);

      return Ok({
        success: status === PaymentStatus.COMPLETED,
        paymentId: intent.id,
        status,
        transactionId: transaction.id,
        receiptUrl: transaction.payment_link_url,
        metadata: {
          wompiTransactionId: transaction.id,
          wompiStatus: transaction.status,
          paymentLink: transaction.payment_link_url,
        },
      });
    } catch (error: any) {
      ErrorHandler.log(error, 'PaymentService.processWompiPayment');

      if (error instanceof AppError) {
        return Err(error);
      }

      const errorMessage = error.message || 'No se pudo procesar el pago con Wompi.';

      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Wompi payment failed',
          errorMessage
        )
      );
    }
  }

  /**
   * Map our PaymentMethod to Wompi payment type
   */
  private static mapPaymentMethodToWompi(method: PaymentMethod): string {
    const mapping: Record<PaymentMethod, string> = {
      card: 'CARD',
      pse: 'PSE',
      nequi: 'NEQUI',
      daviplata: 'BANCOLOMBIA_TRANSFER',
      cash: 'BANCOLOMBIA_COLLECT',
      bank_transfer: 'BANCOLOMBIA_TRANSFER',
    };
    return mapping[method] || 'CARD';
  }

  /**
   * Map Wompi status to our PaymentStatus
   */
  private static mapWompiStatusToPaymentStatus(wompiStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'APPROVED': PaymentStatus.COMPLETED,
      'PENDING': PaymentStatus.PENDING,
      'DECLINED': PaymentStatus.FAILED,
      'VOIDED': PaymentStatus.CANCELLED,
      'ERROR': PaymentStatus.FAILED,
    };
    return mapping[wompiStatus] || PaymentStatus.PENDING;
  }

  /**
   * Process payment through MercadoPago
   * TODO: Implement MercadoPago integration
   */
  private static async processMercadoPagoPayment(
    intent: PaymentIntent
  ): Promise<Result<PaymentResult>> {
    try {
      // TODO: Integrate MercadoPago SDK
      // const mercadopago = require('mercadopago');
      // const payment = await mercadopago.payment.create({...});

      console.log('🟡 MercadoPago payment would be processed here');
      console.log('Payment Intent:', intent);

      return Ok({
        success: true,
        paymentId: intent.id,
        status: PaymentStatus.PENDING,
        errorMessage: 'MercadoPago integration pending. Configure API credentials.',
      });
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.processMercadoPagoPayment');
      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'MercadoPago payment failed',
          'No se pudo procesar el pago con MercadoPago.'
        )
      );
    }
  }

  /**
   * Mock payment for development/testing
   * Simulates a successful payment after 2 seconds
   */
  private static async processMockPayment(
    intent: PaymentIntent
  ): Promise<Result<PaymentResult>> {
    try {
      console.log('🎭 Mock payment processing...');
      console.log('Payment Intent:', intent);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate 95% success rate
      const isSuccess = Math.random() > 0.05;

      if (!isSuccess) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Mock payment failed',
          'El pago fue rechazado por el banco. Intenta con otro método.'
        );
      }

      const result: PaymentResult = {
        success: true,
        paymentId: intent.id,
        status: PaymentStatus.COMPLETED,
        transactionId: `MOCK-${Date.now()}`,
        receiptUrl: `https://example.com/receipt/${intent.id}`,
        metadata: {
          gateway: 'mock',
          processedAt: new Date().toISOString(),
        },
      };

      console.log('✅ Mock payment successful:', result);
      return Ok(result);
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.processMockPayment');
      if (error instanceof AppError) {
        return Err(error);
      }
      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Mock payment failed'
        )
      );
    }
  }

  // -------------------------------------------------------------------------
  // Payment Status & Verification
  // -------------------------------------------------------------------------

  /**
   * Get payment status
   */
  static async getPaymentStatus(
    paymentId: string
  ): Promise<Result<PaymentStatus>> {
    try {
      // TODO: Implement status checking per gateway
      // For now, return mock status

      return Ok(PaymentStatus.COMPLETED);
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.getPaymentStatus');
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to get payment status'
        )
      );
    }
  }

  /**
   * Verify payment webhook
   * Used to verify payment confirmations from the gateway
   */
  static async verifyWebhook(
    payload: any,
    signature: string
  ): Promise<Result<PaymentResult>> {
    try {
      // TODO: Implement webhook verification per gateway
      // Each gateway has different signature verification

      return Ok({
        success: true,
        paymentId: payload.paymentId,
        status: PaymentStatus.COMPLETED,
      });
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.verifyWebhook');
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to verify webhook'
        )
      );
    }
  }

  // -------------------------------------------------------------------------
  // Refunds
  // -------------------------------------------------------------------------

  /**
   * Refund a payment
   */
  static async refundPayment(
    request: RefundRequest
  ): Promise<Result<PaymentResult>> {
    try {
      // TODO: Implement refund per gateway
      console.log('🔄 Processing refund:', request);

      return Ok({
        success: true,
        paymentId: request.paymentId,
        status: PaymentStatus.REFUNDED,
      });
    } catch (error) {
      ErrorHandler.log(error, 'PaymentService.refundPayment');
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to process refund'
        )
      );
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private static generatePaymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Format amount from dollars to cents
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount from cents to dollars
   */
  static fromCents(cents: number): number {
    return cents / 100;
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(method: PaymentMethod): string {
    const names: Record<PaymentMethod, string> = {
      card: 'Tarjeta de Crédito/Débito',
      pse: 'PSE',
      nequi: 'Nequi',
      daviplata: 'Daviplata',
      cash: 'Efectivo',
      bank_transfer: 'Transferencia Bancaria',
    };
    return names[method] || method;
  }
}
