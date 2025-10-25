-- ====================================
-- SCRIPT PARA ARREGLAR PROBLEMA DE ROL ADMIN
-- ====================================
-- Ejecuta este script en Supabase SQL Editor

-- 1. VERIFICAR QUE EL USUARIO EXISTE CON ROL ADMIN
SELECT
  id,
  name,
  email,
  role,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. SI TU USUARIO NO TIENE ROL ADMIN, ACTUALÍZALO
-- Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
UPDATE public.users
SET role = 'admin'
WHERE email = 'TU_EMAIL@ejemplo.com';

-- Verificar el cambio
SELECT id, name, email, role
FROM public.users
WHERE email = 'TU_EMAIL@ejemplo.com';

-- 3. VERIFICAR POLÍTICAS RLS ACTUALES
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 4. ELIMINAR POLÍTICAS ANTIGUAS (si existen)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- 5. CREAR POLÍTICAS RLS CORRECTAS
-- Permitir a los usuarios leer su propio perfil (INCLUYENDO EL ROL)
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Permitir a los usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir a los admins leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- 6. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- 7. VERIFICAR RLS ESTÁ HABILITADO
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- 8. TEST FINAL - Simular consulta como usuario autenticado
-- Esto debería devolver el rol correctamente
SELECT
  id,
  name,
  email,
  role
FROM public.users
WHERE id = auth.uid();

-- ====================================
-- COMANDOS DE VERIFICACIÓN ADICIONALES
-- ====================================

-- Ver todos los usuarios con sus roles
SELECT
  email,
  role,
  name,
  created_at
FROM public.users
ORDER BY
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'client' THEN 3
    ELSE 4
  END,
  created_at DESC;

-- Contar usuarios por rol
SELECT
  role,
  COUNT(*) as cantidad
FROM public.users
GROUP BY role
ORDER BY cantidad DESC;

-- ====================================
-- SI TODAVÍA NO FUNCIONA
-- ====================================

-- Opción A: Deshabilitar RLS temporalmente para testing
-- ⚠️ SOLO PARA DESARROLLO - NO EN PRODUCCIÓN
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Opción B: Recrear la tabla users (¡CUIDADO! Borra datos)
-- Solo usar si es un proyecto nuevo sin datos importantes
-- DROP TABLE IF EXISTS public.users CASCADE;
-- Luego ejecuta de nuevo el schema.sql completo

-- ====================================
-- NOTAS IMPORTANTES
-- ====================================
-- 1. Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
-- 2. Ejecuta este script línea por línea o sección por sección
-- 3. Verifica los resultados después de cada sección
-- 4. Si ves errores de permisos, contacta al propietario del proyecto
