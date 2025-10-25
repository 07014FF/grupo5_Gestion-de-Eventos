# 🇵🇪 Guía de Integración - Culqi para Perú

## 🎯 ¿Por qué Culqi?

**Culqi es LA MEJOR opción para Perú** porque:

✅ **Empresa peruana** - Conoce el mercado local
✅ **Comisión más baja** - 3.79% + S/0.30 (vs 4% de otras pasarelas)
✅ **Yape integrado** - 90% de peruanos usan Yape
✅ **API moderna** - Fácil de integrar
✅ **Soles (PEN)** - Sin conversión de moneda
✅ **Setup rápido** - Aprobación en 1-2 días

---

## 🚀 Paso 1: Crear Cuenta en Culqi

### 1.1 Registro

1. Ir a https://www.culqi.com/
2. Click en "Crea tu cuenta gratis"
3. Completa el formulario:
   - Email
   - Nombre del negocio
   - RUC (o DNI para personas naturales)
   - Teléfono

### 1.2 Verificación

- Recibirás un email de verificación
- Click en el link para activar tu cuenta
- Te pedirán documentos:
  - Copia de DNI del representante legal
  - Vigencia de poder (si aplica)
  - Ficha RUC

**Tiempo de aprobación:** 1-2 días hábiles

### 1.3 Obtener Credenciales

Una vez aprobado:

1. Login en https://integ-panel.culqi.com/ (ambiente de pruebas)
2. Ir a **Desarrollo → API Keys**
3. Copiar:
   - **Llave pública:** `pk_test_xxxxxxxxx`
   - **Llave secreta:** `sk_test_xxxxxxxxx`

---

## ⚙️ Paso 2: Configurar en tu Proyecto

### 2.1 Actualizar `.env`

```env
# Culqi - Perú
EXPO_PUBLIC_CULQI_PUBLIC_KEY=pk_test_TU_LLAVE_AQUI
EXPO_PUBLIC_CULQI_SECRET_KEY=sk_test_TU_LLAVE_AQUI
```

### 2.2 Reiniciar App

```bash
# Detener servidor
# Ctrl+C

# Reiniciar
npm start

# O limpiar caché
npx expo start -c
```

---

## 💳 Paso 3: Probar Pagos

### 3.1 Tarjetas de Prueba Culqi

**Visa - Aprobada:**
```
Número: 4111 1111 1111 1111
Vencimiento: 09/2025 (cualquier fecha futura)
CVV: 123
Email: test@test.com
```

**Visa - Rechazada:**
```
Número: 4000 0000 0000 0002
Vencimiento: 09/2025
CVV: 123
```

**Mastercard - Aprobada:**
```
Número: 5111 1111 1111 1118
Vencimiento: 09/2025
CVV: 123
```

### 3.2 Montos de Prueba

Para simular diferentes respuestas:

- **S/ 50.00** → Pago aprobado
- **S/ 20.00** → Pago rechazado
- **S/ 100.00** → Pago con fraude

### 3.3 Probar en la App

1. Abrir app
2. Registrarse o login
3. Seleccionar un evento
4. Comprar entrada
5. Usar tarjeta de prueba
6. Verificar que el pago se procesa
7. Ver ticket generado en "Mis Entradas"

---

## 🔔 Paso 4: Configurar Webhooks (Opcional)

Los webhooks te notifican cuando cambia el estado de un pago.

### 4.1 Crear Endpoint

Ya está creado en: `supabase/functions/payment-webhook/index.ts`

Pero necesitas adaptarlo para Culqi:

```typescript
// Agregar handler para Culqi en el webhook
if (req.headers.get('x-culqi-event')) {
  // Es un webhook de Culqi
  const event = await req.json();

  if (event.type === 'charge.succeeded') {
    // Pago exitoso
    await updatePurchaseStatus(event.data.id, 'completed');
  }
}
```

### 4.2 Desplegar Webhook

```bash
supabase functions deploy payment-webhook
```

Obtendrás una URL como:
```
https://djzumauhocdopfgjcmyf.supabase.co/functions/v1/payment-webhook
```

### 4.3 Configurar en Culqi

1. Panel Culqi → **Desarrollo → Webhooks**
2. Agregar nueva URL
3. Seleccionar eventos:
   - `charge.succeeded` - Pago exitoso
   - `charge.captured` - Pago capturado
   - `refund.created` - Reembolso
4. Guardar

---

## 🎨 Paso 5: Personalizar UI de Pago (Avanzado)

### 5.1 Usar Culqi.js en el Frontend

Para una mejor UX, puedes usar el SDK de Culqi en React Native:

```bash
npm install react-native-webview
```

Crear componente de pago:

```typescript
import { WebView } from 'react-native-webview';

const CulqiCheckout = ({ amount, onSuccess }) => {
  const culqiHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://checkout.culqi.com/js/v4"></script>
    </head>
    <body>
      <script>
        Culqi.publicKey = '${process.env.EXPO_PUBLIC_CULQI_PUBLIC_KEY}';

        Culqi.settings({
          title: 'Compra de Tickets',
          currency: 'PEN',
          amount: ${amount}
        });

        Culqi.options({
          lang: 'es',
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true
          }
        });
      </script>
      <button onclick="Culqi.open()">Pagar S/ ${amount/100}</button>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html: culqiHTML }}
      onMessage={(event) => {
        const token = event.nativeEvent.data;
        onSuccess(token);
      }}
    />
  );
};
```

---

## 💡 Paso 6: Producción

### 6.1 Cambiar a Credenciales de Producción

1. Panel Culqi → Ir a **producción** (no integración)
2. Obtener credenciales de producción:
   - `pk_live_xxxxxxxxx`
   - `sk_live_xxxxxxxxx`

3. Actualizar `.env`:

```env
EXPO_PUBLIC_CULQI_PUBLIC_KEY=pk_live_TU_LLAVE_REAL
EXPO_PUBLIC_CULQI_SECRET_KEY=sk_live_TU_LLAVE_REAL
```

### 6.2 Activar Modo Producción

En Culqi Panel:
- **Desarrollo → Modo Producción**
- Completar checklist de seguridad
- Activar

### 6.3 Verificar SSL

Tu app debe usar HTTPS. React Native ya lo maneja, pero asegúrate que:
- Supabase usa HTTPS ✅
- Culqi API usa HTTPS ✅
- Tu backend (si tienes) usa HTTPS

---

## 🧪 Testing Checklist

Antes de lanzar a producción:

- [ ] Pago con tarjeta Visa exitoso
- [ ] Pago con tarjeta Mastercard exitoso
- [ ] Pago rechazado maneja error correctamente
- [ ] Ticket se genera después de pago exitoso
- [ ] Ticket NO se genera si pago falla
- [ ] Webhook actualiza estado correctamente
- [ ] QR funciona después de compra
- [ ] PDF descarga correctamente
- [ ] Admin puede validar el ticket

---

## 📊 Monitoreo y Reportes

### Dashboard Culqi

En https://panel.culqi.com/ puedes ver:

- 💰 **Movimientos** - Todas las transacciones
- 📈 **Reportes** - Ventas por fecha, método, etc.
- 🔄 **Reembolsos** - Gestionar devoluciones
- 👥 **Clientes** - Base de datos de compradores
- 🔔 **Webhooks** - Estado de notificaciones

### Descargar Reportes

- Excel de ventas diarias
- CSV de transacciones
- Reporte de liquidaciones

---

## 💰 Costos Reales

### Comisiones Culqi

**Por transacción:**
- 3.79% + S/ 0.30

**Ejemplos:**
- Ticket de S/ 50: S/ 2.20 de comisión (quedas con S/ 47.80)
- Ticket de S/ 100: S/ 4.09 de comisión (quedas con S/ 95.91)
- Ticket de S/ 200: S/ 7.88 de comisión (quedas con S/ 192.12)

**Sin costos adicionales:**
- ✅ Sin cuota mensual
- ✅ Sin setup fee
- ✅ Sin mínimos de transacción

**Contracargos:**
- S/ 35 por contracargo (si el cliente disputa)

### Calendario de Pagos

Culqi te transfiere:
- **D+2** para tarjetas (2 días después)
- **D+1** para Yape (1 día después)

Ejemplo:
- Venta el Lunes → Recibes el Miércoles

---

## 🔒 Seguridad

### PCI DSS Compliance

Culqi es **PCI Level 1** certificado, lo que significa:
- ✅ No guardas datos de tarjetas (Culqi lo hace)
- ✅ Culqi maneja toda la seguridad
- ✅ Tú solo manejas tokens

### Buenas Prácticas

1. **Nunca** guardes datos de tarjeta en tu BD
2. **Siempre** usa HTTPS
3. **Valida** los webhooks con firma
4. **Implementa** 3D Secure (Culqi lo hace automático)
5. **Monitorea** transacciones sospechosas

---

## 🆘 Troubleshooting

### Error: "Invalid API Key"
```bash
# Verifica que las credenciales estén correctas en .env
# Reinicia la app
npm start
```

### Error: "Payment Declined"
Posibles causas:
- Tarjeta sin fondos
- Tarjeta bloqueada
- CVV incorrecto
- En testing: usar tarjeta aprobada (4111 1111 1111 1111)

### Webhook no funciona
1. Verificar URL del webhook
2. Ver logs: `supabase functions logs payment-webhook`
3. Probar manualmente con curl

### Pago exitoso pero ticket no se crea
1. Verificar que el webhook esté configurado
2. Ver logs de Supabase
3. Revisar tabla `purchases` en BD

---

## 📞 Soporte Culqi

- **Email:** soporte@culqi.com
- **WhatsApp:** +51 963 854 616
- **Docs:** https://docs.culqi.com/
- **Chat:** En el panel de Culqi

**Horario:**
- Lunes a Viernes: 9am - 6pm (hora Perú)

---

## 🎉 ¡Listo!

Tu app ahora acepta pagos en Perú con:
- ✅ Culqi integrado
- ✅ Yape disponible
- ✅ Tarjetas Visa/Mastercard
- ✅ Pagos en Soles (PEN)
- ✅ Comisiones bajas

**Siguiente paso:**
Obtén tus credenciales en https://www.culqi.com/ y ¡empieza a vender tickets! 🚀

---

**Documentos relacionados:**
- `PASARELAS_PERU.md` - Comparación de pasarelas
- `services/payment.service.ts` - Código de integración
- `CONFIGURACION_RAPIDA.md` - Setup general del proyecto
