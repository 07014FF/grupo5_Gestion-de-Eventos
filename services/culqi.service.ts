/**
 * Culqi Service
 * Servicio para integración con Culqi (Pasarela de pagos de Perú)
 *
 * Documentación: https://docs.culqi.com/
 * Panel de integración (sandbox): https://integ-panel.culqi.com/
 *
 * MODO SANDBOX - Solo para desarrollo/testing
 */

import axios from 'axios';
import { ErrorHandler, AppError, ErrorCode, Ok, Err, Result } from '@/utils/errors';
import { CULQI_CONFIG, isCulqiConfigured, isCulqiOfflineMode } from '@/config/culqi.config';

const OFFLINE_QR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="300" height="300" fill="#0f172a"/>
      <text x="50%" y="50%" fill="#00d084" font-family="monospace" font-size="32" text-anchor="middle">QR OFFLINE</text>
      <text x="50%" y="65%" fill="#94a3b8" font-family="monospace" font-size="18" text-anchor="middle">Modo Sandbox</text>
    </svg>`
  );

// ============================================================================
// TYPES
// ============================================================================

export interface CulqiCardData {
  cardNumber: string;
  cvv: string;
  expirationMonth: string;
  expirationYear: string;
  email: string;
}

export interface CulqiToken {
  id: string;
  type: string;
  email: string;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    bin: string;
    card_brand: string;
    card_type: string;
    card_category: string;
    issuer: {
      name: string;
      country: string;
      country_code: string;
    };
  };
  client: {
    ip: string;
    ip_country: string;
    ip_country_code: string;
    browser: string;
    device_type: string;
  };
  metadata?: Record<string, any>;
}

export interface CulqiCharge {
  id: string;
  amount: number;
  amount_refunded: number;
  current_amount: number;
  installments: number;
  currency_code: string;
  email: string;
  description: string;
  source: {
    id: string;
    type: string;
    card_brand: string;
    card_type: string;
    last_four: string;
  };
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  reference_code: string;
  authorization_code: string;
  metadata: Record<string, any>;
  total_fee: number;
  fee_details: {
    fixed_fee: {
      total: number;
      currency_code: string;
    };
    variable_fee: {
      currency_code: string;
      commision: number;
      total: number;
    };
  };
  net_amount: number;
  duplicate: boolean;
  tos_uri: string;
  policy_uri: string;
  creation_date: number;
}

export interface CulqiOrder {
  id: string;
  amount: number;
  currency_code: string;
  description: string;
  order_number: string;
  state: 'pending' | 'paid' | 'expired' | 'deleted';
  client_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  payment_code: string;
  qr_image: string;
  expiration_date: number;
  paid_at?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CULQI SERVICE
// ============================================================================

export class CulqiService {
  private static offlineOrders = new Map<string, CulqiOrder>();

  static isOfflineMode(): boolean {
    return isCulqiOfflineMode();
  }

  private static async simulateOfflineLatency(min = 250, max = 900): Promise<void> {
    const duration = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private static generateMockId(prefix: string): string {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${random}_${Date.now().toString(36)}`;
  }

  private static createMockToken(cardData: CulqiCardData): CulqiToken {
    const digits = cardData.cardNumber.replace(/\s/g, '') || '4242424242424242';
    const brand = this.detectCardBrand(cardData.cardNumber);
    const lastFour = digits.slice(-4) || '4242';

    return {
      id: this.generateMockId('tok_mock'),
      type: 'card',
      email: cardData.email,
      card_number: digits,
      last_four: lastFour,
      active: true,
      iin: {
        bin: digits.slice(0, 6) || '424242',
        card_brand: brand,
        card_type: 'credito',
        card_category: 'classic',
        issuer: {
          name: 'Sandbox Bank',
          country: 'Perú',
          country_code: 'PE',
        },
      },
      client: {
        ip: '127.0.0.1',
        ip_country: 'Perú',
        ip_country_code: 'PE',
        browser: 'Sandbox',
        device_type: 'mobile',
      },
      metadata: {
        offlineMode: true,
        generated_at: new Date().toISOString(),
      },
    };
  }

  private static createMockCharge(
    tokenId: string,
    amount: number,
    currency: string,
    email: string,
    description: string,
    metadata?: Record<string, any>
  ): CulqiCharge {
    const now = Math.floor(Date.now() / 1000);
    const reference = `MOCK-${now}`;

    return {
      id: this.generateMockId('chr_mock'),
      amount,
      amount_refunded: 0,
      current_amount: amount,
      installments: 0,
      currency_code: currency,
      email,
      description,
      source: {
        id: tokenId,
        type: 'token',
        card_brand: metadata?.cardBrand || 'Visa',
        card_type: metadata?.cardType || 'credito',
        last_four: metadata?.lastFour || '4242',
      },
      outcome: {
        type: 'venta_exitosa',
        code: 'mock_success',
        merchant_message: 'Pago simulado correctamente (modo offline).',
        user_message: 'Pago aprobado (modo demostración).',
      },
      reference_code: reference,
      authorization_code: `AUTH${now}`,
      metadata: {
        ...metadata,
        offlineMode: true,
      },
      total_fee: 0,
      fee_details: {
        fixed_fee: {
          total: 0,
          currency_code: currency,
        },
        variable_fee: {
          currency_code: currency,
          commision: 0,
          total: 0,
        },
      },
      net_amount: amount,
      duplicate: false,
      tos_uri: 'https://culqi.com/terminos',
      policy_uri: 'https://culqi.com/politicas',
      creation_date: now,
    };
  }

  private static createMockOrder(params: {
    amount: number;
    currency_code: string;
    description: string;
    order_number: string;
    client_details: CulqiOrder['client_details'];
    expiration_date: number;
  }): CulqiOrder {
    const order: CulqiOrder = {
      id: this.generateMockId('ord_mock'),
      amount: params.amount,
      currency_code: params.currency_code,
      description: params.description,
      order_number: params.order_number,
      state: 'pending',
      client_details: params.client_details,
      payment_code: `P-${Math.floor(Math.random() * 900000 + 100000)}`,
      qr_image: OFFLINE_QR_PLACEHOLDER,
      expiration_date: params.expiration_date,
      metadata: {
        offlineMode: true,
      },
    };

    this.offlineOrders.set(order.id, order);
    return order;
  }

  /**
   * Verificar si Culqi está configurado
   */
  static isConfigured(): boolean {
    const configured = isCulqiConfigured();
    console.log('🔍 Culqi configured?', configured);
    console.log('🔑 Public Key:', CULQI_CONFIG.publicKey);
    console.log('🔐 Secret Key:', CULQI_CONFIG.secretKey?.substring(0, 10) + '...');
    console.log('📴 Culqi offline mode?', this.isOfflineMode());
    return configured;
  }

  // --------------------------------------------------------------------------
  // TOKENIZACIÓN (Cliente)
  // --------------------------------------------------------------------------

  /**
   * Crear un token de tarjeta
   * Este método se ejecuta en el cliente y tokeniza la información de la tarjeta
   *
   * @param cardData - Datos de la tarjeta
   * @returns Token de Culqi que se usa para crear el cargo
   */
  static async createToken(cardData: CulqiCardData): Promise<Result<CulqiToken>> {
    try {
      if (this.isOfflineMode()) {
        await this.simulateOfflineLatency();
        const token = this.createMockToken(cardData);
        console.log('🧪 Token mock (offline) generado:', token.id);
        return Ok(token);
      }

      if (!this.isConfigured()) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Culqi not configured',
          'La pasarela de pagos no está configurada correctamente.'
        );
      }

      const publicKey = CULQI_CONFIG.publicKey?.trim();
      if (!publicKey || !publicKey.startsWith('pk_')) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Invalid Culqi public key',
          'La configuración de Culqi es inválida. Verifica la clave pública en el archivo .env.'
        );
      }

      const tokenPayload = {
        card_number: cardData.cardNumber.replace(/\s/g, ''),
        cvv: cardData.cvv,
        expiration_month: cardData.expirationMonth.padStart(2, '0'),
        expiration_year: cardData.expirationYear,
        email: cardData.email,
      };

      const tokenUrl = `${CULQI_CONFIG.secureUrl}/v2/tokens`;
      console.log('🔐 Tokenizando tarjeta con Culqi...', { tokenUrl });

      const response = await axios.post<CulqiToken>(
        tokenUrl,
        tokenPayload,
        {
          headers: {
            'Authorization': `Bearer ${publicKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const token = response.data;
      console.log('✅ Token creado:', token.id);

      return Ok(token);
    } catch (error: any) {
      ErrorHandler.log(error, 'CulqiService.createToken');

      if (axios.isAxiosError?.(error) && error.response?.data) {
        const culqiError = error.response.data as { user_message?: string; merchant_message?: string };
        const userMessage = culqiError.user_message || culqiError.merchant_message || 'No se pudo procesar la tarjeta.';
        return Err(
          new AppError(
            ErrorCode.PAYMENT_FAILED,
            'Token creation failed',
            userMessage
          )
        );
      }

      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Token creation failed',
          'No se pudo procesar la tarjeta. Verifica los datos e intenta nuevamente.'
        )
      );
    }
  }

  // --------------------------------------------------------------------------
  // CARGOS (Servidor)
  // --------------------------------------------------------------------------

  /**
   * Crear un cargo (charge) con un token
   *
   * @param tokenId - ID del token de tarjeta
   * @param amount - Monto en centavos (ej: 4500 = S/45.00)
   * @param currency - Código de moneda (PEN, USD, etc.)
   * @param email - Email del cliente
   * @param description - Descripción del cargo
   * @param metadata - Metadata adicional
   */
  static async createCharge(
    tokenId: string,
    amount: number,
    currency: string,
    email: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<Result<CulqiCharge>> {
    try {
      if (this.isOfflineMode()) {
        await this.simulateOfflineLatency();
        const charge = this.createMockCharge(tokenId, amount, currency, email, description, metadata);
        console.log('🧪 Cargo mock (offline) creado:', charge.id);
        return Ok(charge);
      }

      if (!this.isConfigured()) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Culqi not configured',
          'La pasarela de pagos no está configurada correctamente.'
        );
      }

      console.log(`💳 Creando cargo de ${currency} ${amount / 100} con Culqi...`);

      const chargePayload = {
        amount,
        currency_code: currency,
        email,
        source_id: tokenId,
        description,
        metadata: metadata || {},
        antifraud_details: {
          // Detalles antifraude opcionales pero recomendados
          address: metadata?.address || '',
          address_city: metadata?.city || '',
          country_code: metadata?.country_code || 'PE',
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          phone_number: metadata?.phone || '',
        },
      };

      const response = await axios.post(
        `${CULQI_CONFIG.apiUrl}/charges`,
        chargePayload,
        {
          headers: {
            'Authorization': `Bearer ${CULQI_CONFIG.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const charge: CulqiCharge = response.data;
      console.log('✅ Cargo creado:', charge.id);
      console.log('📊 Estado:', charge.outcome.type);

      return Ok(charge);
    } catch (error: any) {
      ErrorHandler.log(error, 'CulqiService.createCharge');

      // Manejar errores específicos de Culqi
      if (error.response?.data) {
        const culqiError = error.response.data;
        const userMessage = culqiError.user_message || culqiError.merchant_message || 'Error al procesar el pago.';

        return Err(
          new AppError(
            ErrorCode.PAYMENT_FAILED,
            'Charge creation failed',
            userMessage
          )
        );
      }

      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Charge creation failed',
          'No se pudo procesar el pago. Intenta nuevamente.'
        )
      );
    }
  }

  // --------------------------------------------------------------------------
  // ÓRDENES (Para Yape/Plin)
  // --------------------------------------------------------------------------

  /**
   * Crear una orden de pago (para Yape/Plin con QR)
   *
   * @param amount - Monto en centavos
   * @param currency - Código de moneda
   * @param description - Descripción
   * @param orderNumber - Número de orden único
   * @param clientDetails - Detalles del cliente
   * @param expirationMinutes - Minutos hasta que expire (default: 60)
   */
  static async createOrder(
    amount: number,
    currency: string,
    description: string,
    orderNumber: string,
    clientDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    },
    expirationMinutes: number = 60
  ): Promise<Result<CulqiOrder>> {
    try {
      if (this.isOfflineMode()) {
        await this.simulateOfflineLatency();
        const expirationDate = Math.floor(Date.now() / 1000) + expirationMinutes * 60;
        const order = this.createMockOrder({
          amount,
          currency_code: currency,
          description,
          order_number: orderNumber,
          client_details: {
            first_name: clientDetails.firstName,
            last_name: clientDetails.lastName,
            email: clientDetails.email,
            phone_number: clientDetails.phone,
          },
          expiration_date: expirationDate,
        });
        console.log('🧪 Orden mock (offline) creada:', order.id);
        return Ok(order);
      }

      if (!this.isConfigured()) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Culqi not configured',
          'La pasarela de pagos no está configurada correctamente.'
        );
      }

      console.log(`📲 Creando orden de pago (QR) de ${currency} ${amount / 100}...`);

      const expirationDate = Math.floor(Date.now() / 1000) + (expirationMinutes * 60);

      const orderPayload = {
        amount,
        currency_code: currency,
        description,
        order_number: orderNumber,
        client_details: {
          first_name: clientDetails.firstName,
          last_name: clientDetails.lastName,
          email: clientDetails.email,
          phone_number: clientDetails.phone,
        },
        expiration_date: expirationDate,
        confirm: false, // El usuario confirma escaneando el QR
      };

      const response = await axios.post(
        `${CULQI_CONFIG.apiUrl}/orders`,
        orderPayload,
        {
          headers: {
            'Authorization': `Bearer ${CULQI_CONFIG.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const order: CulqiOrder = response.data;
      console.log('✅ Orden creada:', order.id);
      console.log('📱 Código de pago:', order.payment_code);

      return Ok(order);
    } catch (error: any) {
      ErrorHandler.log(error, 'CulqiService.createOrder');

      if (error.response?.data) {
        const culqiError = error.response.data;
        const userMessage = culqiError.user_message || culqiError.merchant_message || 'Error al crear la orden de pago.';

        return Err(
          new AppError(
            ErrorCode.PAYMENT_FAILED,
            'Order creation failed',
            userMessage
          )
        );
      }

      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Order creation failed',
          'No se pudo crear la orden de pago. Intenta nuevamente.'
        )
      );
    }
  }

  /**
   * Verificar el estado de una orden
   *
   * @param orderId - ID de la orden
   */
  static async getOrder(orderId: string): Promise<Result<CulqiOrder>> {
    try {
      if (this.isOfflineMode()) {
        await this.simulateOfflineLatency(200, 600);
        const existing = this.offlineOrders.get(orderId);
        if (!existing) {
          return Err(
            new AppError(
              ErrorCode.PAYMENT_FAILED,
              'Offline order not found',
              'No se encontró la orden en modo offline.'
            )
          );
        }

        if (existing.state !== 'paid') {
          const updated: CulqiOrder = {
            ...existing,
            state: 'paid',
            paid_at: Math.floor(Date.now() / 1000),
          };
          this.offlineOrders.set(orderId, updated);
          console.log('🧪 Orden mock marcada como pagada:', orderId);
          return Ok(updated);
        }

        return Ok(existing);
      }

      if (!this.isConfigured()) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Culqi not configured'
        );
      }

      const response = await axios.get(
        `${CULQI_CONFIG.apiUrl}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${CULQI_CONFIG.secretKey}`,
          },
        }
      );

      const order: CulqiOrder = response.data;
      return Ok(order);
    } catch (error: any) {
      ErrorHandler.log(error, 'CulqiService.getOrder');

      return Err(
        new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Failed to get order status'
        )
      );
    }
  }

  // --------------------------------------------------------------------------
  // UTILIDADES
  // --------------------------------------------------------------------------

  /**
   * Validar número de tarjeta usando algoritmo de Luhn
   * En modo sandbox, acepta cualquier número para testing
   */
  static validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s/g, '');

    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 13 || digits.length > 19) return false;

    // En modo sandbox/desarrollo, aceptar cualquier número válido
    // para facilitar testing
    if (__DEV__) {
      return true;
    }

    // Validación de Luhn para producción
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detectar el tipo de tarjeta (Visa, Mastercard, etc.)
   */
  static detectCardBrand(cardNumber: string): string {
    const digits = cardNumber.replace(/\s/g, '');

    if (/^4/.test(digits)) return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'American Express';
    if (/^6(?:011|5)/.test(digits)) return 'Discover';
    if (/^35/.test(digits)) return 'JCB';
    if (/^30[0-5]/.test(digits)) return 'Diners Club';

    return 'Unknown';
  }

  /**
   * Formatear número de tarjeta para mostrar (con espacios)
   */
  static formatCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\s/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  }

  /**
   * Convertir monto a centavos
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convertir centavos a monto
   */
  static fromCents(cents: number): number {
    return cents / 100;
  }
}

// ============================================================================
// TARJETAS DE PRUEBA PARA SANDBOX
// ============================================================================

/**
 * Tarjetas de prueba de Culqi para modo sandbox
 * Fuente: https://docs.culqi.com/es/documentacion/pagos/culqi-checkout/datos-de-prueba/
 */
export const CULQI_TEST_CARDS = {
  visa: {
    success: {
      number: '4111111111111111',
      cvv: '123',
      month: '09',
      year: '2030',
      description: 'Visa - Pago exitoso',
    },
    insufficientFunds: {
      number: '4000020000000000',
      cvv: '123',
      month: '09',
      year: '2030',
      description: 'Visa - Fondos insuficientes',
    },
    stolen: {
      number: '4000030000000009',
      cvv: '123',
      month: '09',
      year: '2030',
      description: 'Visa - Tarjeta robada',
    },
  },
  mastercard: {
    success: {
      number: '5111111111111118',
      cvv: '472',
      month: '09',
      year: '2030',
      description: 'Mastercard - Pago exitoso',
    },
  },
  amex: {
    success: {
      number: '371111111111114',
      cvv: '2841',
      month: '09',
      year: '2030',
      description: 'American Express - Pago exitoso',
    },
  },
  diners: {
    success: {
      number: '36111111111111',
      cvv: '964',
      month: '09',
      year: '2030',
      description: 'Diners Club - Pago exitoso',
    },
  },
};
