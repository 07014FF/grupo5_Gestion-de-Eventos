# 🎫 Sistema de Validación de Entradas

Sistema completo de validación de tickets con soporte offline, escaneo QR, y estadísticas en tiempo real.

## ✨ Características Principales

### 1. **Múltiples Métodos de Validación**
- 📱 **Escaneo QR** - Usa la cámara del dispositivo para escanear códigos QR
- ⌨️ **Entrada Manual** - Permite ingresar códigos manualmente si el QR no funciona
- 🔦 **Linterna integrada** - Control de flash para ambientes oscuros

### 2. **Feedback Háptico (Vibración)**
- ✅ **Ticket Válido** - Vibración doble de éxito
- ⚠️ **Ya Utilizado** - Vibración de advertencia
- ❌ **Inválido** - Vibración de error

### 3. **Modo Offline**
- 💾 **Almacenamiento local** - Guarda validaciones cuando no hay internet
- 🔄 **Sincronización automática** - Se sincroniza cuando hay conexión
- ⏰ **Sincronización periódica** - Cada 2 minutos automáticamente
- 📱 **Sincronización al reactivar** - Cuando vuelves a la app

### 4. **Estadísticas Avanzadas**
- 📊 **Métricas en tiempo real**
  - Total de validados vs capacidad
  - Validados hoy
  - Por tipo de entrada (General/Estudiante)
  - Ingresos totales y del día
- 📈 **Gráfico por hora** - Visualiza el flujo de entrada
- 🎯 **Indicadores clave**
  - Ritmo de validación
  - Entradas restantes
  - Ticket promedio

### 5. **Selector de Eventos**
- 🎪 **Multi-evento** - Valida tickets para diferentes eventos
- 📅 **Eventos activos** - Filtra automáticamente eventos vigentes
- 📊 **Progreso por evento** - Ve cuántos tickets se han validado

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Migración en Supabase

```bash
# Aplicar la migración de la tabla ticket_validations
npx supabase db push
```

O ejecuta manualmente el SQL en tu dashboard de Supabase:
```sql
-- Ver archivo: supabase/migrations/20250120_ticket_validations.sql
```

### Paso 2: Permisos Requeridos

El validador requiere:
- ✅ Rol de **Admin** en la base de datos
- 📷 Permiso de **Cámara** (se solicita automáticamente)
- 📳 Permiso de **Vibración** (incluido en expo-haptics)

### Paso 3: Dependencias Instaladas

Ya están instaladas:
- `expo-camera` - Escaneo QR
- `expo-barcode-scanner` - Detección de códigos
- `expo-haptics` - Feedback háptico
- `@react-native-async-storage/async-storage` - Almacenamiento offline
- `@react-native-community/netinfo` - Detección de red

## 📖 Uso del Validador

### Acceso

Solo usuarios con rol `admin` pueden acceder. La ruta es:
```typescript
router.push('/validator');
```

### Flujo de Validación

1. **Seleccionar Evento**
   - Al abrir el validador, selecciona el evento a validar
   - Puedes cambiar de evento en cualquier momento

2. **Escanear Ticket**
   - Modo **Escanear**: Apunta la cámara al código QR
   - Modo **Manual**: Ingresa el código manualmente
   - El código tiene el formato: `TKT-XXXX-XXXX-XXXX`

3. **Resultado**
   - ✅ **Válido**: Muestra datos del cliente y permite entrada
   - ⚠️ **Ya Usado**: Muestra cuándo y quién lo validó
   - ❌ **Inválido**: Ticket no existe o pago no completado

4. **Ver Estadísticas**
   - Cambia a la pestaña **Estadísticas**
   - Ve métricas en tiempo real
   - Desliza hacia abajo para actualizar

### Sincronización Offline

**Automática:**
- Se sincroniza cada 2 minutos si hay conexión
- Se sincroniza al volver a la app
- Icono con badge muestra validaciones pendientes

**Manual:**
- Toca el ícono de nube (☁️) en el header
- Confirma la sincronización
- Ver cuántas se sincronizaron exitosamente

## 📁 Estructura de Archivos

```
app/
  validator/
    index.tsx                 # Pantalla principal del validador

components/
  validator/
    QRScanner.tsx            # Componente de escaneo QR
    ManualCodeInput.tsx      # Input manual de código
    ValidationResult.tsx     # Modal de resultado con vibración
    ValidatorStats.tsx       # Componente de estadísticas

services/
  validator.service.ts       # Lógica de validación y offline

types/
  validator.types.ts         # Tipos TypeScript

hooks/
  useOfflineSync.ts         # Hook de sincronización automática

supabase/
  migrations/
    20250120_ticket_validations.sql  # Migración de BD
```

## 🔐 Seguridad (RLS Policies)

### Tabla `ticket_validations`

**Admins:**
- ✅ Ver todas las validaciones
- ✅ Crear nuevas validaciones

**Usuarios:**
- ✅ Ver validaciones de sus propios tickets
- ❌ No pueden crear validaciones

## 📊 Modelo de Datos

### TicketValidation
```typescript
interface TicketValidation {
  id: string;
  ticketId: string;          // Referencia a purchases
  ticketCode: string;         // Código del ticket
  eventId: string;            // Evento validado
  userId: string;             // Usuario propietario
  validatedAt: string;        // Fecha/hora de validación
  validatedBy: string;        // Admin que validó
  status: 'valid' | 'invalid' | 'already_used' | 'cancelled';
  synced: boolean;            // Para modo offline
}
```

### ValidationResult
```typescript
interface ValidationResult {
  success: boolean;
  status: 'valid' | 'invalid' | 'already_used' | 'cancelled';
  message: string;
  ticket?: {
    code: string;
    eventTitle: string;
    userName: string;
    userEmail: string;
    ticketType: 'general' | 'student';
    quantity: number;
    totalAmount: number;
    previousValidation?: {
      validatedAt: string;
      validatorName: string;
    };
  };
}
```

## 🎨 Diseño y UX

### Colores por Estado
- 🟢 **Verde** - Ticket válido, entrada permitida
- 🟡 **Amarillo** - Ticket ya usado, advertencia
- 🔴 **Rojo** - Ticket inválido o cancelado

### Animaciones
- ✨ Animación de escala al mostrar resultados
- 📱 Vibración según el resultado
- 🔄 Indicador de carga durante validación

### Responsive
- 📱 Optimizado para teléfonos y tablets
- 🌙 Soporta tema claro/oscuro
- ♿ Accesible y fácil de usar

## 🧪 Testing

### Tarjetas de Prueba Culqi

Para testing en modo sandbox, usa:
```typescript
import { CULQI_TEST_CARDS } from '@/services/culqi.service';

// Tarjeta exitosa
const testCard = CULQI_TEST_CARDS.visa.success;
// number: '4111111111111111'
// cvv: '123'
// month: '09'
// year: '2030'
```

### Escenarios de Prueba

1. ✅ **Ticket Válido**: Compra con pago completado
2. ⚠️ **Ya Usado**: Validar el mismo ticket dos veces
3. ❌ **Inválido**: Código que no existe
4. ❌ **Sin Pagar**: Compra con pago pendiente
5. 📡 **Offline**: Validar sin conexión y sincronizar después

## 🚨 Solución de Problemas

### Cámara no funciona
- Verifica permisos en configuración del dispositivo
- Reinicia la app
- Usa el modo manual como alternativa

### Validaciones no se sincronizan
- Verifica conexión a internet
- Revisa credenciales de Supabase
- Toca el botón de sincronización manual

### Error "Acceso Denegado"
- Verifica que el usuario tenga rol `admin` en la BD
- Ejecuta: `UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com'`

## 📈 Mejoras Futuras (Opcionales)

- [ ] Exportar reportes en PDF/Excel
- [ ] Notificaciones push cuando se alcanza X% de capacidad
- [ ] Modo multi-validador (varios dispositivos simultáneos)
- [ ] Historial de validaciones por validador
- [ ] Soporte para códigos de barras 1D
- [ ] Dashboard web para administradores

## 🤝 Soporte

Si tienes problemas o sugerencias:
1. Revisa los logs en la consola
2. Verifica las políticas RLS en Supabase
3. Comprueba que la migración se aplicó correctamente

---

**¡Sistema de Validación Completo! 🎉**

Ahora tienes un validador profesional con:
- ✅ Escaneo QR con cámara
- ✅ Modo offline con sincronización
- ✅ Feedback háptico
- ✅ Estadísticas en tiempo real
- ✅ Multi-evento
- ✅ Seguro y escalable
