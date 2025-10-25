-- =====================================================
-- SCHEMA DE BASE DE DATOS PARA SISTEMA DE TICKETS
-- Supabase PostgreSQL Database
-- =====================================================

-- Enable UUID extension
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

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

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

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- =====================================================
-- TABLA: purchases
-- Registro de compras de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'pse', 'nequi', 'daviplata')),
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: users
-- =====================================================

-- Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden ver todos los usuarios
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICIES: events
-- =====================================================

-- Todos pueden ver eventos activos
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
CREATE POLICY "Anyone can view active events"
  ON public.events FOR SELECT
  USING (status = 'active' OR status = 'completed');

-- Admins pueden insertar eventos
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins pueden actualizar eventos
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins pueden eliminar eventos
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICIES: purchases
-- =====================================================

-- Los usuarios pueden ver sus propias compras
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear compras
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
CREATE POLICY "Users can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todas las compras
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICIES: tickets
-- =====================================================

-- Los usuarios pueden ver sus propios tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear tickets (a través de compras)
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todos los tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins pueden actualizar tickets (validar)
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICIES: validations
-- =====================================================

-- Admins pueden insertar validaciones
DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;
CREATE POLICY "Admins can insert validations"
  ON public.validations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins pueden ver todas las validaciones
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;
CREATE POLICY "Admins can view all validations"
  ON public.validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Los usuarios pueden ver validaciones de sus propios tickets
DROP POLICY IF EXISTS "Users can view own ticket validations" ON public.validations;
CREATE POLICY "Users can view own ticket validations"
  ON public.validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = validations.ticket_id AND tickets.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
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
-- FUNCIÓN: Decrementar tickets disponibles al crear un ticket
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_available_tickets()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tickets available for this event';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;
CREATE TRIGGER trigger_decrement_tickets AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION decrement_available_tickets();

-- =====================================================
-- FUNCIÓN: Incrementar tickets disponibles al cancelar un ticket
-- =====================================================
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
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Nota: Después de crear un usuario en auth.users (a través de sign up),
-- se debe crear su entrada en public.users manualmente o mediante un trigger

-- Eventos de ejemplo (ejecutar después de tener usuarios)
-- INSERT INTO public.events (title, subtitle, date, time, location, price, available_tickets, total_tickets, category)
-- VALUES
--   ('Festival de Jazz 2024', 'Centro Cultural', '2024-12-20', '19:30', 'Bogotá', 45000, 150, 150, 'Música'),
--   ('Concierto Rock', 'Parque de la 93', '2024-12-25', '20:00', 'Bogotá', 60000, 200, 200, 'Música'),
--   ('Teatro: El Quijote', 'Teatro Nacional', '2024-12-15', '18:00', 'Bogotá', 35000, 100, 100, 'Teatro');
