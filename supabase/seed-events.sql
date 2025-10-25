-- =====================================================
-- DATOS DE PRUEBA - EVENTOS
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- Insertar eventos de prueba
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
  status
) VALUES
  (
    'Festival de Jazz 2024',
    'Una noche inolvidable con los mejores músicos',
    'Disfruta de una velada mágica con los exponentes más destacados del jazz internacional. Incluye bebida de cortesía y acceso a zona VIP.',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
    '2025-12-20',
    '19:30:00',
    'Bogotá, Colombia',
    'Centro Cultural Gabriel García Márquez',
    45000,
    150,
    150,
    'Música',
    'active'
  ),
  (
    'Concierto Rock en Vivo',
    'Las mejores bandas de rock nacional',
    'Una noche épica de rock and roll con las bandas más importantes del momento. Incluye zona de camping y food trucks.',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    '2025-12-25',
    '20:00:00',
    'Bogotá, Colombia',
    'Parque Simón Bolívar',
    60000,
    200,
    200,
    'Música',
    'active'
  ),
  (
    'Teatro: El Quijote',
    'Adaptación moderna del clásico de Cervantes',
    'Una puesta en escena espectacular que combina tradición y modernidad. Dirección de Juan Carlos Pérez, ganador del Premio Nacional de Teatro.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    '2025-12-15',
    '18:00:00',
    'Bogotá, Colombia',
    'Teatro Nacional Fanny Mikey',
    35000,
    100,
    100,
    'Teatro',
    'active'
  ),
  (
    'Stand Up Comedy Night',
    'Risas garantizadas con los mejores comediantes',
    'Una noche de humor con los comediantes más destacados del país. Show para mayores de 18 años. Incluye consumo mínimo.',
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
    '2025-11-30',
    '21:00:00',
    'Bogotá, Colombia',
    'Club de la Comedia',
    25000,
    80,
    80,
    'Comedia',
    'active'
  ),
  (
    'Exposición de Arte Contemporáneo',
    'Obras de artistas emergentes latinoamericanos',
    'Muestra colectiva de más de 50 obras de artistas emergentes de toda Latinoamérica. Incluye charla con los artistas y cóctel de inauguración.',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
    '2025-11-25',
    '15:00:00',
    'Bogotá, Colombia',
    'Museo de Arte Moderno de Bogotá',
    20000,
    120,
    120,
    'Arte',
    'active'
  ),
  (
    'Concierto de Salsa',
    'La mejor orquesta de salsa en vivo',
    'Ven a bailar con la orquesta más importante de salsa del país. Una noche llena de ritmo y sabor caribeño.',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    '2026-01-15',
    '22:00:00',
    'Cali, Colombia',
    'Estadio Pascual Guerrero',
    55000,
    300,
    300,
    'Música',
    'active'
  ),
  (
    'Festival Gastronómico',
    'Los mejores chefs del país',
    'Degusta platos únicos preparados por chefs galardonados. Incluye talleres de cocina y maridaje de vinos.',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    '2025-12-10',
    '12:00:00',
    'Medellín, Colombia',
    'Plaza Mayor',
    40000,
    180,
    180,
    'Gastronomía',
    'active'
  ),
  (
    'Partido de Fútbol',
    'Clásico capitalino - Derby histórico',
    'El partido más esperado del año. Disfruta del mejor fútbol en un ambiente familiar y seguro.',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    '2026-02-20',
    '16:00:00',
    'Bogotá, Colombia',
    'Estadio El Campín',
    50000,
    400,
    400,
    'Deportes',
    'active'
  );

-- Verificar que se insertaron correctamente
SELECT id, title, date, price, available_tickets, category, status
FROM public.events
ORDER BY date ASC;
