-- Fix activity_log entity_id to accept non-UUID values
-- Payment IDs and other entities may not be UUIDs

ALTER TABLE public.activity_log
ALTER COLUMN entity_id TYPE VARCHAR(255) USING entity_id::VARCHAR;

-- Update comment
COMMENT ON COLUMN public.activity_log.entity_id IS 'ID de la entidad afectada (puede ser UUID, string, etc.)';
