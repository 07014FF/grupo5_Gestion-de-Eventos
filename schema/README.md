# Esquema de Base de Datos - Sistema de Tickets

Este directorio contiene el esquema completo de la base de datos del sistema de tickets con integración de pasarela de pagos Culqi para el mercado peruano.

## Estructura de Archivos

Los archivos SQL están numerados para ejecutarse en orden:

1. **01-extensions.sql** - Extensiones de PostgreSQL necesarias
2. **02-tables.sql** - Definición de todas las tablas
3. **03-functions.sql** - Funciones personalizadas y de reportes
4. **04-triggers.sql** - Triggers automáticos
5. **05-rls-policies.sql** - Políticas de seguridad (Row Level Security)
6. **06-indexes.sql** - Índices de optimización
7. **07-views.sql** - Vistas del sistema

## Cómo usar estos archivos

### Opción 1: Ejecutar todos los archivos en orden

```bash
# Usando el CLI de Supabase
supabase db reset
cat schema/*.sql | supabase db execute

# O ejecutar uno por uno
supabase db execute < schema/01-extensions.sql
supabase db execute < schema/02-tables.sql
# ... y así sucesivamente
```

### Opción 2: Crear una migración

```bash
# Copiar todo el contenido en una nueva migración
supabase migration new complete_schema

# Luego copiar el contenido de todos los archivos en el orden correcto
```

### Opción 3: Ejecutar manualmente en Supabase Dashboard

1. Ve a SQL Editor en Supabase Dashboard
2. Copia y ejecuta el contenido de cada archivo en orden

## Descripción de Tablas

### `users`
- Almacena información de usuarios del sistema
- Roles: `client`, `admin`, `super_admin`, `qr_validator`
- Conectada con `auth.users` de Supabase

### `events`
- Eventos disponibles para compra de tickets
- Incluye precios diferenciados (estudiante/general)
- Estados: `active`, `cancelled`, `completed`, `draft`

### `purchases`
- Compras realizadas por usuarios
- Integración con pasarela Culqi
- Almacena metadata de pagos (marca de tarjeta, banco, etc.)
- Estados de pago: `pending`, `processing`, `completed`, `failed`, `refunded`, `cancelled`

### `tickets`
- Tickets generados para eventos
- Código QR único por ticket
- Estados: `active`, `used`, `cancelled`, `expired`

### `validations`
- Historial de validaciones de tickets
- Registra quién validó, cuándo y resultado
- Resultados: `success`, `failed`, `already_used`, `expired`, `invalid`

## Características Principales

### 🔐 Seguridad (RLS)
- Políticas de Row Level Security para todas las tablas
- Los usuarios solo pueden ver/modificar sus propios datos
- Los administradores tienen acceso completo

### 🚀 Optimización
- Índices en columnas de búsqueda frecuente
- Índices parciales para mejorar rendimiento
- Índices compuestos donde es necesario

### 🔄 Triggers Automáticos
- `updated_at` se actualiza automáticamente
- Control automático de tickets disponibles
- Timestamps de pago completado

### 📊 Funciones de Reportes
- `get_new_users_over_time()` - Usuarios nuevos por día
- `get_sales_by_category()` - Ventas por categoría
- `get_ticket_validation_status()` - Estado de tickets
- `get_payment_stats()` - Estadísticas de pagos por pasarela

## Integración con Culqi (Perú)

El sistema está preparado para trabajar con Culqi, la principal pasarela de pagos de Perú:

- Campo `payment_gateway` (default: 'culqi')
- Campo `payment_metadata` (JSONB) para almacenar:
  - Marca de tarjeta (Visa, Mastercard, etc.)
  - Últimos 4 dígitos
  - Banco emisor
  - Información adicional de Culqi

## Métodos de Pago Soportados

- `credit_card` - Tarjeta de crédito
- `debit_card` - Tarjeta de débito
- `yape` - Yape (Perú)
- `plin` - Plin (Perú)
- `transfer` - Transferencia bancaria
- `cash` - Efectivo

## Notas Importantes

1. **Extensiones**: Asegúrate de que las extensiones estén habilitadas antes de crear las tablas
2. **RLS**: Las políticas RLS están activadas. Los usuarios deben estar autenticados para acceder a los datos
3. **Triggers**: Los triggers se ejecutan automáticamente, no es necesario llamarlos manualmente
4. **Índices**: Los índices mejoran el rendimiento pero ocupan espacio. Se han optimizado para las consultas más comunes

## Mantenimiento

### Limpiar datos de prueba
```sql
SELECT clear_seed_data();
```

### Promover usuario a validador QR
```sql
SELECT * FROM promote_to_qr_validator('email@example.com');
```

### Ver estadísticas de pagos
```sql
SELECT * FROM get_payment_stats(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

## Soporte

Para más información sobre el sistema, consulta la documentación principal del proyecto.

---

**Última actualización:** 2025-11-03
**Versión de PostgreSQL:** 17.x
**Versión de Supabase:** Compatible con todas las versiones actuales
