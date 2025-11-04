-- =====================================================
-- FIX RÁPIDO: PANTALLA AZUL
-- Ejecuta este script completo en Supabase SQL Editor
-- =====================================================

-- PASO 1: Verificar estado actual
DO $$
DECLARE
  table_count INTEGER;
  event_count INTEGER;
  active_event_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Contar tablas
  SELECT COUNT(*)::INTEGER INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('users', 'events', 'purchases', 'tickets', 'validations');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO INICIAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tablas encontradas: %/5', table_count;

  IF table_count < 5 THEN
    RAISE NOTICE '⚠️  FALTAN TABLAS - Debes ejecutar las migraciones manualmente';
    RAISE NOTICE 'Ver: SOLUCIONAR_PANTALLA_AZUL.md - PASO 2';
    RETURN;
  END IF;

  -- Contar eventos
  SELECT COUNT(*)::INTEGER INTO event_count FROM public.events;
  SELECT COUNT(*)::INTEGER INTO active_event_count FROM public.events WHERE status = 'active';
  SELECT COUNT(*)::INTEGER INTO policy_count FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE 'Total eventos: %', event_count;
  RAISE NOTICE 'Eventos activos: %', active_event_count;
  RAISE NOTICE 'Políticas RLS: %', policy_count;
  RAISE NOTICE '';

  IF active_event_count = 0 THEN
    RAISE NOTICE '🔧 SOLUCIÓN: Necesitas insertar eventos...';
  END IF;

  IF policy_count < 15 THEN
    RAISE NOTICE '🔧 SOLUCIÓN: Necesitas crear políticas RLS...';
  END IF;
END $$;

-- =====================================================
-- PASO 2: ARREGLAR POLÍTICAS DE ACCESO ANÓNIMO
-- Esta es la causa #1 de pantalla azul
-- =====================================================

-- Eliminar política vieja si existe
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

-- Crear política correcta para acceso anónimo
CREATE POLICY "Anyone can view active events"
  ON public.events FOR SELECT
  USING (status IN ('active', 'completed'));

-- CRUCIAL: Dar permisos explícitos
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events TO authenticated;

-- =====================================================
-- PASO 3: INSERTAR EVENTOS SI NO EXISTEN
-- =====================================================

DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO event_count FROM public.events;

  IF event_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📝 Insertando eventos de prueba...';

    -- Evento 1
    INSERT INTO public.events (
      title, subtitle, description, image_url, date, time,
      location, venue, price, available_tickets, total_tickets,
      category, rating, status
    ) VALUES (
      'Festival de Jazz Lima 2025',
      'Gran Festival Internacional de Jazz',
      'El festival de jazz más importante del Perú trae a los mejores artistas internacionales.',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      CURRENT_DATE + INTERVAL '30 days',
      '20:00:00',
      'Lima, Perú',
      'Parque de la Exposición',
      89.90,
      200,
      200,
      'Música',
      4.8,
      'active'
    );

    -- Evento 2
    INSERT INTO public.events (
      title, subtitle, description, image_url, date, time,
      location, venue, price, available_tickets, total_tickets,
      category, rating, status
    ) VALUES (
      'Rock en el Estadio',
      'Festival de Rock Nacional e Internacional',
      'Las mejores bandas de rock del Perú y Latinoamérica se reúnen en un solo escenario.',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      CURRENT_DATE + INTERVAL '45 days',
      '19:30:00',
      'Lima, Perú',
      'Estadio Nacional',
      120.00,
      500,
      500,
      'Música',
      4.6,
      'active'
    );

    -- Evento 3
    INSERT INTO public.events (
      title, subtitle, description, image_url, date, time,
      location, venue, price, available_tickets, total_tickets,
      category, rating, status
    ) VALUES (
      'Stand Up: Risas sin Control',
      'Los mejores comediantes del país',
      'Una noche de risas garantizadas con los comediantes más destacados del Perú.',
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      CURRENT_DATE + INTERVAL '10 days',
      '20:30:00',
      'Lima, Perú',
      'Teatro La Plaza',
      55.00,
      120,
      120,
      'Comedia',
      4.5,
      'active'
    );

    RAISE NOTICE '✅ Se insertaron 3 eventos de prueba';
  ELSE
    RAISE NOTICE '✅ Ya existen % eventos', event_count;
  END IF;
END $$;

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================

-- Test de acceso anónimo (CRÍTICO)
DO $$
DECLARE
  anon_event_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';

  -- Simular acceso anónimo
  SET ROLE anon;
  SELECT COUNT(*)::INTEGER INTO anon_event_count FROM public.events WHERE status = 'active';
  RESET ROLE;

  RAISE NOTICE 'Eventos visibles para usuarios anónimos: %', anon_event_count;

  IF anon_event_count > 0 THEN
    RAISE NOTICE '✅ ¡ÉXITO! Los usuarios anónimos pueden ver eventos';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Reinicia tu app Expo con: npx expo start --clear';
    RAISE NOTICE '   La pantalla azul debería desaparecer';
  ELSE
    RAISE NOTICE '❌ ERROR: Los usuarios anónimos NO pueden ver eventos';
    RAISE NOTICE '   Ejecuta manualmente el PASO 2 de SOLUCIONAR_PANTALLA_AZUL.md';
  END IF;
  RAISE NOTICE '';
END $$;

-- Mostrar primeros 3 eventos
SELECT
  'Eventos disponibles:' as info,
  id,
  title,
  date,
  price,
  status
FROM public.events
WHERE status = 'active'
ORDER BY date
LIMIT 3;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
