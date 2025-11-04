-- =====================================================
-- SCRIPT DE VERIFICACIÓN POST-MIGRACIÓN
-- Ejecuta este script después de aplicar todas las migraciones
-- para verificar que todo esté correcto
-- =====================================================

\echo ''
\echo '================================================'
\echo 'VERIFICACIÓN DE MIGRACIONES - SISTEMA DE TICKETS'
\echo '================================================'
\echo ''

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =====================================================
\echo '1. VERIFICANDO TABLAS...'
\echo ''

DO $$
DECLARE
  table_count INTEGER;
  missing_tables TEXT[];
  expected_tables TEXT[] := ARRAY['users', 'events', 'purchases', 'tickets', 'validations'];
  t TEXT;
BEGIN
  -- Contar tablas existentes
  SELECT COUNT(*)::INTEGER INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = ANY(expected_tables);

  -- Verificar tablas faltantes
  FOREACH t IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;

  -- Mostrar resultados
  RAISE NOTICE 'Tablas encontradas: % de %', table_count, array_length(expected_tables, 1);

  IF table_count = array_length(expected_tables, 1) THEN
    RAISE NOTICE '✓ Todas las tablas principales están creadas';
  ELSE
    RAISE WARNING '✗ Tablas faltantes: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- Mostrar todas las tablas
SELECT table_name,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''

-- =====================================================
-- 2. VERIFICAR ROW LEVEL SECURITY (RLS)
-- =====================================================
\echo '2. VERIFICANDO ROW LEVEL SECURITY (RLS)...'
\echo ''

DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;

  RAISE NOTICE 'Tablas con RLS habilitado: %', rls_count;

  IF rls_count >= 5 THEN
    RAISE NOTICE '✓ RLS está habilitado en todas las tablas principales';
  ELSE
    RAISE WARNING '✗ RLS no está habilitado en todas las tablas';
  END IF;
END $$;

-- Mostrar estado RLS por tabla
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================
\echo '3. VERIFICANDO POLÍTICAS RLS...'
\echo ''

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'Total de políticas RLS: %', policy_count;

  IF policy_count >= 20 THEN
    RAISE NOTICE '✓ Políticas RLS creadas correctamente';
  ELSE
    RAISE WARNING '✗ Menos políticas de las esperadas (esperadas: 20+)';
  END IF;
END $$;

-- Mostrar políticas por tabla
SELECT
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- 4. VERIFICAR FUNCIONES
-- =====================================================
\echo '4. VERIFICANDO FUNCIONES...'
\echo ''

DO $$
DECLARE
  func_count INTEGER;
  expected_funcs TEXT[] := ARRAY[
    'get_user_role',
    'update_updated_at_column',
    'decrement_available_tickets',
    'increment_available_tickets',
    'update_payment_completed_at',
    'get_payment_stats',
    'clear_seed_data'
  ];
  f TEXT;
  missing_funcs TEXT[];
BEGIN
  -- Verificar funciones faltantes
  FOREACH f IN ARRAY expected_funcs
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = f
    ) THEN
      missing_funcs := array_append(missing_funcs, f);
    END IF;
  END LOOP;

  SELECT COUNT(*)::INTEGER INTO func_count
  FROM pg_proc
  WHERE proname = ANY(expected_funcs);

  RAISE NOTICE 'Funciones encontradas: % de %', func_count, array_length(expected_funcs, 1);

  IF func_count = array_length(expected_funcs, 1) THEN
    RAISE NOTICE '✓ Todas las funciones están creadas';
  ELSE
    RAISE WARNING '✗ Funciones faltantes: %', array_to_string(missing_funcs, ', ');
  END IF;
END $$;

-- Mostrar funciones creadas
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc
WHERE proname IN (
  'get_user_role',
  'update_updated_at_column',
  'decrement_available_tickets',
  'increment_available_tickets',
  'update_payment_completed_at',
  'get_payment_stats',
  'clear_seed_data'
)
ORDER BY proname;

\echo ''

-- =====================================================
-- 5. VERIFICAR TRIGGERS
-- =====================================================
\echo '5. VERIFICANDO TRIGGERS...'
\echo ''

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT trigger_name)::INTEGER INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';

  RAISE NOTICE 'Total de triggers: %', trigger_count;

  IF trigger_count >= 6 THEN
    RAISE NOTICE '✓ Triggers creados correctamente';
  ELSE
    RAISE WARNING '✗ Menos triggers de los esperados (esperados: 6+)';
  END IF;
END $$;

-- Mostrar triggers
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event_type,
  action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =====================================================
\echo '6. VERIFICANDO ÍNDICES...'
\echo ''

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE 'Total de índices: %', index_count;

  IF index_count >= 20 THEN
    RAISE NOTICE '✓ Índices creados correctamente';
  ELSE
    RAISE WARNING '✗ Menos índices de los esperados (esperados: 20+)';
  END IF;
END $$;

-- Mostrar índices principales
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''

-- =====================================================
-- 7. VERIFICAR COLUMNAS DE PAGO
-- =====================================================
\echo '7. VERIFICANDO COLUMNAS DE PAGO (CULQI)...'
\echo ''

DO $$
DECLARE
  payment_columns TEXT[] := ARRAY[
    'payment_gateway',
    'payment_transaction_id',
    'payment_receipt_url',
    'payment_metadata',
    'payment_completed_at'
  ];
  col TEXT;
  missing_cols TEXT[];
BEGIN
  -- Verificar columnas faltantes
  FOREACH col IN ARRAY payment_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'purchases'
        AND column_name = col
    ) THEN
      missing_cols := array_append(missing_cols, col);
    END IF;
  END LOOP;

  IF array_length(missing_cols, 1) IS NULL THEN
    RAISE NOTICE '✓ Todas las columnas de pago están creadas';
  ELSE
    RAISE WARNING '✗ Columnas faltantes en purchases: %', array_to_string(missing_cols, ', ');
  END IF;
END $$;

-- Mostrar columnas de pago
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'purchases'
  AND column_name LIKE 'payment%'
ORDER BY ordinal_position;

\echo ''

-- =====================================================
-- 8. VERIFICAR VISTAS
-- =====================================================
\echo '8. VERIFICANDO VISTAS...'
\echo ''

DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public';

  RAISE NOTICE 'Vistas encontradas: %', view_count;

  IF view_count >= 1 THEN
    RAISE NOTICE '✓ Vistas creadas correctamente';
  ELSE
    RAISE WARNING '✗ No se encontraron vistas';
  END IF;
END $$;

-- Mostrar vistas
SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''

-- =====================================================
-- 9. VERIFICAR DATOS SEMILLA (OPCIONAL)
-- =====================================================
\echo '9. VERIFICANDO DATOS SEMILLA...'
\echo ''

DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO event_count
  FROM public.events;

  RAISE NOTICE 'Eventos en base de datos: %', event_count;

  IF event_count > 0 THEN
    RAISE NOTICE '✓ Hay eventos en la base de datos';
  ELSE
    RAISE NOTICE '⚠ No hay eventos. Ejecuta 20250101000003_seed_data.sql para agregar datos de prueba';
  END IF;
END $$;

-- Mostrar resumen de eventos
SELECT
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'active') as active_events,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_events,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_events,
  SUM(available_tickets) as total_tickets_available
FROM public.events;

\echo ''

-- =====================================================
-- 10. VERIFICAR PERMISOS
-- =====================================================
\echo '10. VERIFICANDO PERMISOS...'
\echo ''

DO $$
BEGIN
  -- Verificar permisos de la función get_user_role
  IF EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
      AND routine_name = 'get_user_role'
      AND grantee = 'authenticated'
  ) THEN
    RAISE NOTICE '✓ Permisos de get_user_role configurados correctamente';
  ELSE
    RAISE WARNING '✗ Falta permisos de ejecución en get_user_role';
  END IF;
END $$;

\echo ''

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
\echo '================================================'
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '================================================'

SELECT
  'Tablas' as componente,
  COUNT(*) as cantidad,
  'users, events, purchases, tickets, validations' as detalles
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'events', 'purchases', 'tickets', 'validations')

UNION ALL

SELECT
  'Políticas RLS' as componente,
  COUNT(*) as cantidad,
  'Control de acceso por usuario y rol' as detalles
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Triggers' as componente,
  COUNT(DISTINCT trigger_name) as cantidad,
  'updated_at, tickets disponibles, payment completed' as detalles
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
  'Índices' as componente,
  COUNT(*) as cantidad,
  'Optimización de consultas' as detalles
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT
  'Funciones' as componente,
  COUNT(*) as cantidad,
  'Helper functions, stats, utils' as detalles
FROM pg_proc
WHERE proname IN (
  'get_user_role',
  'update_updated_at_column',
  'decrement_available_tickets',
  'increment_available_tickets',
  'update_payment_completed_at',
  'get_payment_stats',
  'clear_seed_data'
)

UNION ALL

SELECT
  'Eventos' as componente,
  COUNT(*) as cantidad,
  'Datos de prueba/producción' as detalles
FROM public.events;

\echo ''
\echo '================================================'
\echo 'VERIFICACIÓN COMPLETADA'
\echo '================================================'
\echo ''
\echo 'Si todos los checks muestran ✓, las migraciones se aplicaron correctamente.'
\echo 'Si hay advertencias (✗ o ⚠), revisa los detalles arriba.'
\echo ''
