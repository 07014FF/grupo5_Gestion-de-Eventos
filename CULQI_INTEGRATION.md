# 🇵🇪 Integración de Culqi - Modo Sandbox

Este documento explica cómo usar la integración de Culqi en modo sandbox para tu proyecto universitario de gestión de eventos.

## 🎯 ¿Qué es Culqi?

Culqi es la pasarela de pagos líder en Perú que permite procesar:
- 💳 Tarjetas de crédito y débito
- 💜 Yape (próximamente)
- 💙 Plin (próximamente)

## 📦 Características Implementadas

✅ **Tokenización segura de tarjetas** - Los datos de tarjeta nunca pasan por tu servidor
✅ **Procesamiento de cargos** - Cargos automáticos con Culqi API
✅ **Modo Sandbox completo** - Pruebas ilimitadas sin costo
✅ **Validación de tarjetas** - Algoritmo de Luhn implementado
✅ **Detección de marca** - Visa, Mastercard, Amex, Diners
✅ **UI profesional** - Formulario de tarjeta con mejores prácticas
✅ **Manejo de errores** - Mensajes claros en español

## 📴 Modo Offline (sin internet)

Cuando estés en clase o no tengas acceso a internet, puedes activar el modo sandbox offline agregando en tu `.env`:

```bash
EXPO_PUBLIC_CULQI_OFFLINE_MODE=true
```

En este modo:
- Los tokens y cargos se generan localmente con IDs mock (no se hace ninguna petición HTTP).
- Las órdenes Yape/Plin muestran un QR generado en memoria para que puedas simular el flujo completo.
- `PaymentService` recibe respuestas iguales a las del sandbox real, así que no necesitas tocar el resto del código.

Para volver al sandbox real, simplemente pon `false` y reinicia la app.

## 🚀 Inicio Rápido

### 1. Configuración (Ya está hecha)

Las claves de sandbox ya están configuradas en `.env`:

```bash
EXPO_PUBLIC_CULQI_PUBLIC_KEY=pk_test_e94078b9b248675d
EXPO_PUBLIC_CULQI_SECRET_KEY=sk_test_1573b0e8079863ca
```

⚠️ **IMPORTANTE**: Estas son claves de PRUEBA. Para producción necesitas crear una cuenta real en [Culqi.com](https://www.culqi.com/)

### 2. Probar la Integración

1. **Inicia la app**:
   ```bash
   npm start
   ```

2. **Navega a un evento** y haz clic en "Comprar"

3. **Selecciona "Tarjeta"** como método de pago

4. **Usa una tarjeta de prueba** (ver sección abajo)

5. **Completa el pago** - Verás el resultado en tiempo real

## 💳 Tarjetas de Prueba

### ✅ Pago Exitoso

```
Número:  4111 1111 1111 1111
CVV:     123
Mes:     09
Año:     2025
```

### ❌ Fondos Insuficientes

```
Número:  4000 0200 0000 0000
CVV:     123
Mes:     09
Año:     2025
```

### 🚫 Tarjeta Robada

```
Número:  4000 0300 0000 0009
CVV:     123
Mes:     09
Año:     2025
```

### Otras Marcas

**Mastercard (Exitosa)**
```
Número:  5111 1111 1111 1118
CVV:     472
Mes:     09
Año:     2025
```

**American Express**
```
Número:  3711 1111 1111 114
CVV:     2841
Mes:     09
Año:     2025
```

**Diners Club**
```
Número:  3611 1111 1111 11
CVV:     964
Mes:     09
Año:     2025
```

## 🔧 Arquitectura

### Flujo de Pago

```
Usuario ingresa tarjeta
    ↓
CulqiCardForm tokeniza
    ↓
Token enviado a CulqiService
    ↓
CulqiService crea cargo
    ↓
PaymentService procesa resultado
    ↓
TicketService crea entradas
    ↓
✅ Usuario recibe tickets
```

### Archivos Principales

```
services/
├── culqi.service.ts          # API de Culqi (tokenización, cargos, órdenes)
├── payment.service.ts         # Orquestador de pagos (soporta múltiples gateways)
└── ticket.service.supabase.ts # Creación de tickets en BD

components/payment/
├── CulqiCardForm.tsx         # Formulario de captura de tarjeta
├── PaymentMethodSelector.tsx # Selector de métodos (Yape, Plin, Tarjeta)
└── ManualQRPayment.tsx       # Pago manual con QR (Yape/Plin)

app/
└── purchase.tsx              # Pantalla de compra
```

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas

- **PCI-DSS Compliance**: Los datos de tarjeta nunca se guardan en el estado de la app
- **Tokenización inmediata**: Los datos se tokenizan antes de salir del dispositivo
- **HTTPS**: Todas las comunicaciones son encriptadas
- **Validación cliente**: Validación de Luhn antes de enviar
- **Manejo de errores**: Mensajes claros sin exponer detalles técnicos

### ⚠️ Para Producción

Si decides llevar esto a producción (fuera del ámbito universitario):

1. **Crea una cuenta real en Culqi**: https://www.culqi.com/
2. **Obtén claves de producción**: Panel → Desarrollo → API Keys
3. **Actualiza el .env**:
   ```bash
   EXPO_PUBLIC_CULQI_PUBLIC_KEY=pk_live_TU_CLAVE_AQUI
   EXPO_PUBLIC_CULQI_SECRET_KEY=sk_live_TU_CLAVE_AQUI
   ```
4. **Configura webhooks**: Para recibir confirmaciones de pago
5. **Implementa reconciliación**: Verifica pagos con el dashboard de Culqi

## 📊 Panel de Culqi

### Modo Sandbox

Accede al panel de integración (pruebas):
https://integ-panel.culqi.com/

**Credenciales de prueba**:
- Email: (crear cuenta gratuita)
- Password: (tu password)

### Funcionalidades del Panel

- 📈 Ver todas las transacciones de prueba
- 💳 Detalles de cada cargo
- 🔄 Simular reembolsos
- 📝 Logs de API
- 🔗 Configurar webhooks

## 🧪 Testing

### Probar diferentes escenarios

```typescript
// En tu código puedes importar las tarjetas de prueba
import { CULQI_TEST_CARDS } from '@/services/culqi.service';

// Usar tarjeta exitosa
const testCard = CULQI_TEST_CARDS.visa.success;

// Usar tarjeta con fondos insuficientes
const insufficientCard = CULQI_TEST_CARDS.visa.insufficientFunds;
```

### Casos de Prueba Recomendados

1. ✅ **Pago exitoso con Visa**
2. ✅ **Pago exitoso con Mastercard**
3. ❌ **Pago rechazado por fondos insuficientes**
4. ❌ **Pago rechazado por tarjeta robada**
5. ⚠️ **Validación de campos vacíos**
6. ⚠️ **Validación de tarjeta inválida**
7. ⚠️ **Validación de fecha expirada**

## 📱 Demostración en Clase

### Guion Recomendado

1. **Mostrar evento**: Navegar a un evento
2. **Iniciar compra**: Seleccionar cantidad y tipo
3. **Tarjetas de prueba**: Mostrar el banner con tarjetas de sandbox
4. **Auto-completar**: Usar el botón de auto-completar
5. **Procesar pago**: Ejecutar el pago y mostrar resultado
6. **Ver tickets**: Navegar a "Mis Tickets" y mostrar QR
7. **Panel Culqi**: Abrir el panel y mostrar la transacción

## 🎓 Para el Informe Universitario

### Tecnologías Usadas

- **React Native**: Framework mobile multiplataforma
- **TypeScript**: Tipado estático para mayor seguridad
- **Culqi API v2**: Pasarela de pagos peruana
- **Axios**: Cliente HTTP para llamadas a API
- **Expo**: Plataforma de desarrollo React Native

### Conceptos Aplicados

- **Arquitectura en capas**: Separación de servicios, componentes y vistas
- **Programación funcional**: Result types para manejo de errores
- **Validación de datos**: Algoritmo de Luhn, validaciones de formulario
- **Seguridad**: Tokenización, HTTPS, PCI-DSS
- **UX/UI**: Feedback visual, estados de carga, manejo de errores

### Diagramas Útiles

```
┌─────────────────────────────────────────────────────────┐
│                    FLUJO DE PAGO                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Usuario              App                   Culqi      │
│    │                  │                      │         │
│    │─── Ingresa ─────>│                      │         │
│    │   tarjeta        │                      │         │
│    │                  │                      │         │
│    │                  │──── Token ──────────>│         │
│    │                  │      (Secure)        │         │
│    │                  │                      │         │
│    │                  │<──── Token ID ───────│         │
│    │                  │                      │         │
│    │                  │──── Charge ─────────>│         │
│    │                  │   (con Token ID)     │         │
│    │                  │                      │         │
│    │                  │<──── Success ────────│         │
│    │                  │                      │         │
│    │<─── Tickets ─────│                      │         │
│    │                  │                      │         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🆘 Solución de Problemas

### Error: "Culqi not configured"

**Causa**: Las claves no están en el .env
**Solución**: Verifica que el archivo `.env` existe y tiene las claves correctas

### Error: "Token creation failed"

**Causa**: Datos de tarjeta inválidos
**Solución**: Usa una tarjeta de prueba de la lista de arriba

### Error: "Charge creation failed"

**Causa**: Token inválido o expirado
**Solución**: Los tokens expiran en 5 minutos. Crea uno nuevo

### La app no procesa el pago

**Causa**: Probablemente un error de red
**Solución**: Verifica tu conexión a internet y revisa los logs

## 📚 Recursos Adicionales

- 📖 **Documentación Oficial**: https://docs.culqi.com/
- 🎥 **Tutoriales en YouTube**: Buscar "Culqi integration tutorial"
- 💬 **Soporte**: soporte@culqi.com
- 🏢 **Crear cuenta**: https://www.culqi.com/

## 🎉 ¡Listo!

Tu proyecto ahora tiene una integración profesional de pagos con Culqi en modo sandbox. Puedes demostrar:

✅ Procesamiento de pagos con tarjetas de crédito
✅ Validaciones de seguridad
✅ Manejo de errores
✅ Generación de tickets
✅ UI/UX profesional

**Nota para el profesor**: Este proyecto usa el modo sandbox de Culqi, que es 100% gratuito y está diseñado para desarrollo y educación. No se procesarán transacciones reales.

---

Desarrollado con ❤️ para el proyecto universitario de Gestión de Eventos
Powered by Culqi 🇵🇪
