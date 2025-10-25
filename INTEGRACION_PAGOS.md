# 💳 Guía de Integración de Pasarelas de Pago

**Fecha:** 21 de Octubre, 2025
**Estado:** Estructura base implementada, pendiente configuración de pasarelas

---

## 📋 Índice

1. [Arquitectura Implementada](#arquitectura-implementada)
2. [Pasarelas Soportadas](#pasarelas-soportadas)
3. [Integración: Wompi (Colombia)](#integración-wompi)
4. [Integración: Stripe (Internacional)](#integración-stripe)
5. [Integración: MercadoPago (LatAm)](#integración-mercadopago)
6. [Testing con Modo Mock](#testing-con-modo-mock)
7. [Webhooks y Confirmación](#webhooks-y-confirmación)

---

## 🏗️ Arquitectura Implementada

### Archivo: `services/payment.service.ts`

Se implementó una **arquitectura flexible** que permite cambiar entre diferentes pasarelas de pago sin modificar el código de la aplicación.

```typescript
// Cambiar entre pasarelas es tan simple como:
PaymentService.setGateway(PaymentGateway.WOMPI);
// o
PaymentService.setGateway(PaymentGateway.STRIPE);
// o
PaymentService.setGateway(PaymentGateway.MOCK); // Para desarrollo
```

### Flujo de Pago

```
┌─────────────┐
│   Usuario   │
│  en Purchase│
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ PaymentService      │
│ .createPaymentIntent│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ PaymentService      │
│ .processPayment     │
└──────┬──────────────┘
       │
       ├─────► Wompi API
       ├─────► Stripe API
       ├─────► MercadoPago API
       └─────► Mock (testing)
       │
       ▼
┌─────────────────────┐
│  PaymentResult      │
│  success/failed     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ TicketService       │
│ .createPurchase     │ (solo si payment success)
└─────────────────────┘
```

---

## 🌎 Pasarelas Soportadas

### 1. **Wompi** 🟢 (Recomendado para Colombia)
- ✅ Popular en Colombia
- ✅ Soporta PSE, Nequi, Daviplata, tarjetas
- ✅ Comisiones bajas
- ✅ Buena documentación en español
- 📱 SDK disponible

### 2. **Stripe** 🔵 (Recomendado internacional)
- ✅ Líder mundial
- ✅ Excelente SDK para React Native
- ✅ Documentación superior
- ⚠️ Comisiones más altas en LatAm

### 3. **MercadoPago** 🟡 (Popular en LatAm)
- ✅ Muy usado en Argentina, Brasil, México
- ✅ Buen soporte en la región
- ✅ Comisiones competitivas

### 4. **Mock** 🎭 (Solo desarrollo)
- ✅ Ya implementado
- ✅ Simula pagos exitosos
- ✅ Útil para testing sin gastar dinero real

---

## 🟢 Integración: Wompi (Colombia)

### Paso 1: Crear cuenta en Wompi

1. Ir a https://comercios.wompi.co/
2. Registrarse como comercio
3. Completar verificación KYC
4. Obtener credenciales:
   - **Public Key:** `pub_test_...` (testing)
   - **Private Key:** `prv_test_...` (testing)
   - **Event Secret:** Para webhooks

### Paso 2: Instalar dependencias

```bash
npm install axios
```

### Paso 3: Configurar variables de entorno

Agregar a `.env`:

```env
# Wompi Credentials (TEST)
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_TU_KEY_AQUI
EXPO_PUBLIC_WOMPI_PRIVATE_KEY=prv_test_TU_KEY_AQUI
EXPO_PUBLIC_WOMPI_EVENT_SECRET=TU_SECRET_AQUI

# Wompi URLs
EXPO_PUBLIC_WOMPI_API_URL=https://sandbox.wompi.co/v1
EXPO_PUBLIC_WOMPI_CHECKOUT_URL=https://checkout.wompi.co
```

### Paso 4: Implementar método de pago Wompi

Reemplazar en `services/payment.service.ts` (línea ~209):

```typescript
private static async processWompiPayment(
  intent: PaymentIntent
): Promise<Result<PaymentResult>> {
  try {
    const axios = require('axios');

    // 1. Crear aceptación de términos
    const acceptanceResponse = await axios.get(
      `${process.env.EXPO_PUBLIC_WOMPI_API_URL}/merchants/${process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY}`
    );

    const acceptanceToken = acceptanceResponse.data.data.presigned_acceptance.acceptance_token;

    // 2. Crear transacción
    const transactionPayload = {
      amount_in_cents: intent.amount, // Ya en centavos
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
      shipping_address: {
        address_line_1: intent.metadata.address || 'Calle Principal',
        country: 'CO',
        city: intent.metadata.city || 'Bogotá',
      },
    };

    const transactionResponse = await axios.post(
      `${process.env.EXPO_PUBLIC_WOMPI_API_URL}/transactions`,
      transactionPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const transaction = transactionResponse.data.data;

    // 3. Verificar estado
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
      },
    });
  } catch (error: any) {
    ErrorHandler.log(error, 'PaymentService.processWompiPayment');

    const errorMessage = error.response?.data?.error?.messages?.join(', ')
      || 'Error al procesar el pago con Wompi.';

    return Err(
      new AppError(
        ErrorCode.PAYMENT_FAILED,
        'Wompi payment failed',
        errorMessage
      )
    );
  }
}

// Helper: Mapear método de pago a formato Wompi
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

// Helper: Mapear estado de Wompi a nuestro PaymentStatus
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
```

### Paso 5: Activar Wompi en la app

En `app/purchase.tsx`, antes de crear la compra:

```typescript
import { PaymentService, PaymentGateway } from '@/services/payment.service';

// Configurar Wompi como pasarela
PaymentService.setGateway(PaymentGateway.WOMPI);
```

---

## 🔵 Integración: Stripe (Internacional)

### Paso 1: Crear cuenta en Stripe

1. Ir a https://stripe.com/
2. Crear cuenta
3. Obtener credenciales de test:
   - **Publishable Key:** `pk_test_...`
   - **Secret Key:** `sk_test_...`

### Paso 2: Instalar SDK de Stripe

```bash
npm install @stripe/stripe-react-native
npx expo prebuild
```

### Paso 3: Configurar variables de entorno

Agregar a `.env`:

```env
# Stripe Credentials (TEST)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_KEY_AQUI
STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
```

### Paso 4: Implementar Stripe

Reemplazar en `services/payment.service.ts` (línea ~187):

```typescript
private static async processStripePayment(
  intent: PaymentIntent
): Promise<Result<PaymentResult>> {
  try {
    const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native');

    // 1. Crear Payment Intent en tu backend
    // IMPORTANTE: Esto debe hacerse en el backend por seguridad
    const backendResponse = await fetch('https://tu-backend.com/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: intent.amount,
        currency: 'usd',
        metadata: intent.metadata,
      }),
    });

    const { paymentIntent: backendPaymentIntent, ephemeralKey, customer } = await backendResponse.json();

    // 2. Inicializar Payment Sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Tu App de Tickets',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: backendPaymentIntent,
      allowsDelayedPaymentMethods: false,
    });

    if (initError) {
      throw new AppError(
        ErrorCode.PAYMENT_FAILED,
        'Failed to initialize payment sheet',
        initError.message
      );
    }

    // 3. Presentar Payment Sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      throw new AppError(
        ErrorCode.PAYMENT_FAILED,
        'Payment cancelled or failed',
        presentError.message
      );
    }

    // 4. Pago exitoso
    return Ok({
      success: true,
      paymentId: intent.id,
      status: PaymentStatus.COMPLETED,
      transactionId: backendPaymentIntent,
    });
  } catch (error: any) {
    ErrorHandler.log(error, 'PaymentService.processStripePayment');

    if (error instanceof AppError) {
      return Err(error);
    }

    return Err(
      new AppError(
        ErrorCode.PAYMENT_FAILED,
        'Stripe payment failed',
        'No se pudo procesar el pago. Intenta nuevamente.'
      )
    );
  }
}
```

### Paso 5: Crear endpoint de backend para Stripe

**IMPORTANTE:** Stripe requiere un backend para crear Payment Intents por seguridad.

Ejemplo con Node.js/Express:

```javascript
// backend/routes/payments.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;

    // Crear customer
    const customer = await stripe.customers.create({
      email: metadata.email,
      name: metadata.name,
    });

    // Crear ephemeral key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    // Crear payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.id,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 🟡 Integración: MercadoPago

### Paso 1: Crear cuenta

1. Ir a https://www.mercadopago.com.co/developers
2. Crear aplicación
3. Obtener credenciales de test

### Paso 2: Instalar SDK

```bash
npm install mercadopago
```

### Paso 3: Implementar (similar a Wompi/Stripe)

Documentación completa: https://www.mercadopago.com.co/developers/es/docs

---

## 🎭 Testing con Modo Mock

El modo Mock **ya está implementado** y listo para usar:

```typescript
// En app/purchase.tsx
import { PaymentService, PaymentGateway } from '@/services/payment.service';

// Usar pagos simulados
PaymentService.setGateway(PaymentGateway.MOCK);
```

### Características del Mock:
- ✅ Simula delay de red (2 segundos)
- ✅ 95% de tasa de éxito (realista)
- ✅ Genera IDs de transacción
- ✅ Logs en consola para debugging

---

## 🔔 Webhooks y Confirmación

### ¿Por qué necesitas webhooks?

Los webhooks permiten que la pasarela de pago te notifique cuando el estado de un pago cambia (aprobado, rechazado, reembolsado).

### Configuración de Webhooks

#### Para Wompi:

1. Ir a Panel de Wompi → Webhooks
2. Agregar URL: `https://tu-backend.com/webhooks/wompi`
3. Seleccionar eventos: `transaction.updated`
4. Guardar Event Secret

#### Endpoint de ejemplo:

```javascript
// backend/routes/webhooks.js
app.post('/webhooks/wompi', (req, res) => {
  const signature = req.headers['x-event-checksum'];
  const payload = req.body;

  // Verificar firma
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', process.env.WOMPI_EVENT_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Procesar evento
  const { event, data } = payload;

  if (event === 'transaction.updated') {
    if (data.transaction.status === 'APPROVED') {
      // Actualizar estado del pedido en tu BD
      updateOrderStatus(data.transaction.reference, 'completed');
    }
  }

  res.status(200).send('OK');
});
```

---

## 🚀 Próximos Pasos

### Implementación Recomendada (Orden):

1. **Testing** (1 hora)
   - Probar flujo completo con Mock
   - Verificar que todo funciona

2. **Wompi** (1-2 días) ⭐ RECOMENDADO PRIMERO
   - Fácil de integrar
   - Ideal para Colombia
   - Buena para MVP

3. **Backend para webhooks** (1 día)
   - Necesario para producción
   - Validar pagos reales

4. **Stripe** (2-3 días) - Opcional
   - Si planeas expandir internacionalmente

---

## 📝 Checklist de Producción

Antes de lanzar a producción:

- [ ] Cambiar credenciales de TEST a PRODUCCIÓN
- [ ] Configurar webhooks
- [ ] Implementar logs de auditoría de pagos
- [ ] Agregar retry logic para pagos fallidos
- [ ] Implementar reembolsos
- [ ] Probar con tarjetas reales
- [ ] Configurar alertas de pagos fallidos
- [ ] Cumplir PCI DSS (si guardas datos de tarjetas)

---

## 💡 Tips y Mejores Prácticas

1. **Nunca guardes datos de tarjetas** directamente
2. **Siempre usa HTTPS** para comunicación con pasarelas
3. **Implementa idempotencia** para evitar cargos duplicados
4. **Guarda logs** de todas las transacciones
5. **Maneja errores gracefully** con mensajes claros al usuario
6. **Prueba con múltiples métodos** de pago antes de lanzar

---

## 🆘 Troubleshooting

### Error: "Payment failed"
- Verificar credenciales en `.env`
- Revisar logs de la pasarela
- Verificar que el monto sea correcto

### Error: "Invalid signature"
- Verificar Event Secret de webhooks
- Verificar formato del payload

### Pago aprobado pero no se creó el ticket
- Revisar implementación de webhooks
- Verificar que el backend actualice Supabase

---

**FIN DEL DOCUMENTO**
