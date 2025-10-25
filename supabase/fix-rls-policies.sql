-- ================================================================
-- FIX: Corregir recursión infinita en políticas RLS
-- ================================================================
-- Este script soluciona el error:
-- "Infinite recursion detected in policy for relation users"
--
-- PROBLEMA: Las políticas que verifican el rol del usuario
-- creaban una recursión infinita al consultar la misma tabla users.
--
-- SOLUCIÓN: Usar auth.uid() directamente y una función helper
-- que use security definer para evitar RLS en la verificación.
-- ================================================================

-- ================================================================
-- PASO 1: Crear función helper para obtener el rol del usuario
-- ================================================================
-- Esta función evita la recursión porque se ejecuta con
-- SECURITY DEFINER, lo que significa que ignora las políticas RLS

DROP FUNCTION IF EXISTS public.get_user_role(uuid);

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Clave: ejecuta como el dueño de la función, no como el usuario
STABLE -- La función es estable (no modifica datos)
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

-- ================================================================
-- PASO 2: Eliminar todas las políticas existentes de users
-- ================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- ================================================================
-- PASO 3: Crear nuevas políticas SIN recursión
-- ================================================================

-- Policy 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Los admins pueden ver todos los perfiles
-- CLAVE: Usa la función helper en lugar de hacer SELECT directamente
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
-- Esta política permite que se cree el perfil en public.users
-- cuando un usuario se registra
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ================================================================
-- PASO 4: Actualizar políticas de events para usar la función
-- ================================================================

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Recrear con la función helper
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- ================================================================
-- PASO 5: Actualizar políticas de purchases
-- ================================================================

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- ================================================================
-- PASO 6: Actualizar políticas de tickets
-- ================================================================

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;

CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- ================================================================
-- PASO 7: Actualizar políticas de validations
-- ================================================================

DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;

CREATE POLICY "Admins can insert validations"
  ON public.validations FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can view all validations"
  ON public.validations FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- ================================================================
-- PASO 8: Verificar que todo funciona
-- ================================================================

-- Mostrar todas las políticas de users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Mostrar la función creada
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'get_user_role';

-- ================================================================
-- RESULTADO ESPERADO:
-- ================================================================
-- ✅ 4 políticas en la tabla users
-- ✅ Función get_user_role creada con SECURITY DEFINER
-- ✅ Sin errores de recursión infinita
-- ✅ Los usuarios pueden iniciar sesión y ver su perfil
-- ✅ Los roles se cargan correctamente

-- ================================================================
-- INSTRUCCIONES DE USO:
-- ================================================================
-- 1. Ve a Supabase Dashboard
-- 2. Abre SQL Editor
-- 3. Copia y pega TODO este script
-- 4. Ejecuta (Run)
-- 5. Verifica que no haya errores
-- 6. Prueba login en la app

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
