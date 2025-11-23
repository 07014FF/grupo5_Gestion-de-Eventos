-- ========================================================================
-- RBAC: Role-Based Access Control para Admin vs Super Admin
-- Admin = Organizador (crea eventos, no puede eliminar)
-- Super Admin = Dueño (control total)
-- ========================================================================

-- ========================================================================
-- 1. POLÍTICAS PARA EVENTOS
-- ========================================================================

-- Eliminar políticas existentes de eventos si existen
DROP POLICY IF EXISTS "Super admins can do everything on events" ON events;
DROP POLICY IF EXISTS "Admins can manage their events" ON events;
DROP POLICY IF EXISTS "Admins can create events" ON events;
DROP POLICY IF EXISTS "Admins can update their events" ON events;
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Everyone can view active events" ON events;

-- SUPER ADMIN: Control total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "super_admin_full_access_events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ADMIN (Organizador): Puede ver todos, crear, y editar solo los suyos
-- SELECT: Ver todos los eventos
CREATE POLICY "admin_view_all_events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- INSERT: Crear eventos (se asigna como created_by)
CREATE POLICY "admin_create_events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: Solo puede editar sus propios eventos (NO puede eliminar)
CREATE POLICY "admin_update_own_events"
  ON events FOR UPDATE
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- DELETE: SOLO super_admin puede eliminar eventos
CREATE POLICY "only_superadmin_delete_events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- USUARIOS NORMALES: Solo ver eventos activos
CREATE POLICY "users_view_active_events"
  ON events FOR SELECT
  USING (
    status = 'active'
    AND (
      role IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
      )
    )
  );

-- ========================================================================
-- 2. POLÍTICAS PARA USUARIOS (Solo Super Admin)
-- ========================================================================

DROP POLICY IF EXISTS "Super admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- SUPER ADMIN: Gestión completa de usuarios
CREATE POLICY "superadmin_full_access_users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ADMIN: Solo puede ver usuarios (para asignar validadores)
CREATE POLICY "admin_view_users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- USUARIOS: Ver y editar solo su propio perfil
CREATE POLICY "users_own_profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = auth.uid()) -- No puede cambiar su propio rol
  );

-- ========================================================================
-- 3. POLÍTICAS PARA PURCHASES (Ventas)
-- ========================================================================

DROP POLICY IF EXISTS "Super admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view purchases of their events" ON purchases;

-- SUPER ADMIN: Ver todas las ventas
CREATE POLICY "superadmin_view_all_purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ADMIN: Solo ver ventas de SUS eventos
CREATE POLICY "admin_view_own_event_purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    AND event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

-- USUARIOS: Ver sus propias compras
CREATE POLICY "users_view_own_purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

-- ========================================================================
-- 4. TABLA DE ASIGNACIÓN DE VALIDADORES A EVENTOS
-- ========================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS validator_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, validator_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validator_assignments_event ON validator_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_validator_assignments_validator ON validator_assignments(validator_id);

-- Políticas
DROP POLICY IF EXISTS "Admins can assign validators to their events" ON validator_assignments;
DROP POLICY IF EXISTS "Validators can view their assignments" ON validator_assignments;

-- Solo admins y super_admins pueden asignar validadores
CREATE POLICY "admins_assign_validators"
  ON validator_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
    AND (
      -- Super admin puede asignar a cualquier evento
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'super_admin'
      )
      OR
      -- Admin solo a sus eventos
      event_id IN (
        SELECT id FROM events WHERE created_by = auth.uid()
      )
    )
  );

-- Ver asignaciones
CREATE POLICY "view_validator_assignments"
  ON validator_assignments FOR SELECT
  USING (
    -- Validadores ven sus propias asignaciones
    validator_id = auth.uid()
    OR
    -- Admins ven asignaciones de sus eventos
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
      )
      AND (
        event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
        OR
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      )
    )
  );

-- ========================================================================
-- 5. FUNCIONES AUXILIARES
-- ========================================================================

-- Función para verificar si usuario es super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario es admin o superior
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si usuario es dueño del evento
CREATE OR REPLACE FUNCTION is_event_owner(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
    AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- PERMISOS
-- ========================================================================

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_event_owner(UUID) TO authenticated;

GRANT ALL ON validator_assignments TO authenticated;

-- ========================================================================
-- COMENTARIOS
-- ========================================================================

COMMENT ON POLICY "super_admin_full_access_events" ON events IS
  'Super Admin tiene control total: crear, editar, eliminar cualquier evento';

COMMENT ON POLICY "admin_update_own_events" ON events IS
  'Admin (Organizador) solo puede editar sus propios eventos, NO eliminar';

COMMENT ON POLICY "only_superadmin_delete_events" ON events IS
  'Solo Super Admin puede eliminar eventos físicamente';

COMMENT ON TABLE validator_assignments IS
  'Tabla para asignar validadores a eventos específicos';
