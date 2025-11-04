-- =====================================================
-- MIGRATION: Add Analytics Functions
-- Sistema de Tickets para Eventos
-- Fecha: 2025-10-30
-- =====================================================

-- Function to get sales by category
CREATE OR REPLACE FUNCTION get_sales_by_category()
RETURNS TABLE(category TEXT, total_sales NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.category,
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
$$ LANGUAGE plpgsql;

-- Function to get new users over time (last 30 days)
CREATE OR REPLACE FUNCTION get_new_users_over_time()
RETURNS TABLE(date TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
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
$$ LANGUAGE plpgsql;

-- Function to get ticket validation status
CREATE OR REPLACE FUNCTION get_ticket_validation_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.status,
    COUNT(t.id) as count
  FROM
    tickets t
  GROUP BY
    t.status;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
