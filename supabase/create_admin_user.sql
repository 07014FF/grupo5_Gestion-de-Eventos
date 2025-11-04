-- =====================================================
-- SCRIPT: Crear Usuario Administrador
-- =====================================================
-- Este script te ayuda a gestionar usuarios administradores
-- =====================================================

-- =====================================================
-- OPCIÓN 1: Ver todos los usuarios actuales
-- =====================================================
\echo ''
\echo '========================================='
\echo 'USUARIOS ACTUALES'
\echo '========================================='

SELECT
  id,
  name,
  email,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

\echo ''

-- =====================================================
-- OPCIÓN 2: Promover usuario existente a admin
-- =====================================================
-- Descomenta y modifica el email para promover un usuario:

/*
UPDATE public.users
SET role = 'super_admin'  -- Opciones: 'client', 'admin', 'super_admin'
WHERE email = 'usuario@ejemplo.com';

-- Verificar el cambio
SELECT id, name, email, role
FROM public.users
WHERE email = 'usuario@ejemplo.com';
*/

-- =====================================================
-- OPCIÓN 3: Crear perfil para usuario de auth existente
-- =====================================================
-- Si creaste un usuario en Authentication → Users pero no tiene perfil:

/*
-- Primero, ver usuarios en auth sin perfil en public.users
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Luego, crear el perfil (reemplaza los valores)
INSERT INTO public.users (id, name, email, role)
VALUES (
  'UUID_DEL_USUARIO_DE_AUTH',  -- El UUID de auth.users
  'Nombre del Usuario',
  'email@ejemplo.com',
  'super_admin'  -- Opciones: 'client', 'admin', 'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role;
*/

-- =====================================================
-- OPCIÓN 4: Ver usuarios por rol
-- =====================================================
\echo ''
\echo '========================================='
\echo 'RESUMEN POR ROL'
\echo '========================================='

SELECT
  role,
  COUNT(*) as cantidad,
  array_agg(email ORDER BY created_at) as usuarios
FROM public.users
GROUP BY role
ORDER BY role;

\echo ''

-- =====================================================
-- OPCIÓN 5: Degradar admin a cliente
-- =====================================================
-- Descomenta para quitar permisos de admin:

/*
UPDATE public.users
SET role = 'client'
WHERE email = 'ex-admin@ejemplo.com';
*/

-- =====================================================
-- FUNCIÓN HELPER: Promover a admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT, admin_role TEXT DEFAULT 'admin')
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID) AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Validar que el rol sea válido
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RETURN QUERY SELECT FALSE, 'Rol inválido. Usa: admin o super_admin', NULL::UUID;
    RETURN;
  END IF;

  -- Actualizar el rol
  UPDATE public.users
  SET role = admin_role
  WHERE email = user_email
  RETURNING id INTO affected_user_id;

  -- Verificar si se actualizó
  IF affected_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Usuario no encontrado con ese email', NULL::UUID;
  ELSE
    RETURN QUERY SELECT TRUE, format('Usuario %s promovido a %s exitosamente', user_email, admin_role), affected_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.promote_to_admin IS 'Promueve un usuario a admin o super_admin';

-- =====================================================
-- FUNCIÓN HELPER: Degradar a cliente
-- =====================================================

CREATE OR REPLACE FUNCTION public.demote_to_client(user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID) AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Actualizar el rol
  UPDATE public.users
  SET role = 'client'
  WHERE email = user_email
  RETURNING id INTO affected_user_id;

  -- Verificar si se actualizó
  IF affected_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Usuario no encontrado con ese email', NULL::UUID;
  ELSE
    RETURN QUERY SELECT TRUE, format('Usuario %s degradado a cliente', user_email), affected_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.demote_to_client IS 'Degrada un admin/super_admin a cliente';

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

\echo ''
\echo '========================================='
\echo 'FUNCIONES CREADAS - EJEMPLOS DE USO'
\echo '========================================='
\echo ''
\echo 'Promover a admin:'
\echo "  SELECT * FROM public.promote_to_admin('usuario@email.com', 'admin');"
\echo ''
\echo 'Promover a super admin:'
\echo "  SELECT * FROM public.promote_to_admin('usuario@email.com', 'super_admin');"
\echo ''
\echo 'Degradar a cliente:'
\echo "  SELECT * FROM public.demote_to_client('usuario@email.com');"
\echo ''

-- =====================================================
-- PRUEBA LAS FUNCIONES (Descomenta para probar)
-- =====================================================

/*
-- Promover a admin
SELECT * FROM public.promote_to_admin('nuevo-admin@ejemplo.com', 'super_admin');

-- Ver el resultado
SELECT id, name, email, role FROM public.users WHERE email = 'nuevo-admin@ejemplo.com';
*/

-- =====================================================
-- INFORMACIÓN ÚTIL
-- =====================================================

\echo ''
\echo '========================================='
\echo 'DIFERENCIAS ENTRE ROLES'
\echo '========================================='
\echo ''
\echo 'CLIENT:'
\echo '  - Puede ver y comprar tickets'
\echo '  - Ve solo sus propias compras y tickets'
\echo '  - No puede crear eventos'
\echo ''
\echo 'ADMIN:'
\echo '  - Todo lo de CLIENT +'
\echo '  - Puede crear, editar y eliminar eventos'
\echo '  - Puede ver todas las compras y tickets'
\echo '  - Puede validar tickets'
\echo ''
\echo 'SUPER_ADMIN:'
\echo '  - Todo lo de ADMIN +'
\echo '  - Puede gestionar otros usuarios (futuro)'
\echo '  - Acceso completo al sistema'
\echo ''

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
