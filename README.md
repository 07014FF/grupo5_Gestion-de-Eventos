# 🎟️ Sistema de Venta de Tickets para Eventos

Aplicación móvil multiplataforma para la venta y gestión de tickets de eventos con validación QR, panel de administración y múltiples métodos de pago para el mercado peruano.

## 📋 Descripción

Sistema completo de venta de entradas para eventos que incluye:
- 📱 Aplicación móvil para usuarios (React Native + Expo)
- 🔐 Sistema de autenticación y roles
- 💳 Integración con pasarelas de pago peruanas (Culqi, Yape, Plin)
- 📊 Panel de administración para gestión de eventos
- 🎫 Generación de tickets con códigos QR únicos
- ✅ Sistema de validación de tickets en tiempo real
- 📈 Reportes y analíticas de ventas

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Frontend** | React Native | 0.81.5 | Framework móvil multiplataforma |
| | Expo | 54.0.21 | Herramientas de desarrollo |
| | TypeScript | 5.9.2 | Tipado estático |
| | Expo Router | 6.0.14 | Navegación basada en archivos |
| **Backend** | Supabase | 2.75.0 | Base de datos PostgreSQL + Auth |
| **Estado** | Zustand | 5.0.8 | Gestión de estado global |
| | React Hook Form | 7.66.0 | Gestión de formularios |
| **UI/UX** | NativeWind | 4.2.1 | Styling con Tailwind CSS |
| | Expo Linear Gradient | 15.0.7 | Gradientes nativos |
| **QR** | react-native-qrcode-svg | 6.3.15 | Generación de códigos QR |
| | expo-barcode-scanner | 13.0.1 | Escaneo de códigos QR |
| **Pagos** | Culqi API | v2 | Procesamiento de pagos Perú |
| **Reportes** | expo-print | 15.0.7 | Generación de PDFs |
| | expo-sharing | 14.0.7 | Compartir documentos |
| **Gráficos** | react-native-chart-kit | 6.12.0 | Visualización de datos |
| **Validación** | Zod | 3.25.76 | Validación de esquemas |

---

## ✨ Características Principales

| Módulo | Funcionalidad | Descripción |
|--------|---------------|-------------|
| **👤 Autenticación** | Registro/Login | Sistema completo con email y contraseña |
| | Recuperación de contraseña | Reset vía email |
| | Roles de usuario | 4 roles: customer, qr_validator, admin, super_admin |
| **🎭 Eventos** | Catálogo de eventos | Listado con categorías, filtros y búsqueda |
| | Detalles del evento | Información completa, ubicación, fecha, precio |
| | Badges de estado | Estados: Disponible, Próximo, Finalizado |
| | Precios diferenciados | Precio general y precio estudiante |
| **🎫 Tickets** | Compra de tickets | Flujo completo de compra con validación |
| | Tickets gratuitos | Soporte para estudiantes (precio = 0) |
| | Generación QR | Código QR único por ticket |
| | Mis Tickets | Vista de tickets comprados con QR |
| | Compartir tickets | Exportar como PDF o compartir |
| **💰 Pagos** | Culqi | Tarjetas de crédito/débito |
| | Yape | Pago móvil Perú |
| | Plin | Pago móvil Perú |
| | Manual/Efectivo | Pago manual registrado |
| | Tickets gratis | Sin procesamiento de pago |
| **✅ Validación** | Escáner QR | Validación en tiempo real |
| | Historial | Registro de todas las validaciones |
| | Detección duplicados | Previene uso múltiple del mismo ticket |
| **📊 Administración** | Dashboard | Métricas de ventas, eventos y usuarios |
| | Gestión de eventos | Crear, editar, cancelar eventos |
| | Gestión de usuarios | Asignar roles, ver actividad |
| | Reportes | Ventas por evento, categoría, período |
| | Exportar datos | PDF con gráficos y estadísticas |
| **🔒 Seguridad** | Row Level Security | Políticas RLS en PostgreSQL |
| | Encriptación QR | Firma digital en códigos QR |
| | HTTPS | Todas las comunicaciones cifradas |
| | Triggers automáticos | Decrementar tickets, confirmar emails |

---

## 📁 Estructura del Proyecto

```
01-proyect/
├── app/                          # Pantallas de la aplicación (Expo Router)
│   ├── (tabs)/                   # Navegación con tabs
│   │   ├── index.tsx            # 🏠 Inicio - Catálogo de eventos
│   │   ├── my-tickets.tsx       # 🎫 Mis Tickets comprados
│   │   ├── profile.tsx          # 👤 Perfil de usuario
│   │   └── qr.tsx               # 📷 Escáner QR (validadores)
│   ├── admin/                    # Panel de administración
│   │   ├── dashboard.tsx        # 📊 Dashboard con métricas
│   │   ├── create-event.tsx     # ➕ Crear/editar eventos
│   │   └── user-management/     # 👥 Gestión de usuarios
│   ├── event-detail.tsx         # 📋 Detalle de evento
│   ├── purchase.tsx             # 💳 Compra de tickets
│   ├── qr-validation.tsx        # ✅ Validación de tickets
│   ├── reports.tsx              # 📈 Reportes y analíticas
│   ├── login-modal.tsx          # 🔐 Login/Registro
│   ├── forgot-password.tsx      # 🔑 Recuperar contraseña
│   ├── reset-password.tsx       # 🔄 Resetear contraseña
│   └── _layout.tsx              # Layout raíz
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base de UI
│   │   ├── Button.tsx           # Botones con variantes
│   │   ├── Card.tsx             # Tarjetas
│   │   ├── Input.tsx            # Inputs controlados
│   │   ├── ControlledInput.tsx  # Input con React Hook Form
│   │   ├── EmptyState.tsx       # Estados vacíos
│   │   ├── Skeleton.tsx         # Loading skeletons
│   │   ├── Toast.tsx            # Notificaciones
│   │   └── NotificationBanner.tsx # Banners informativos
│   ├── admin/                    # Componentes del panel admin
│   │   ├── EventCard.tsx        # Tarjeta de evento
│   │   ├── MetricCard.tsx       # Tarjeta de métrica
│   │   └── UserTable.tsx        # Tabla de usuarios
│   ├── payment/                  # Componentes de pago
│   │   └── PaymentMethodSelector.tsx # Selector de métodos
│   ├── TicketQRModal.tsx        # Modal con QR del ticket
│   ├── ErrorBoundary.tsx        # Manejo de errores
│   └── FormContainer.tsx        # Container para formularios
├── services/                     # Lógica de negocio y APIs
│   ├── event.service.ts         # Gestión de eventos
│   ├── ticket.service.supabase.ts # Gestión de tickets
│   ├── payment.service.ts       # Procesamiento de pagos
│   ├── qr.service.ts            # Generación/validación QR
│   ├── user.service.ts          # Gestión de usuarios
│   ├── report.service.ts        # Generación de reportes
│   ├── share.service.ts         # Compartir documentos
│   └── analytics.service.ts     # Analíticas
├── context/                      # Contextos de React
│   ├── AuthContext.tsx          # Autenticación global
│   └── ThemeContext.tsx         # Tema dark/light
├── hooks/                        # Hooks personalizados
│   └── useThemeColors.ts        # Hook para colores del tema
├── constants/                    # Constantes y configuración
│   └── theme.ts                 # Sistema de colores y tema
├── types/                        # Definiciones TypeScript
│   ├── ticket.types.ts          # Tipos de tickets y eventos
│   └── navigation.types.ts      # Tipos de navegación
├── utils/                        # Utilidades
│   ├── errors.ts                # Manejo de errores
│   └── navigation.ts            # Helpers de navegación
├── lib/                          # Configuraciones de librerías
│   └── supabase.ts              # Cliente de Supabase
├── store/                        # Stores de Zustand
│   └── (stores globales)
├── supabase/                     # Configuración de base de datos
│   ├── migrations/              # Migraciones SQL
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_rls_policies.sql
│   │   ├── 20250101000002_payment_gateway_fields.sql
│   │   └── ...
│   └── functions/               # Edge Functions
│       └── payment-webhook/     # Webhook de pagos
├── assets/                       # Recursos estáticos
│   └── images/                  # Imágenes e iconos
├── .env                         # Variables de entorno (no versionado)
├── .env.example                 # Ejemplo de variables
├── app.json                     # Configuración de Expo
├── package.json                 # Dependencias del proyecto
└── tsconfig.json                # Configuración de TypeScript
```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `users`
Perfiles extendidos de usuarios (complementa `auth.users`)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, FK → auth.users | ID único del usuario |
| name | VARCHAR(255) | NOT NULL | Nombre completo |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email del usuario |
| phone | VARCHAR(50) | | Teléfono |
| document | VARCHAR(100) | | DNI/Documento |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'client' | Rol: client, qr_validator, admin, super_admin |
| avatar_url | TEXT | | URL del avatar |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Índices:** `email`, `role`

---

### Tabla: `events`
Eventos disponibles para compra de tickets

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | ID único del evento |
| title | VARCHAR(255) | NOT NULL | Título del evento |
| subtitle | VARCHAR(255) | | Subtítulo |
| description | TEXT | | Descripción completa |
| image_url | TEXT | | URL de la imagen |
| date | DATE | NOT NULL | Fecha del evento |
| time | TIME | NOT NULL | Hora del evento |
| location | VARCHAR(255) | NOT NULL | Ubicación/ciudad |
| venue | VARCHAR(255) | | Nombre del venue |
| price | DECIMAL(10,2) | NOT NULL, >= 0 | Precio general |
| student_price | DECIMAL(10,2) | >= 0 | Precio estudiante |
| general_price | DECIMAL(10,2) | >= 0 | Precio general (duplicado) |
| available_tickets | INTEGER | NOT NULL, >= 0 | Tickets disponibles |
| total_tickets | INTEGER | NOT NULL, > 0 | Total de tickets |
| category | VARCHAR(100) | | Categoría del evento |
| rating | DECIMAL(3,2) | 0-5 | Calificación |
| status | VARCHAR(50) | DEFAULT 'active' | draft, active, cancelled, completed |
| created_by | UUID | FK → users | Creador del evento |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Índices:** `date`, `status`, `category`, `created_by`

---

### Tabla: `purchases`
Registro de compras realizadas por usuarios

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | ID único de la compra |
| user_id | UUID | NOT NULL, FK → users | Usuario comprador |
| event_id | UUID | NOT NULL, FK → events | Evento comprado |
| total_amount | DECIMAL(10,2) | NOT NULL, >= 0 | Monto total |
| payment_method | VARCHAR(50) | NOT NULL | card, yape, plin, culqi, free, etc. |
| payment_status | VARCHAR(50) | DEFAULT 'pending' | pending, completed, failed, refunded |
| payment_gateway | VARCHAR(50) | | culqi, manual, free |
| payment_transaction_id | VARCHAR(255) | | ID de transacción externa |
| payment_receipt_url | TEXT | | URL del recibo |
| payment_metadata | JSONB | | Metadata del pago |
| payment_completed_at | TIMESTAMP | | Fecha de completado |
| transaction_id | VARCHAR(255) | | ID de transacción interna |
| user_name | VARCHAR(255) | NOT NULL | Nombre del comprador |
| user_email | VARCHAR(255) | NOT NULL | Email del comprador |
| user_phone | VARCHAR(50) | | Teléfono |
| user_document | VARCHAR(100) | | Documento |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de compra |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Índices:** `user_id`, `event_id`, `payment_status`, `created_at`, `transaction_id`, `payment_gateway`, `payment_transaction_id`

---

### Tabla: `tickets`
Tickets individuales generados por cada compra

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | ID único del ticket |
| ticket_code | VARCHAR(50) | NOT NULL, UNIQUE | Código único del ticket |
| purchase_id | UUID | NOT NULL, FK → purchases | Compra asociada |
| event_id | UUID | NOT NULL, FK → events | Evento del ticket |
| user_id | UUID | NOT NULL, FK → users | Propietario del ticket |
| ticket_type | VARCHAR(100) | DEFAULT 'General' | Tipo de ticket |
| seat_number | VARCHAR(50) | | Número de asiento |
| price | DECIMAL(10,2) | NOT NULL, >= 0 | Precio del ticket |
| qr_code_data | TEXT | NOT NULL | Datos encriptados del QR |
| status | VARCHAR(50) | DEFAULT 'active' | active, used, expired, cancelled |
| used_at | TIMESTAMP | | Fecha de uso |
| validated_by | UUID | FK → users | Usuario que validó |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Índices:** `user_id`, `event_id`, `purchase_id`, `status`, `ticket_code`

**Trigger:** `decrement_available_tickets` - Reduce automáticamente los tickets disponibles del evento

---

### Tabla: `validations`
Registro de todas las validaciones de tickets

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | ID único de validación |
| ticket_id | UUID | NOT NULL, FK → tickets | Ticket validado |
| validated_by | UUID | NOT NULL, FK → users | Usuario validador |
| validation_result | VARCHAR(50) | NOT NULL | valid, invalid, already_used, expired, cancelled |
| validation_message | TEXT | | Mensaje de validación |
| device_info | TEXT | | Información del dispositivo |
| location | TEXT | | Ubicación de validación |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de validación |

**Índices:** `ticket_id`, `validated_by`, `created_at`

---

## 👥 Roles de Usuario

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **customer** | - Ver eventos<br>- Comprar tickets<br>- Ver sus propios tickets<br>- Ver su perfil | - Catálogo de eventos<br>- Detalle de eventos<br>- Compra de tickets<br>- Mis Tickets<br>- Perfil |
| **qr_validator** | Todo lo de customer +<br>- Escanear QR<br>- Validar tickets<br>- Ver historial de validaciones | - Tab QR Scanner<br>- Pantalla de validación<br>- Historial |
| **admin** | Todo lo de qr_validator +<br>- Crear/editar eventos<br>- Ver dashboard<br>- Generar reportes<br>- Ver todas las compras | - Panel Admin<br>- Dashboard<br>- Crear eventos<br>- Reportes |
| **super_admin** | Todo lo de admin +<br>- Gestionar usuarios<br>- Asignar roles<br>- Acceso completo a BD<br>- Ver métricas avanzadas | - Gestión de usuarios<br>- Asignación de roles<br>- Configuración del sistema |

---

## 🔐 Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

### Variables Requeridas

```bash
# Supabase (OBLIGATORIO)
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Personal Access Token para MCP (OPCIONAL - solo para Claude Code)
SUPABASE_ACCESS_TOKEN=sbp_tu_token_aqui
```

### Variables de Pago (OPCIONALES)

Solo configura si quieres integrar pasarelas automáticas. La app funciona con pagos manuales por defecto.

```bash
# Culqi - Perú (tarjetas, Yape, Plin automáticos)
EXPO_PUBLIC_CULQI_PUBLIC_KEY=pk_test_tu_key
EXPO_PUBLIC_CULQI_SECRET_KEY=sk_test_tu_key
EXPO_PUBLIC_CULQI_API_URL=https://api.culqi.com/v2

# Wompi - Colombia (opcional)
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_tu_key
EXPO_PUBLIC_WOMPI_PRIVATE_KEY=prv_test_tu_key
EXPO_PUBLIC_WOMPI_EVENT_SECRET=tu_secret
EXPO_PUBLIC_WOMPI_API_URL=https://sandbox.wompi.co/v1

# Stripe - Internacional (opcional)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_key
STRIPE_SECRET_KEY=sk_test_tu_key
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta en Supabase (gratis)
- Expo Go app en tu móvil (para testing)

### Paso 1: Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd 01-proyect
```

### Paso 2: Instalar Dependencias

```bash
npm install
# o
yarn install
```

### Paso 3: Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard)
2. Copia tu URL y Anon Key desde: `Settings > API`
3. Crea el archivo `.env`:

```bash
cp .env.example .env
```

4. Pega tus credenciales en `.env`

### Paso 4: Ejecutar Migraciones

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login en Supabase
npx supabase login

# Vincular tu proyecto
npx supabase link --project-ref tu-proyecto-id

# Aplicar migraciones
npx supabase db push
```

### Paso 5: Crear Datos de Prueba (Opcional)

```bash
# Ejecutar seed en Supabase SQL Editor
# Archivo: supabase/seed-events.sql
```

### Paso 6: Ejecutar Trigger Fix

En el SQL Editor de Supabase, ejecuta:

```sql
-- Archivo: supabase/fix_trigger_now.sql
CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = NEW.event_id) THEN
      RAISE EXCEPTION 'El evento no existe';
    END IF;
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  RETURN NEW;
END;
$function$;
```

### Paso 7: Iniciar la Aplicación

```bash
# Iniciar Expo
npm start

# O en un puerto específico
npm run start:8085

# Escanea el QR con Expo Go
```

---

## 📱 Uso de la Aplicación

### Para Usuarios (Customers)

1. **Registrarse:** Click en "Crear cuenta" → Llenar formulario
2. **Explorar eventos:** Ver catálogo en la página de inicio
3. **Comprar tickets:**
   - Click en evento → "Obtener Entradas"
   - Seleccionar cantidad
   - Llenar datos del comprador
   - Seleccionar método de pago
   - Confirmar compra
4. **Ver tickets:** Tab "Mis Tickets" → Ver QR
5. **Compartir ticket:** Click en ticket → Compartir PDF

### Para Validadores QR

1. **Acceder al escáner:** Tab "QR" (solo visible con rol `qr_validator`)
2. **Escanear ticket:** Apuntar cámara al código QR
3. **Ver resultado:**
   - ✅ Verde = Ticket válido (se marca como usado)
   - ⚠️ Amarillo = Ya fue usado
   - ❌ Rojo = Ticket inválido/expirado

### Para Administradores

1. **Dashboard:** Ver métricas de ventas, eventos activos, usuarios
2. **Crear evento:**
   - Click "+" → Llenar formulario
   - Precio general y estudiante
   - Total de tickets disponibles
3. **Reportes:**
   - Filtrar por fecha, evento, categoría
   - Ver gráficos de ventas
   - Exportar PDF
4. **Gestionar usuarios** (solo super_admin):
   - Ver lista de usuarios
   - Cambiar roles
   - Ver actividad

---

## 💳 Métodos de Pago Soportados

| Método | País | Tipo | Configuración Requerida |
|--------|------|------|------------------------|
| **Culqi** | 🇵🇪 Perú | Automático | API Keys de Culqi |
| **Yape** | 🇵🇪 Perú | Manual | Ninguna (QR personal) |
| **Plin** | 🇵🇪 Perú | Manual | Ninguna (QR personal) |
| **Tarjeta** | Internacional | Automático | Culqi o Stripe |
| **Efectivo** | Universal | Manual | Ninguna |
| **Gratis** | Universal | Automático | Ninguna (estudiantes) |

### Flujo de Pago Manual (Yape/Plin)

1. Usuario selecciona Yape/Plin
2. App muestra QR del negocio
3. Usuario paga desde su app bancaria
4. Usuario sube captura de pantalla
5. Compra queda como `pending`
6. Admin aprueba manualmente en Supabase

### Flujo de Pago Automático (Culqi)

1. Usuario selecciona método
2. App abre formulario de Culqi
3. Usuario ingresa datos de tarjeta/confirmación
4. Culqi procesa el pago
5. Webhook notifica a la app
6. Tickets se generan automáticamente

---

## 🔒 Seguridad Implementada

| Característica | Implementación |
|----------------|----------------|
| **Row Level Security (RLS)** | Políticas en todas las tablas |
| **Autenticación** | Supabase Auth con JWT |
| **Encriptación QR** | Firma digital con datos del evento, usuario y fecha |
| **HTTPS** | Todas las peticiones cifradas |
| **Validación de inputs** | Zod schemas en formularios |
| **Triggers de seguridad** | `SECURITY DEFINER` para operaciones críticas |
| **Prevención de duplicados** | Validación de tickets ya usados |
| **Auditoría** | Tabla `validations` registra todas las validaciones |
| **Roles y permisos** | Control de acceso basado en roles |
| **Environment variables** | Credenciales en `.env` no versionadas |

### Políticas RLS Principales

```sql
-- Usuarios solo ven sus propios tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Solo admins pueden crear eventos
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Usuarios solo ven sus propias compras
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 📊 Arquitectura del Sistema

### Flujo de Compra de Tickets

```
Usuario → Selecciona Evento → Elige Cantidad → Ingresa Datos
         ↓
    Selecciona Método de Pago
         ↓
    ┌────────────────┬──────────────┐
    │                │              │
  Gratis         Manual         Automático
    │                │              │
    ↓                ↓              ↓
Crear Tickets   Pending       Culqi API
                    ↓              ↓
            Espera Admin      Webhook
                    ↓              ↓
                Aprobar    → Crear Tickets
                                   ↓
                            Generar QR
                                   ↓
                          Enviar Email (TODO)
```

### Flujo de Validación

```
Validador → Escanea QR → Decodificar datos → Verificar firma
                              ↓
                        Consultar BD
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                 Válido              Inválido
                    ↓                   ↓
            Marcar como usado    Mostrar error
                    ↓
        Registrar en validations
                    ↓
            Mostrar confirmación
```

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo en puerto por defecto |
| `npm run start:8085` | Inicia Expo en puerto 8085 |
| `npm run android` | Ejecuta en emulador Android |
| `npm run ios` | Ejecuta en simulador iOS |
| `npm run web` | Ejecuta en navegador web |
| `npm run lint` | Ejecuta linter de código |
| `npm run reset-project` | Reset del proyecto |

---

## 🐛 Solución de Problemas

### Error: "No hay tickets disponibles"

**Solución:** Ejecutar el trigger fix en Supabase SQL Editor (ver Paso 6)

### Error: "Email not confirmed"

**Solución:**
```sql
-- En Supabase SQL Editor
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'tu@email.com';
```

### Error al escribir en inputs de login

**Solución:** Ya está solucionado en la versión actual. Asegúrate de tener la última versión del código.

### Expo no inicia

**Solución:**
```bash
# Limpiar cache
npx expo start --clear

# O reinstalar dependencias
rm -rf node_modules
npm install
```

---

## 🎯 Próximas Características (TODO)

- [ ] Envío de emails automáticos con tickets
- [ ] Notificaciones push
- [ ] Chat de soporte en vivo
- [ ] Sistema de reembolsos
- [ ] Integración con calendarios
- [ ] Tickets transferibles
- [ ] Sistema de referidos
- [ ] Multi-idioma (inglés)

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para la gestión eficiente de eventos en Perú

---

## 📞 Soporte

Para reportar bugs o solicitar características:
1. Crear un issue en el repositorio
2. Contactar al equipo de desarrollo

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción
