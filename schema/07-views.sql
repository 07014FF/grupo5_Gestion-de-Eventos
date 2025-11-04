-- ========================================
-- VISTAS DEL SISTEMA
-- ========================================
-- Este archivo contiene todas las vistas del sistema

-- ========================================
-- VISTA: purchases_with_payment_info
-- Descripción: Vista que combina información de compras con detalles de pago
-- ========================================
CREATE OR REPLACE VIEW public.purchases_with_payment_info AS
SELECT
  p.id,
  p.user_id,
  p.event_id,
  p.total_amount,
  p.payment_method,
  p.payment_status,
  p.payment_gateway,
  p.payment_transaction_id,
  p.transaction_id,
  p.payment_completed_at,
  p.created_at,
  p.user_name,
  p.user_email,
  e.title as event_title,
  e.date as event_date,
  -- Extraer información de la tarjeta del metadata JSON
  p.payment_metadata->>'card_brand' as card_brand,
  p.payment_metadata->>'last_four' as card_last_four,
  p.payment_metadata->>'bank' as bank_name
FROM public.purchases p
INNER JOIN public.events e ON p.event_id = e.id;

COMMENT ON VIEW public.purchases_with_payment_info IS 'Vista que combina compras con información detallada de pagos y eventos';
