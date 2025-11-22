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
import { CULQI_CONFIG, isCulqiConfigured } from '@/config/culqi.config';

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

  /**
   * Verificar si Culqi está configurado
   */
  static isConfigured(): boolean {
    const configured = isCulqiConfigured();
    console.log('🔍 Culqi configured?', configured);
    console.log('🔑 Public Key:', CULQI_CONFIG.publicKey);
    console.log('🔐 Secret Key:', CULQI_CONFIG.secretKey?.substring(0, 10) + '...');
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
      if (!this.isConfigured()) {
        throw new AppError(
          ErrorCode.PAYMENT_FAILED,
          'Culqi not configured',
          'La pasarela de pagos no está configurada correctamente.'
        );
      }

      console.log('🔐 Tokenizando tarjeta con Culqi...');

      const tokenPayload = {
        card_number: cardData.cardNumber.replace(/\s/g, ''),
        cvv: cardData.cvv,
        expiration_month: cardData.expirationMonth.padStart(2, '0'),
        expiration_year: cardData.expirationYear,
        email: cardData.email,
      };

      console.log('🔑 Using public key:', CULQI_CONFIG.publicKey);
      console.log('🌐 API URL:', CULQI_CONFIG.apiUrl);
      console.log('📦 Token payload:', tokenPayload);

      // Crear el header de autorización explícitamente
      const authHeader = `Bearer ${CULQI_CONFIG.publicKey}`;
      console.log('🔐 Authorization Header:', authHeader);

      const url = 'https://secure.culqi.com/v2/tokens';
      console.log('🌍 Full URL:', url);

      // Crear token usando Bearer con la clave pública según documentación de Culqi
      // https://apidocs.culqi.com/#tag/Tokens/operation/crear-token
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(tokenPayload),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', JSON.stringify(response.headers));

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        const errorData = await response.json();
        const userMessage = errorData.user_message || errorData.merchant_message || 'Error al procesar la tarjeta.';

        return Err(
          new AppError(
            ErrorCode.PAYMENT_FAILED,
            'Token creation failed',
            userMessage
          )
        );
      }

      const token: CulqiToken = await response.json();
      console.log('✅ Token creado:', token.id);

      return Ok(token);
    } catch (error: any) {
      ErrorHandler.log(error, 'CulqiService.createToken');

      // Manejar errores de red u otros errores
      if (error.message) {
        return Err(
          new AppError(
            ErrorCode.PAYMENT_FAILED,
            'Token creation failed',
            error.message
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
