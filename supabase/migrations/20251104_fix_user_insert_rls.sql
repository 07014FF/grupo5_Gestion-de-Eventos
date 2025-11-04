-- =====================================================
-- FIX: Política RLS para permitir INSERT en tabla users
-- Problema: Los nuevos usuarios no podían registrarse
-- Solución: Permitir INSERT para usuarios autenticados
-- Fecha: 2025-11-04
-- =====================================================

-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Crear nueva política que permita a usuarios autenticados insertar su perfil
-- Esta política se ejecuta DURANTE el signup, cuando auth.uid() ya existe
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Agregar política adicional para permitir signup sin autenticación previa
-- Esto es necesario porque durante el registro el usuario aún no está "logged in"
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;

CREATE POLICY "Allow signup insert"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Comentarios para documentación
COMMENT ON POLICY "Users can insert own profile" ON public.users IS
  'Permite a usuarios autenticados insertar su propio perfil durante signup';

COMMENT ON POLICY "Allow signup insert" ON public.users IS
  'Permite inserción de perfil durante proceso de signup (anon + authenticated)';

-- Verificar que las políticas se crearon correctamente
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;
