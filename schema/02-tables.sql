-- ========================================
-- TABLAS DEL SISTEMA DE TICKETS
-- ========================================
-- Este archivo contiene todas las tablas del schema public

-- ========================================
-- TABLA: users
-- Descripción: Almacena información de usuarios del sistema
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    document VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin', 'qr_validator')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de tabla
COMMENT ON TABLE public.users IS 'Tabla de usuarios del sistema con roles y perfiles';
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: client (comprador), admin (administrador), super_admin, qr_validator (validador de QR)';

-- ========================================
-- TABLA: events
-- Descripción: Almacena información de eventos
-- ========================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    image_url TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    venue VARCHAR(255),
    price NUMERIC NOT NULL CHECK (price >= 0),
    available_tickets INTEGER NOT NULL CHECK (available_tickets >= 0),
    total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
    category VARCHAR(100),
    rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
    student_price NUMERIC DEFAULT 0.00,
    general_price NUMERIC DEFAULT 5.00,
    created_by UUID REFERENCES public.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de tabla
COMMENT ON TABLE public.events IS 'Tabla de eventos disponibles para compra de tickets';
COMMENT ON COLUMN public.events.status IS 'Estado del evento: active, cancelled, completed, draft';
COMMENT ON COLUMN public.events.student_price IS 'Precio especial para estudiantes';
COMMENT ON COLUMN public.events.general_price IS 'Precio general del evento';

-- ========================================
-- TABLA: purchases
-- Descripción: Almacena información de compras realizadas
-- ========================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'transfer', 'yape', 'plin')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    transaction_id VARCHAR(255),
    payment_gateway TEXT DEFAULT 'culqi',
    payment_transaction_id TEXT,
    payment_receipt_url TEXT,
    payment_metadata JSONB,
    payment_completed_at TIMESTAMPTZ,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    user_document VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de tabla
COMMENT ON TABLE public.purchases IS 'Tabla de compras realizadas por los usuarios';
COMMENT ON COLUMN public.purchases.payment_status IS 'Estado del pago: pending, processing, completed, failed, refunded, cancelled';
COMMENT ON COLUMN public.purchases.payment_gateway IS 'Pasarela de pago utilizada (culqi para Perú)';
COMMENT ON COLUMN public.purchases.payment_metadata IS 'Información adicional de la pasarela de pago (marca de tarjeta, banco, etc)';

-- ========================================
-- TABLA: tickets
-- Descripción: Almacena información de tickets generados
-- ========================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ticket_type VARCHAR(100) NOT NULL DEFAULT 'General',
    seat_number VARCHAR(50),
    price NUMERIC NOT NULL CHECK (price >= 0),
    qr_code_data TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'expired')),
    used_at TIMESTAMPTZ,
    validated_by UUID REFERENCES public.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de tabla
COMMENT ON TABLE public.tickets IS 'Tabla de tickets generados para eventos';
COMMENT ON COLUMN public.tickets.status IS 'Estado del ticket: active, used, cancelled, expired';
COMMENT ON COLUMN public.tickets.qr_code_data IS 'Datos codificados en el QR del ticket';
COMMENT ON COLUMN public.tickets.validated_by IS 'Usuario que validó el ticket (QR validator)';

-- ========================================
-- TABLA: validations
-- Descripción: Almacena historial de validaciones de tickets
-- ========================================
CREATE TABLE IF NOT EXISTS public.validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    validated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE NO ACTION,
    validation_result VARCHAR(50) NOT NULL CHECK (validation_result IN ('success', 'failed', 'already_used', 'expired', 'invalid')),
    validation_message TEXT,
    device_info TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios de tabla
COMMENT ON TABLE public.validations IS 'Historial de validaciones de tickets';
COMMENT ON COLUMN public.validations.validation_result IS 'Resultado de la validación: success, failed, already_used, expired, invalid';
