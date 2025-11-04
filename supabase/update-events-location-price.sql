-- =====================================================
-- ACTUALIZAR UBICACIÓN Y PRECIO DE TODOS LOS EVENTOS
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- Actualizar todos los eventos existentes
UPDATE public.events
SET
  location = 'Iquitos, Perú',
  venue = 'Calle Pevas cuadra 5',
  price = 5
WHERE status = 'active';

-- Verificar los cambios
SELECT id, title, location, venue, price, category
FROM public.events
ORDER BY date ASC;
