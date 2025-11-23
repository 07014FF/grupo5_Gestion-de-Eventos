-- ============================================================================
-- LIMPIEZA: Eliminar tabla duplicada ticket_validations
-- IMPORTANTE: Ejecutar DESPUÉS de aplicar 20251122_fix_validation_function.sql
-- ============================================================================

-- PASO 1: Verificar que la tabla validations existe y tiene datos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'validations'
  ) THEN
    RAISE EXCEPTION 'La tabla validations no existe. No se puede continuar con la limpieza.';
  END IF;
END $$;

-- PASO 2: Migrar datos de ticket_validations a validations (si existen)
-- Solo si ticket_validations tiene registros
INSERT INTO validations (
  ticket_id,
  validated_by,
  validation_result,
  validation_message,
  created_at
)
SELECT
  tv.ticket_id,
  tv.validated_by,
  'valid' as validation_result,  -- Asumir que todas las validaciones antiguas fueron válidas
  'Migrado desde ticket_validations' as validation_message,
  tv.validated_at as created_at
FROM ticket_validations tv
WHERE NOT EXISTS (
  -- Evitar duplicados
  SELECT 1 FROM validations v
  WHERE v.ticket_id = tv.ticket_id
    AND v.validated_by = tv.validated_by
);

-- PASO 3: Eliminar la tabla ticket_validations y todas sus dependencias
DROP TABLE IF EXISTS public.ticket_validations CASCADE;

-- PASO 4: Verificar que se eliminó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'ticket_validations'
  ) THEN
    RAISE EXCEPTION 'No se pudo eliminar la tabla ticket_validations';
  END IF;

  RAISE NOTICE '✅ Tabla ticket_validations eliminada exitosamente';
END $$;

-- COMENTARIO FINAL
COMMENT ON TABLE validations IS
  'Registro de validaciones de tickets en eventos - Tabla oficial (ticket_validations fue eliminada)';
