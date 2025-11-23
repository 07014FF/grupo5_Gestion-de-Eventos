-- Script para arreglar available_tickets en todos los eventos
-- Ejecuta esto manualmente en tu dashboard de Supabase

-- Ver el estado actual de los eventos
SELECT id, title, available_tickets, total_tickets
FROM public.events
ORDER BY created_at DESC
LIMIT 10;

-- Actualizar eventos que tienen available_tickets en 0 o NULL
UPDATE public.events
SET available_tickets = COALESCE(total_tickets, 100)
WHERE available_tickets IS NULL OR available_tickets <= 0;

-- Verificar los cambios
SELECT id, title, available_tickets, total_tickets
FROM public.events
ORDER BY created_at DESC
LIMIT 10;
