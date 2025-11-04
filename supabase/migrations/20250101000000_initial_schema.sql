-- =====================================================
-- MIGRACION INICIAL: Esquema de Base de Datos
-- Sistema de Tickets para Eventos
-- Fecha: 2025-01-01
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users
-- Perfil extendido de usuarios (complementa auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  document VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

COMMENT ON TABLE public.users IS 'Perfiles de usuario extendidos que complementan auth.users';
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: client (default), admin, super_admin';

-- =====================================================
-- TABLA: events
-- Eventos disponibles para compra de tickets
-- =====================================================
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
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  available_tickets INTEGER NOT NULL CHECK (available_tickets >= 0),
  total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
  category VARCHAR(100),
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

COMMENT ON TABLE public.events IS 'Eventos disponibles para compra de tickets';
COMMENT ON COLUMN public.events.status IS 'Estado: draft, active, cancelled, completed';
COMMENT ON COLUMN public.events.available_tickets IS 'Tickets disponibles (se decrementa con cada compra)';

-- =====================================================
-- TABLA: purchases
-- Registro de compras de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'yape', 'plin', 'pse', 'nequi', 'daviplata')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(255),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(50),
  user_document VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON public.purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON public.purchases(transaction_id);

COMMENT ON TABLE public.purchases IS 'Registro de compras realizadas por usuarios';
COMMENT ON COLUMN public.purchases.payment_method IS 'Método de pago: card, yape, plin (Perú), pse, nequi, daviplata (Colombia)';
COMMENT ON COLUMN public.purchases.payment_status IS 'Estado del pago: pending, completed, failed, refunded';

-- =====================================================
-- TABLA: tickets
-- Tickets individuales generados por cada compra
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_type VARCHAR(100) NOT NULL DEFAULT 'General',
  seat_number VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  qr_code_data TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  used_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_id ON public.tickets(purchase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

COMMENT ON TABLE public.tickets IS 'Tickets individuales generados por cada compra';
COMMENT ON COLUMN public.tickets.ticket_code IS 'Código único del ticket (usado en QR)';
COMMENT ON COLUMN public.tickets.status IS 'Estado: active, used, expired, cancelled';

-- =====================================================
-- TABLA: validations
-- Registro de todas las validaciones de tickets
-- =====================================================
CREATE TABLE IF NOT EXISTS public.validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  validated_by UUID NOT NULL REFERENCES public.users(id),
  validation_result VARCHAR(50) NOT NULL CHECK (validation_result IN ('valid', 'invalid', 'already_used', 'expired', 'cancelled')),
  validation_message TEXT,
  device_info TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validations_ticket_id ON public.validations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_validations_validated_by ON public.validations(validated_by);
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON public.validations(created_at DESC);

COMMENT ON TABLE public.validations IS 'Registro de validaciones de tickets en eventos';
COMMENT ON COLUMN public.validations.validation_result IS 'Resultado: valid, invalid, already_used, expired, cancelled';

-- =====================================================
-- TRIGGERS: Updated At
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabla
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS: Gestión de Tickets Disponibles
-- =====================================================

-- Decrementar tickets disponibles al crear un ticket
CREATE OR REPLACE FUNCTION decrement_available_tickets()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;
CREATE TRIGGER trigger_decrement_tickets AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION decrement_available_tickets();

-- Incrementar tickets disponibles al cancelar un ticket
CREATE OR REPLACE FUNCTION increment_available_tickets()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.events
    SET available_tickets = available_tickets + 1
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_tickets ON public.tickets;
CREATE TRIGGER trigger_increment_tickets AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION increment_available_tickets();

-- =====================================================
-- FIN DE MIGRACIÓN INICIAL
-- =====================================================
