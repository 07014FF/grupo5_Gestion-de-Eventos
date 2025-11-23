-- ========================================================================
-- FIX: Recursión Infinita en Políticas RLS
-- Solución: Políticas simples sin consultar la tabla users desde users
-- ========================================================================

-- 1. Eliminar TODAS las políticas problemáticas
DROP POLICY IF EXISTS "superadmin_full_access_users" ON users;
DROP POLICY IF EXISTS "admin_view_users" ON users;
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;
DROP POLICY IF EXISTS "super_admin_full_access_events" ON events;
DROP POLICY IF EXISTS "admin_view_all_events" ON events;
DROP POLICY IF EXISTS "admin_create_events" ON events;
DROP POLICY IF EXISTS "admin_update_own_events" ON events;
DROP POLICY IF EXISTS "only_superadmin_delete_events" ON events;
DROP POLICY IF EXISTS "users_view_active_events" ON events;
DROP POLICY IF EXISTS "superadmin_view_all_purchases" ON purchases;
DROP POLICY IF EXISTS "admin_view_own_event_purchases" ON purchases;
DROP POLICY IF EXISTS "users_view_own_purchases" ON purchases;

-- 2. Crear políticas SIMPLES para USERS (sin recursión)
-- Importante: NO consultar la tabla users dentro de las políticas de users

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Políticas para EVENTS (ahora sin consultar users)
-- Usaremos una estrategia más permisiva temporalmente

CREATE POLICY "events_select_all_authenticated"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "events_update_own"
  ON events FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "events_delete_own"
  ON events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Usuarios no autenticados pueden ver eventos activos
CREATE POLICY "events_select_active_public"
  ON events FOR SELECT
  TO anon
  USING (status = 'active');

-- 4. Políticas para PURCHASES

CREATE POLICY "purchases_select_own"
  ON purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "purchases_insert_own"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Permitir ver purchases de eventos que el usuario creó
CREATE POLICY "purchases_select_for_event_owners"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- ========================================================================
-- NOTA IMPORTANTE
-- ========================================================================
-- Las políticas de rol específico (admin vs super_admin) deben manejarse
-- a nivel de aplicación por ahora, ya que usar funciones SECURITY DEFINER
-- que consultan la tabla users puede causar problemas de rendimiento.
--
-- La diferenciación se hará en el código TypeScript/React Native.
-- ========================================================================
