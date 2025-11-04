-- =====================================================
-- MIGRATION: Add QR Validator Role and Policies
-- Sistema de Tickets para Eventos
-- Fecha: 2025-10-30
-- =====================================================

-- No se necesita crear el tipo de rol '''qr_validator''' porque el campo '''role''' en la tabla '''users''' es de tipo TEXT.
-- Simplemente asignaremos este string a los usuarios que cumplan esta función.

-- =====================================================
-- POLICIES: events
-- =====================================================

-- Policy: QR Validators can view all events
CREATE POLICY "QR Validators can view all events"
  ON public.events FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  );

-- =====================================================
-- POLICIES: tickets
-- =====================================================

-- Policy: QR Validators can view all tickets
CREATE POLICY "QR Validators can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  );

-- Policy: QR Validators can update tickets (to mark as redeemed)
CREATE POLICY "QR Validators can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  ) WITH CHECK (
    -- Opcional: se podría restringir qué campos pueden actualizar.
    -- Por ahora, se permite la actualización completa del registro.
    true
  );

-- =====================================================
-- POLICIES: users
-- =====================================================

-- Policy: QR Validators can view user profiles (to show ticket holder info)
CREATE POLICY "QR Validators can view user profiles"
  ON public.users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  );

-- =====================================================
-- POLICIES: validations
-- =====================================================

-- Policy: QR Validators can insert validations
CREATE POLICY "QR Validators can insert validations"
  ON public.validations FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  );

-- Policy: QR Validators can view all validations
CREATE POLICY "QR Validators can view all validations"
  ON public.validations FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = '''qr_validator'''
  );

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
