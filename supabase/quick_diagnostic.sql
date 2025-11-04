-- =====================================================
-- DIAGNÓSTICO RÁPIDO - COPIA Y PEGA EN SUPABASE SQL EDITOR
-- =====================================================

-- 1. Verificar tablas existentes
SELECT 'TABLAS EXISTENTES:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar cantidad de eventos
SELECT 'EVENTOS:' as info;
SELECT COUNT(*) as total_eventos FROM public.events;
SELECT status, COUNT(*) as cantidad FROM public.events GROUP BY status;

-- 3. Verificar función get_user_role
SELECT 'FUNCIÓN get_user_role:' as info;
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') as existe;

-- 4. Verificar políticas RLS
SELECT 'POLÍTICAS RLS:' as info;
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Verificar si RLS está habilitado
SELECT 'RLS HABILITADO:' as info;
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. IMPORTANTE: Verificar acceso anónimo a eventos
SELECT 'EVENTOS VISIBLES PARA USUARIOS ANÓNIMOS:' as info;
SET ROLE anon;
SELECT id, title, date, status FROM public.events WHERE status = 'active' LIMIT 3;
RESET ROLE;
