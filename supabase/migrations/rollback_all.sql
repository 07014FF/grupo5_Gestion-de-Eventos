-- =====================================================
-- ROLLBACK: Deshacer todas las migraciones
-- =====================================================
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos
-- Solo usar en desarrollo o para resetear completamente
-- =====================================================

-- Confirmar antes de ejecutar
DO $$
BEGIN
  RAISE WARNING '⚠️  ADVERTENCIA: Estás a punto de eliminar TODOS los datos y estructuras';
  RAISE WARNING '⚠️  Esto incluye: tablas, políticas, funciones, triggers, índices y TODOS los datos';
  RAISE WARNING '⚠️  Para continuar, ejecuta este script completo';
  RAISE WARNING '⚠️  Para cancelar, cierra esta ventana AHORA';
END $$;

\echo ''
\echo '========================================='
\echo 'INICIANDO ROLLBACK COMPLETO'
\echo '========================================='
\echo ''

-- =====================================================
-- PASO 1: Eliminar políticas RLS
-- =====================================================
\echo 'Paso 1: Eliminando políticas RLS...'

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;

DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;
DROP POLICY IF EXISTS "Users can view own ticket validations" ON public.validations;

\echo '✓ Políticas RLS eliminadas'

-- =====================================================
-- PASO 2: Eliminar triggers
-- =====================================================
\echo 'Paso 2: Eliminando triggers...'

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;
DROP TRIGGER IF EXISTS trigger_increment_tickets ON public.tickets;
DROP TRIGGER IF EXISTS trigger_update_payment_completed_at ON public.purchases;

\echo '✓ Triggers eliminados'

-- =====================================================
-- PASO 3: Eliminar vistas
-- =====================================================
\echo 'Paso 3: Eliminando vistas...'

DROP VIEW IF EXISTS public.purchases_with_payment_info;

\echo '✓ Vistas eliminadas'

-- =====================================================
-- PASO 4: Eliminar tablas (en orden por dependencias)
-- =====================================================
\echo 'Paso 4: Eliminando tablas...'

DROP TABLE IF EXISTS public.validations CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

\echo '✓ Tablas eliminadas'

-- =====================================================
-- PASO 5: Eliminar funciones
-- =====================================================
\echo 'Paso 5: Eliminando funciones...'

DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.decrement_available_tickets();
DROP FUNCTION IF EXISTS public.increment_available_tickets();
DROP FUNCTION IF EXISTS public.update_payment_completed_at();
DROP FUNCTION IF EXISTS public.get_payment_stats(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.clear_seed_data();

\echo '✓ Funciones eliminadas'

-- =====================================================
-- PASO 6: Eliminar extensiones (opcional)
-- =====================================================
-- Comentado porque puede afectar otros proyectos
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
\echo ''
\echo 'Verificando que todo fue eliminado...'

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Contar tablas restantes
  SELECT COUNT(*)::INTEGER INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('users', 'events', 'purchases', 'tickets', 'validations');

  -- Contar políticas restantes
  SELECT COUNT(*)::INTEGER INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Contar funciones restantes
  SELECT COUNT(*)::INTEGER INTO function_count
  FROM pg_proc
  WHERE proname IN (
    'get_user_role',
    'update_updated_at_column',
    'decrement_available_tickets',
    'increment_available_tickets',
    'update_payment_completed_at',
    'get_payment_stats',
    'clear_seed_data'
  );

  -- Contar triggers restantes
  SELECT COUNT(DISTINCT trigger_name)::INTEGER INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%update%' OR trigger_name LIKE '%ticket%';

  \echo ''
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RESUMEN DE ROLLBACK';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tablas restantes: %', table_count;
  RAISE NOTICE 'Políticas restantes: %', policy_count;
  RAISE NOTICE 'Funciones restantes: %', function_count;
  RAISE NOTICE 'Triggers restantes: %', trigger_count;
  \echo ''

  IF table_count = 0 AND policy_count = 0 AND function_count = 0 THEN
    RAISE NOTICE '✓ ROLLBACK COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '✓ Todas las estructuras fueron eliminadas';
    \echo ''
    RAISE NOTICE 'Puedes ahora re-aplicar las migraciones desde cero';
  ELSE
    RAISE WARNING '⚠ Aún quedan algunos componentes. Revisa manualmente.';
  END IF;
END $$;

\echo ''
\echo '========================================='
\echo 'ROLLBACK FINALIZADO'
\echo '========================================='
\echo ''
\echo 'Para re-aplicar las migraciones, ejecuta en orden:'
\echo '1. 20250101000000_initial_schema.sql'
\echo '2. 20250101000001_rls_policies.sql'
\echo '3. 20250101000002_payment_gateway_fields.sql'
\echo '4. 20250101000003_seed_data.sql (opcional)'
\echo ''
