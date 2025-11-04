-- =====================================================
-- SCRIPT DE DIAGNÓSTICO
-- Ejecuta esto en Supabase SQL Editor para diagnosticar problemas
-- =====================================================

\echo ''
\echo '========================================'
\echo 'DIAGNÓSTICO DE BASE DE DATOS'
\echo '========================================'
\echo ''

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =====================================================
\echo '1. Verificando tablas...'
\echo ''

SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''

-- =====================================================
-- 2. VERIFICAR EVENTOS
-- =====================================================
\echo '2. Verificando eventos...'
\echo ''

SELECT COUNT(*) as total_eventos FROM public.events;

SELECT
  status,
  COUNT(*) as cantidad
FROM public.events
GROUP BY status;

-- Mostrar primeros 3 eventos
SELECT
  id,
  title,
  date,
  status,
  available_tickets
FROM public.events
ORDER BY date
LIMIT 3;

\echo ''

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================
\echo '3. Verificando políticas RLS...'
\echo ''

SELECT
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- 4. VERIFICAR FUNCIÓN get_user_role
-- =====================================================
\echo '4. Verificando función get_user_role...'
\echo ''

SELECT
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'get_user_role';

\echo ''

-- =====================================================
-- 5. VERIFICAR USUARIOS
-- =====================================================
\echo '5. Verificando usuarios...'
\echo ''

SELECT COUNT(*) as total_usuarios FROM public.users;

SELECT
  role,
  COUNT(*) as cantidad
FROM public.users
GROUP BY role;

\echo ''

-- =====================================================
-- 6. ACCESO ANÓNIMO A EVENTOS (IMPORTANTE)
-- =====================================================
\echo '6. Verificando acceso anónimo a eventos...'
\echo ''

-- Esta query simula el acceso como usuario anónimo
SELECT
  id,
  title,
  date,
  price,
  status
FROM public.events
WHERE status = 'active'
ORDER BY date
LIMIT 5;

\echo ''

-- =====================================================
-- RESUMEN
-- =====================================================
\echo '========================================'
\echo 'RESUMEN'
\echo '========================================'

DO $$
DECLARE
  event_count INTEGER;
  active_event_count INTEGER;
  user_count INTEGER;
  policy_count INTEGER;
  has_get_user_role BOOLEAN;
BEGIN
  SELECT COUNT(*)::INTEGER INTO event_count FROM public.events;
  SELECT COUNT(*)::INTEGER INTO active_event_count FROM public.events WHERE status = 'active';
  SELECT COUNT(*)::INTEGER INTO user_count FROM public.users;
  SELECT COUNT(*)::INTEGER INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') INTO has_get_user_role;

  RAISE NOTICE '';
  RAISE NOTICE 'Total de eventos: %', event_count;
  RAISE NOTICE 'Eventos activos: %', active_event_count;
  RAISE NOTICE 'Total de usuarios: %', user_count;
  RAISE NOTICE 'Políticas RLS: %', policy_count;
  RAISE NOTICE 'Función get_user_role: %', CASE WHEN has_get_user_role THEN 'SÍ' ELSE 'NO' END;
  RAISE NOTICE '';

  -- Diagnóstico
  IF event_count = 0 THEN
    RAISE WARNING '⚠️  NO HAY EVENTOS - Ejecuta: supabase/migrations/20250101000003_seed_data.sql';
  END IF;

  IF active_event_count = 0 THEN
    RAISE WARNING '⚠️  NO HAY EVENTOS ACTIVOS - Los eventos deben tener status = "active"';
  END IF;

  IF NOT has_get_user_role THEN
    RAISE WARNING '⚠️  FALTA get_user_role() - Ejecuta: supabase/migrations/20250101000001_rls_policies.sql';
  END IF;

  IF policy_count < 15 THEN
    RAISE WARNING '⚠️  POCAS POLÍTICAS RLS (esperadas: 19+) - Ejecuta: supabase/migrations/20250101000001_rls_policies.sql';
  END IF;

  IF event_count > 0 AND active_event_count > 0 AND has_get_user_role AND policy_count >= 15 THEN
    RAISE NOTICE '✅ TODO PARECE ESTAR BIEN';
    RAISE NOTICE '';
    RAISE NOTICE 'Si la app aún no funciona, verifica:';
    RAISE NOTICE '1. Las variables de entorno en .env';
    RAISE NOTICE '2. Que Expo esté ejecutándose sin errores';
    RAISE NOTICE '3. Los logs de la app en la consola';
  END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'FIN DEL DIAGNÓSTICO'
\echo '========================================'\echo ''
