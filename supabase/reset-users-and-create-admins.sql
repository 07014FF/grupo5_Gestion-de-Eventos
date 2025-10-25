-- ================================================================
-- SCRIPT PARA RESETEAR USUARIOS Y CREAR ADMIN/SUPER_ADMIN/CLIENT
-- ================================================================
-- Ejecuta TODO este script de una vez en Supabase SQL Editor
-- https://supabase.com/dashboard/project/djzumauhocdopfgjcmyf/sql

-- ================================================================
-- PASO 1: BORRAR TODOS LOS USUARIOS EXISTENTES
-- ================================================================

-- Primero borrar validaciones (dependen de usuarios)
DELETE FROM public.validations;

-- Borrar tickets (dependen de usuarios)
DELETE FROM public.tickets;

-- Borrar compras (dependen de usuarios)
DELETE FROM public.purchases;

-- Borrar perfiles de usuarios
DELETE FROM public.users;

-- Borrar usuarios de autenticación (auth)
-- CUIDADO: Esto borra TODOS los usuarios incluyéndote a ti
DELETE FROM auth.users;

-- Verificar que todo esté vacío
SELECT 'users' as tabla, COUNT(*) as cantidad FROM public.users
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'purchases', COUNT(*) FROM public.purchases
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'validations', COUNT(*) FROM public.validations;

-- Todas las cantidades deben ser 0

-- ================================================================
-- PASO 2: CREAR USUARIOS CON ROLES ESPECÍFICOS
-- ================================================================

-- IMPORTANTE: Anota estas credenciales
--
-- 📧 SUPER ADMIN:
--    Email: superadmin@ticketapp.com
--    Password: SuperAdmin123!
--    Role: super_admin
--
-- 🛡️ ADMIN:
--    Email: admin@ticketapp.com
--    Password: Admin123!
--    Role: admin
--
-- 👤 CLIENTE:
--    Email: cliente@ticketapp.com
--    Password: Cliente123!
--    Role: client

-- ================================================================
-- CREAR SUPER ADMIN
-- ================================================================

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Crear en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'superadmin@ticketapp.com',
    crypt('SuperAdmin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Super Administrador"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Crear perfil en public.users
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    new_user_id,
    'Super Administrador',
    'superadmin@ticketapp.com',
    'super_admin',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Super Admin creado con ID: %', new_user_id;
END $$;

-- ================================================================
-- CREAR ADMIN
-- ================================================================

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Crear en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@ticketapp.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrador"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Crear perfil en public.users
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    new_user_id,
    'Administrador',
    'admin@ticketapp.com',
    'admin',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Admin creado con ID: %', new_user_id;
END $$;

-- ================================================================
-- CREAR CLIENTE
-- ================================================================

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Crear en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'cliente@ticketapp.com',
    crypt('Cliente123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Usuario Cliente"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Crear perfil en public.users
  INSERT INTO public.users (id, name, email, role, created_at, updated_at)
  VALUES (
    new_user_id,
    'Usuario Cliente',
    'cliente@ticketapp.com',
    'client',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Cliente creado con ID: %', new_user_id;
END $$;

-- ================================================================
-- PASO 3: VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
-- ================================================================

SELECT
  id,
  name,
  email,
  role,
  created_at
FROM public.users
ORDER BY
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'client' THEN 3
  END;

-- Deberías ver 3 usuarios:
-- 1. Super Administrador | superadmin@ticketapp.com | super_admin
-- 2. Administrador       | admin@ticketapp.com      | admin
-- 3. Usuario Cliente     | cliente@ticketapp.com    | client

-- ================================================================
-- PASO 4: VERIFICAR AUTENTICACIÓN
-- ================================================================

SELECT
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
ORDER BY email;

-- Todos deben tener email_confirmed = true

-- ================================================================
-- CREDENCIALES PARA USAR EN LA APP
-- ================================================================

/*

🔐 CREDENCIALES DE ACCESO:

┌─────────────────┬────────────────────────────┬──────────────────┬──────────────┐
│ ROL             │ EMAIL                      │ PASSWORD         │ USO          │
├─────────────────┼────────────────────────────┼──────────────────┼──────────────┤
│ Super Admin     │ superadmin@ticketapp.com   │ SuperAdmin123!   │ Acceso total │
│ Admin           │ admin@ticketapp.com        │ Admin123!        │ Validar QR   │
│ Cliente         │ cliente@ticketapp.com      │ Cliente123!      │ Comprar      │
└─────────────────┴────────────────────────────┴──────────────────┴──────────────┘

PRÓXIMOS PASOS:

1. En la app, haz login con cualquiera de estos usuarios
2. Ve a "Perfil" y verifica que el badge muestre el rol correcto:
   - Super Admin: Badge morado "SUPER ADMIN"
   - Admin: Badge verde "ADMINISTRADOR"
   - Cliente: Badge azul "CLIENTE"
3. Prueba el flujo completo:
   - Cliente: Comprar ticket
   - Admin: Escanear QR y validar

*/

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
