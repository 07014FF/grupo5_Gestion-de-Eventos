-- ========================================
-- ESQUEMA COMPLETO DEL SISTEMA DE TICKETS
-- ========================================
-- Este archivo contiene todo el esquema de la base de datos en un solo archivo
-- Para mejor organización, puedes usar los archivos individuales en esta carpeta
--
-- Orden de ejecución:
-- 1. Extensiones
-- 2. Tablas
-- 3. Funciones
-- 4. Triggers
-- 5. Políticas RLS
-- 6. Índices
-- 7. Vistas
--
-- Generado: 2025-11-03
-- ========================================

-- ========================================
-- 1. EXTENSIONES
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_graphql" SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS "supabase_vault" SCHEMA vault;

-- ========================================
-- 2. TABLAS
-- ========================================

-- Tabla: users
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

-- Tabla: events
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

-- Tabla: purchases
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

-- Tabla: tickets
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

-- Tabla: validations
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

-- ========================================
-- 3. FUNCIONES
-- ========================================

-- Función: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Función: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN COALESCE(user_role, 'client');
END;
$$;

-- Función: decrement_available_tickets
CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.events SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;
  RETURN NEW;
END;
$$;

-- Función: increment_available_tickets
CREATE OR REPLACE FUNCTION public.increment_available_tickets()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.events SET available_tickets = available_tickets + 1
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Función: update_payment_completed_at
CREATE OR REPLACE FUNCTION public.update_payment_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    NEW.payment_completed_at = NOW();
  END IF;
  IF NEW.payment_status != 'completed' AND OLD.payment_status = 'completed' THEN
    NEW.payment_completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Función: promote_to_qr_validator
CREATE OR REPLACE FUNCTION public.promote_to_qr_validator(user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  UPDATE public.users SET role = 'qr_validator'
  WHERE email = user_email RETURNING id INTO affected_user_id;
  IF affected_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Usuario no encontrado con ese email', NULL::UUID;
  ELSE
    RETURN QUERY SELECT TRUE, format('Usuario %s promovido a QR Validator exitosamente', user_email), affected_user_id;
  END IF;
END;
$$;

-- Función: clear_seed_data
CREATE OR REPLACE FUNCTION public.clear_seed_data()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.validations;
  DELETE FROM public.tickets;
  DELETE FROM public.purchases;
  DELETE FROM public.events;
  RAISE NOTICE 'Datos semilla eliminados exitosamente';
END;
$$;

-- Funciones de reportes
CREATE OR REPLACE FUNCTION public.get_new_users_over_time()
RETURNS TABLE(date VARCHAR, count BIGINT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD')::VARCHAR as date, COUNT(id) as count
  FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY date_trunc('day', created_at)
  ORDER BY date_trunc('day', created_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_category()
RETURNS TABLE(category VARCHAR, total_sales NUMERIC) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT e.category::VARCHAR, SUM(p.total_amount) as total_sales
  FROM purchases p JOIN events e ON p.event_id = e.id
  WHERE p.payment_status = 'completed'
  GROUP BY e.category;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ticket_validation_status()
RETURNS TABLE(status VARCHAR, count BIGINT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT t.status::VARCHAR, COUNT(t.id) as count
  FROM tickets t GROUP BY t.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payment_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  gateway TEXT, total_transactions BIGINT, successful_transactions BIGINT,
  failed_transactions BIGINT, total_amount NUMERIC, avg_amount NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT p.payment_gateway,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'completed') as successful_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'failed') as failed_transactions,
    SUM(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as total_amount,
    AVG(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as avg_amount
  FROM public.purchases p
  WHERE p.created_at BETWEEN start_date AND end_date
  GROUP BY p.payment_gateway;
END;
$$;

-- ========================================
-- 4. TRIGGERS
-- ========================================

-- Triggers: updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers: Control de tickets
CREATE TRIGGER trigger_decrement_tickets
  AFTER INSERT ON public.tickets FOR EACH ROW
  EXECUTE FUNCTION public.decrement_available_tickets();

CREATE TRIGGER trigger_increment_tickets
  AFTER UPDATE ON public.tickets FOR EACH ROW
  EXECUTE FUNCTION public.increment_available_tickets();

-- Triggers: Control de pagos
CREATE TRIGGER trigger_update_payment_completed_at
  BEFORE UPDATE ON public.purchases FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_completed_at();

-- ========================================
-- 5. POLÍTICAS RLS
-- ========================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- Políticas: users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Políticas: events
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (status IN ('active', 'completed'));
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Políticas: purchases
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
CREATE POLICY "Admins can update purchases" ON public.purchases FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Políticas: tickets
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
CREATE POLICY "Admins can update tickets" ON public.tickets FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Políticas: validations
CREATE POLICY "Users can view own ticket validations" ON public.validations FOR SELECT
USING (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = validations.ticket_id AND tickets.user_id = auth.uid()));
CREATE POLICY "Admins can insert validations" ON public.validations FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
CREATE POLICY "Admins can view all validations" ON public.validations FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ========================================
-- 6. ÍNDICES
-- ========================================

-- Índices: users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Índices: events
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_student_price ON public.events(student_price);
CREATE INDEX IF NOT EXISTS idx_events_general_price ON public.events(general_price);

-- Índices: purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON public.purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON public.purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_gateway ON public.purchases(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_transaction_id ON public.purchases(payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_payment_completed_at ON public.purchases(payment_completed_at DESC) WHERE payment_completed_at IS NOT NULL;

-- Índices: tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_id ON public.tickets(purchase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

-- Índices: validations
CREATE INDEX IF NOT EXISTS idx_validations_ticket_id ON public.validations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_validations_validated_by ON public.validations(validated_by);
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON public.validations(created_at DESC);

-- ========================================
-- 7. VISTAS
-- ========================================

CREATE OR REPLACE VIEW public.purchases_with_payment_info AS
SELECT
  p.id, p.user_id, p.event_id, p.total_amount, p.payment_method, p.payment_status,
  p.payment_gateway, p.payment_transaction_id, p.transaction_id, p.payment_completed_at,
  p.created_at, p.user_name, p.user_email, e.title as event_title, e.date as event_date,
  p.payment_metadata->>'card_brand' as card_brand,
  p.payment_metadata->>'last_four' as card_last_four,
  p.payment_metadata->>'bank' as bank_name
FROM public.purchases p
INNER JOIN public.events e ON p.event_id = e.id;

-- ========================================
-- FIN DEL ESQUEMA
-- ========================================
