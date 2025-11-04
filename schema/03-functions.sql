-- ========================================
-- FUNCIONES PERSONALIZADAS
-- ========================================
-- Este archivo contiene todas las funciones del sistema

-- ========================================
-- FUNCIÓN: update_updated_at_column
-- Descripción: Actualiza automáticamente el campo updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function para actualizar automáticamente el campo updated_at';

-- ========================================
-- FUNCIÓN: get_user_role
-- Descripción: Obtiene el rol de un usuario por su ID
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'client');
END;
$$;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Obtiene el rol de un usuario, retorna "client" por defecto';

-- ========================================
-- FUNCIÓN: decrement_available_tickets
-- Descripción: Decrementa los tickets disponibles cuando se crea un ticket
-- ========================================
CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id AND available_tickets > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.decrement_available_tickets() IS 'Decrementa tickets disponibles al crear un ticket';

-- ========================================
-- FUNCIÓN: increment_available_tickets
-- Descripción: Incrementa los tickets disponibles cuando se cancela un ticket
-- ========================================
CREATE OR REPLACE FUNCTION public.increment_available_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.events
    SET available_tickets = available_tickets + 1
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.increment_available_tickets() IS 'Incrementa tickets disponibles al cancelar un ticket';

-- ========================================
-- FUNCIÓN: update_payment_completed_at
-- Descripción: Actualiza el timestamp cuando un pago se completa
-- ========================================
CREATE OR REPLACE FUNCTION public.update_payment_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el estado cambia a 'completed', establecer timestamp
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    NEW.payment_completed_at = NOW();
  END IF;

  -- Si el estado cambia de 'completed' a otro, limpiar timestamp
  IF NEW.payment_status != 'completed' AND OLD.payment_status = 'completed' THEN
    NEW.payment_completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_payment_completed_at() IS 'Actualiza payment_completed_at cuando el estado del pago cambia a completed';

-- ========================================
-- FUNCIÓN: promote_to_qr_validator
-- Descripción: Promueve un usuario al rol de validador QR
-- ========================================
CREATE OR REPLACE FUNCTION public.promote_to_qr_validator(user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Actualizar el rol a qr_validator
  UPDATE public.users
  SET role = 'qr_validator'
  WHERE email = user_email
  RETURNING id INTO affected_user_id;

  -- Verificar si se actualizó
  IF affected_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Usuario no encontrado con ese email', NULL::UUID;
  ELSE
    RETURN QUERY SELECT TRUE, format('Usuario %s promovido a QR Validator exitosamente', user_email), affected_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.promote_to_qr_validator(TEXT) IS 'Promueve un usuario al rol de validador QR por email';

-- ========================================
-- FUNCIÓN: clear_seed_data
-- Descripción: Limpia todos los datos de prueba
-- ========================================
CREATE OR REPLACE FUNCTION public.clear_seed_data()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Eliminar validaciones
  DELETE FROM public.validations;

  -- Eliminar tickets
  DELETE FROM public.tickets;

  -- Eliminar compras
  DELETE FROM public.purchases;

  -- Eliminar eventos
  DELETE FROM public.events;

  RAISE NOTICE 'Datos semilla eliminados exitosamente';
END;
$$;

COMMENT ON FUNCTION public.clear_seed_data() IS 'Elimina todos los datos de prueba del sistema';

-- ========================================
-- FUNCIONES DE REPORTES Y ANALYTICS
-- ========================================

-- Función: get_new_users_over_time
CREATE OR REPLACE FUNCTION public.get_new_users_over_time()
RETURNS TABLE(date VARCHAR, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD')::VARCHAR as date,
    COUNT(id) as count
  FROM
    users
  WHERE
    created_at >= NOW() - INTERVAL '30 days'
  GROUP BY
    date_trunc('day', created_at)
  ORDER BY
    date_trunc('day', created_at);
END;
$$;

COMMENT ON FUNCTION public.get_new_users_over_time() IS 'Retorna nuevos usuarios registrados en los últimos 30 días agrupados por día';

-- Función: get_sales_by_category
CREATE OR REPLACE FUNCTION public.get_sales_by_category()
RETURNS TABLE(category VARCHAR, total_sales NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.category::VARCHAR,
    SUM(p.total_amount) as total_sales
  FROM
    purchases p
  JOIN
    events e ON p.event_id = e.id
  WHERE
    p.payment_status = 'completed'
  GROUP BY
    e.category;
END;
$$;

COMMENT ON FUNCTION public.get_sales_by_category() IS 'Retorna ventas totales agrupadas por categoría de evento';

-- Función: get_ticket_validation_status
CREATE OR REPLACE FUNCTION public.get_ticket_validation_status()
RETURNS TABLE(status VARCHAR, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.status::VARCHAR,
    COUNT(t.id) as count
  FROM
    tickets t
  GROUP BY
    t.status;
END;
$$;

COMMENT ON FUNCTION public.get_ticket_validation_status() IS 'Retorna conteo de tickets agrupados por estado';

-- Función: get_payment_stats
CREATE OR REPLACE FUNCTION public.get_payment_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  gateway TEXT,
  total_transactions BIGINT,
  successful_transactions BIGINT,
  failed_transactions BIGINT,
  total_amount NUMERIC,
  avg_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.payment_gateway,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'completed') as successful_transactions,
    COUNT(*) FILTER (WHERE p.payment_status = 'failed') as failed_transactions,
    SUM(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as total_amount,
    AVG(p.total_amount) FILTER (WHERE p.payment_status = 'completed') as avg_amount
  FROM public.purchases p
  WHERE p.created_at BETWEEN start_date AND end_date
  GROUP BY p.payment_gateway;
END;
$$;

COMMENT ON FUNCTION public.get_payment_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna estadísticas de pagos por pasarela en un rango de fechas';
