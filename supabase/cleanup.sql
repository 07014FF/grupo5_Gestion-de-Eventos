-- =====================================================
-- SCRIPT DE LIMPIEZA
-- Ejecuta esto ANTES de schema.sql si ya ejecutaste el schema
-- =====================================================

-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_increment_tickets ON public.tickets;
DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Eliminar funciones
DROP FUNCTION IF EXISTS increment_available_tickets();
DROP FUNCTION IF EXISTS decrement_available_tickets();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar políticas (RLS)
DROP POLICY IF EXISTS "Users can view own ticket validations" ON public.validations;
DROP POLICY IF EXISTS "Admins can view all validations" ON public.validations;
DROP POLICY IF EXISTS "Admins can insert validations" ON public.validations;

DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Eliminar tablas (en orden correcto por dependencias)
DROP TABLE IF EXISTS public.validations CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Ahora ejecuta schema.sql' as mensaje;
