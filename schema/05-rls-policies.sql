-- ========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================
-- Este archivo contiene todas las políticas de seguridad a nivel de fila

-- ========================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS: users
-- ========================================

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

-- Los usuarios pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Los administradores pueden ver todos los usuarios
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ========================================
-- POLÍTICAS RLS: events
-- ========================================

-- Cualquiera puede ver eventos activos
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
USING (status IN ('active', 'completed'));

-- Los administradores pueden insertar eventos
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events"
ON public.events FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Los administradores pueden actualizar eventos
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Los administradores pueden eliminar eventos
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ========================================
-- POLÍTICAS RLS: purchases
-- ========================================

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

-- Los administradores pueden ver todas las compras
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Los administradores pueden actualizar compras
DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;
CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ========================================
-- POLÍTICAS RLS: tickets
-- ========================================

-- Los usuarios pueden ver sus propios tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios pueden crear tickets
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los administradores pueden ver todos los tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Los administradores pueden actualizar tickets
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ========================================
-- POLÍTICAS RLS: validations
-- ========================================

-- Los usuarios pueden ver validaciones de sus propios tickets
DROP POLICY IF EXISTS "Users can view own ticket validations" ON public.validations;
CREATE POLICY "Users can view own ticket validations"
ON public.validations FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tickets
    WHERE tickets.id = validations.ticket_id
    AND tickets.user_id = auth.uid()
  )
);

-- Los administradores pueden insertar validaciones
DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;
CREATE POLICY "Admins can insert validations"
ON public.validations FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Los administradores pueden ver todas las validaciones
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;
CREATE POLICY "Admins can view all validations"
ON public.validations FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));
