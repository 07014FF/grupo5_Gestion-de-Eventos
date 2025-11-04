-- =====================================================
-- ACTUALIZACIÓN: Métodos de Pago para Perú
-- Fecha: 2025-10-25
-- =====================================================

-- Verificar métodos de pago actuales
SELECT 'Métodos de pago actuales en la base de datos:' as info;
SELECT DISTINCT payment_method FROM public.purchases;

-- Si ya tienes la tabla creada, esta migración actualizará el constraint
-- para incluir yape y plin como métodos de pago válidos

-- Paso 1: Eliminar el constraint anterior
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'purchases_payment_method_check'
  ) THEN
    ALTER TABLE public.purchases DROP CONSTRAINT purchases_payment_method_check;
    RAISE NOTICE 'Constraint anterior eliminado';
  END IF;
END $$;

-- Paso 2: Agregar el nuevo constraint con yape y plin
ALTER TABLE public.purchases
ADD CONSTRAINT purchases_payment_method_check
CHECK (payment_method IN ('card', 'yape', 'plin', 'pse', 'nequi', 'daviplata', 'cash', 'bank_transfer'));

-- Paso 3: Actualizar el comentario de la columna
COMMENT ON COLUMN public.purchases.payment_method IS
  'Método de pago: card (tarjeta), yape (Perú), plin (Perú), pse/nequi/daviplata (Colombia - legacy), cash, bank_transfer';

-- Paso 4: Verificación
SELECT 'Verificación de constraint actualizado:' as info;
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'purchases_payment_method_check';

RAISE NOTICE '';
RAISE NOTICE '✅ Métodos de pago actualizados exitosamente';
RAISE NOTICE '   Métodos disponibles:';
RAISE NOTICE '   - card: Tarjeta de Crédito/Débito';
RAISE NOTICE '   - yape: Yape (Perú)';
RAISE NOTICE '   - plin: Plin (Perú)';
RAISE NOTICE '';

-- =====================================================
-- FIN DE ACTUALIZACIÓN
-- =====================================================
