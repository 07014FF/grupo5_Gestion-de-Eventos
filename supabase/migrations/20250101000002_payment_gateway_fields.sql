-- =====================================================
-- MIGRACION: Campos de Pasarela de Pago
-- Agrega campos para integración con Culqi (Perú)
-- Fecha: 2025-01-01
-- =====================================================

-- =====================================================
-- ACTUALIZAR TABLA: purchases
-- Agregar campos para tracking de pagos con Culqi
-- =====================================================

-- Agregar columnas de seguimiento de pago
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'culqi',
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_purchases_payment_gateway
ON public.purchases(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_purchases_payment_transaction_id
ON public.purchases(payment_transaction_id)
WHERE payment_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_payment_completed_at
ON public.purchases(payment_completed_at DESC)
WHERE payment_completed_at IS NOT NULL;

-- =====================================================
-- COMENTARIOS DESCRIPTIVOS
-- =====================================================

COMMENT ON COLUMN public.purchases.payment_gateway IS
  'Pasarela de pago utilizada: culqi (Perú), mock (desarrollo), stripe, mercadopago';

COMMENT ON COLUMN public.purchases.payment_transaction_id IS
  'ID de transacción de la pasarela de pago (charge_id en Culqi)';

COMMENT ON COLUMN public.purchases.payment_receipt_url IS
  'URL al recibo o comprobante de pago generado';

COMMENT ON COLUMN public.purchases.payment_metadata IS
  'Datos adicionales de la pasarela: info de tarjeta, banco, referencia, etc.';

COMMENT ON COLUMN public.purchases.payment_completed_at IS
  'Timestamp cuando el pago fue confirmado exitosamente';

-- =====================================================
-- ACTUALIZAR REGISTROS EXISTENTES
-- =====================================================

-- Actualizar registros existentes con valores por defecto
UPDATE public.purchases
SET payment_gateway = 'mock'
WHERE payment_gateway IS NULL;

-- Si hay compras completadas sin fecha de completado, establecerla
UPDATE public.purchases
SET payment_completed_at = created_at
WHERE payment_status = 'completed' AND payment_completed_at IS NULL;

-- =====================================================
-- TRIGGER: Auto-actualizar payment_completed_at
-- =====================================================

-- Función para actualizar automáticamente payment_completed_at
CREATE OR REPLACE FUNCTION update_payment_completed_at()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_payment_completed_at ON public.purchases;
CREATE TRIGGER trigger_update_payment_completed_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION update_payment_completed_at();

-- =====================================================
-- FUNCIÓN: Obtener estadísticas de pagos
-- =====================================================

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
) AS $$
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
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_payment_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION public.get_payment_stats IS
  'Obtiene estadísticas de pagos por pasarela en un rango de fechas';

-- =====================================================
-- VISTA: Compras con información de pago
-- =====================================================

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
  p.transaction_id, -- Campo legacy
  p.payment_completed_at,
  p.created_at,
  u.name as user_name,
  u.email as user_email,
  e.title as event_title,
  e.date as event_date,
  -- Extraer información útil del metadata
  p.payment_metadata->>'brand' as card_brand,
  p.payment_metadata->>'last_four' as card_last_four,
  p.payment_metadata->>'bank' as bank_name
FROM public.purchases p
LEFT JOIN public.users u ON p.user_id = u.id
LEFT JOIN public.events e ON p.event_id = e.id;

COMMENT ON VIEW public.purchases_with_payment_info IS
  'Vista consolidada de compras con información de pago y referencias';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas fueron agregadas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'purchases'
  AND column_name LIKE 'payment_%'
ORDER BY ordinal_position;

-- =====================================================
-- FIN DE MIGRACIÓN PAYMENT GATEWAY
-- =====================================================
