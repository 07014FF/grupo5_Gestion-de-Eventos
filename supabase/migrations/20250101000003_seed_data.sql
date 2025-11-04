-- =====================================================
-- MIGRACION: Datos Semilla (Seed Data)
-- Eventos de ejemplo para pruebas
-- Fecha: 2025-01-01
-- =====================================================
-- NOTA: Esta migración es OPCIONAL y solo para desarrollo/testing
-- =====================================================

-- =====================================================
-- INSERTAR EVENTOS DE EJEMPLO
-- =====================================================

-- Verificar si ya existen eventos antes de insertar
DO $$
BEGIN
  -- Solo insertar si no hay eventos
  IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN

    -- Evento 1: Festival de Jazz en Lima
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Festival de Jazz Lima 2025',
      'Gran Festival Internacional de Jazz',
      'El festival de jazz más importante del Perú trae a los mejores artistas internacionales. Disfruta de una noche inolvidable con música en vivo, food trucks y ambiente único.',
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

    -- Evento 2: Concierto de Rock
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Rock en el Estadio',
      'Festival de Rock Nacional e Internacional',
      'Las mejores bandas de rock del Perú y Latinoamérica se reúnen en un solo escenario. Una experiencia única para los amantes del rock.',
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

    -- Evento 3: Teatro
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'El Quijote - Obra de Teatro',
      'Adaptación moderna del clásico de Cervantes',
      'Una reinterpretación contemporánea de Don Quijote de la Mancha. Actuaciones magistrales y una puesta en escena espectacular.',
      'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      CURRENT_DATE + INTERVAL '15 days',
      '18:00:00',
      'Lima, Perú',
      'Teatro Municipal de Lima',
      65.00,
      150,
      150,
      'Teatro',
      4.9,
      'active'
    );

    -- Evento 4: Festival Gastronómico
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Mistura 2025',
      'La Feria Gastronómica más Grande de Latinoamérica',
      'Descubre los sabores del Perú y el mundo. Más de 200 restaurantes, chefs reconocidos y experiencias culinarias únicas.',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      CURRENT_DATE + INTERVAL '60 days',
      '10:00:00',
      'Lima, Perú',
      'Costa Verde',
      45.00,
      1000,
      1000,
      'Gastronomía',
      5.0,
      'active'
    );

    -- Evento 5: Concierto de Salsa
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Noche de Salsa Brava',
      'Las mejores orquestas de salsa en un solo lugar',
      'Baila toda la noche con las mejores orquestas de salsa del Perú y el Caribe. Ambiente familiar y pista de baile gigante.',
      'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800',
      CURRENT_DATE + INTERVAL '20 days',
      '21:00:00',
      'Lima, Perú',
      'Club Lawn Tennis',
      75.50,
      300,
      300,
      'Música',
      4.7,
      'active'
    );

    -- Evento 6: Stand Up Comedy
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Stand Up: Risas sin Control',
      'Los mejores comediantes del país',
      'Una noche de risas garantizadas con los comediantes más destacados del Perú. Show para mayores de 18 años.',
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

    -- Evento 7: Festival Electrónico
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Electric Dreams Festival',
      'Festival de Música Electrónica',
      'Los mejores DJs internacionales y nacionales en el festival de música electrónica más esperado del año. 3 escenarios, efectos visuales y experiencia 360.',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      CURRENT_DATE + INTERVAL '90 days',
      '22:00:00',
      'Lima, Perú',
      'Jockey Club del Perú',
      150.00,
      800,
      800,
      'Música',
      4.9,
      'active'
    );

    -- Evento 8: Feria de Libro
    INSERT INTO public.events (
      title,
      subtitle,
      description,
      image_url,
      date,
      time,
      location,
      venue,
      price,
      available_tickets,
      total_tickets,
      category,
      rating,
      status
    ) VALUES (
      'Feria Internacional del Libro de Lima',
      'El evento literario más importante del Perú',
      'Más de 500 editoriales, presentaciones de libros, conferencias con autores reconocidos y actividades culturales para toda la familia.',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      CURRENT_DATE + INTERVAL '25 days',
      '09:00:00',
      'Lima, Perú',
      'Jockey Plaza',
      25.00,
      500,
      500,
      'Cultural',
      4.6,
      'active'
    );

    RAISE NOTICE 'Se insertaron 8 eventos de ejemplo exitosamente';
  ELSE
    RAISE NOTICE 'Ya existen eventos en la base de datos. No se insertaron datos semilla.';
  END IF;
END $$;

-- =====================================================
-- FUNCIÓN HELPER: Limpiar datos de prueba
-- =====================================================

CREATE OR REPLACE FUNCTION public.clear_seed_data()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.clear_seed_data IS
  'Elimina todos los datos de prueba (eventos, tickets, compras, validaciones)';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar eventos insertados
SELECT
  id,
  title,
  date,
  time,
  location,
  price,
  available_tickets,
  category,
  status
FROM public.events
ORDER BY date;

-- =====================================================
-- FIN DE MIGRACIÓN SEED DATA
-- =====================================================
