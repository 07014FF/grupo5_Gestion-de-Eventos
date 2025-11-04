-- =====================================================
-- MIGRACION: Row Level Security (RLS) Policies
-- Sistema de Tickets para Eventos
-- Fecha: 2025-01-01
-- =====================================================

-- =====================================================
-- FUNCIÓN HELPER: Obtener rol del usuario
-- Esta función evita recursión infinita en las políticas RLS
-- =====================================================

-- No usar DROP FUNCTION porque tiene dependencias
-- CREATE OR REPLACE es suficiente y seguro

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta como el dueño de la función, ignora RLS
STABLE -- No modifica datos
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'client');
END;
$$;

-- Dar permiso de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

COMMENT ON FUNCTION public.get_user_role IS 'Obtiene el rol de un usuario sin causar recursión en RLS';

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: users
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Policy 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 3: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Policy 4: Permitir INSERT durante signup
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLICIES: events
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Policy 1: Todos pueden ver eventos activos (incluso usuarios no autenticados)
CREATE POLICY "Anyone can view active events"
  ON public.events FOR SELECT
  USING (status IN ('active', 'completed'));

-- Policy 2: Admins pueden insertar eventos
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 3: Admins pueden actualizar eventos
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 4: Admins pueden eliminar eventos
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- =====================================================
-- POLICIES: purchases
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;

-- Policy 1: Los usuarios pueden ver sus propias compras
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Los usuarios pueden crear compras
CREATE POLICY "Users can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins pueden ver todas las compras
CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 4: Admins pueden actualizar compras (para cambiar estado de pago)
CREATE POLICY "Admins can update purchases"
  ON public.purchases FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- =====================================================
-- POLICIES: tickets
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;

-- Policy 1: Los usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Los usuarios pueden crear tickets (a través de compras)
CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins pueden ver todos los tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 4: Admins pueden actualizar tickets (validar)
CREATE POLICY "Admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- =====================================================
-- POLICIES: validations
-- =====================================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;
DROP POLICY IF EXISTS "Users can view own ticket validations" ON public.validations;

-- Policy 1: Admins pueden insertar validaciones
CREATE POLICY "Admins can insert validations"
  ON public.validations FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 2: Admins pueden ver todas las validaciones
CREATE POLICY "Admins can view all validations"
  ON public.validations FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 3: Los usuarios pueden ver validaciones de sus propios tickets
CREATE POLICY "Users can view own ticket validations"
  ON public.validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = validations.ticket_id AND tickets.user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS
-- =====================================================

-- Mostrar todas las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FIN DE MIGRACIÓN RLS
-- =====================================================
