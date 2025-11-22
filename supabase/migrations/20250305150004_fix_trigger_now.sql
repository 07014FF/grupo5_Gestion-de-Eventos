-- ARREGLO DEFINITIVO del trigger decrement_available_tickets
-- Este trigger DEBE funcionar con SECURITY DEFINER correctamente

-- Eliminar TODOS los triggers que usan esta función
DROP TRIGGER IF EXISTS on_ticket_created ON public.tickets;
DROP TRIGGER IF EXISTS trigger_decrement_tickets ON public.tickets;

-- Eliminar la función (ahora sin dependencias)
DROP FUNCTION IF EXISTS public.decrement_available_tickets() CASCADE;

-- Crear función con SECURITY DEFINER que funcione correctamente
CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Obtener el número actual de tickets disponibles
  SELECT available_tickets INTO current_available
  FROM public.events
  WHERE id = NEW.event_id
  FOR UPDATE;  -- Lock the row to prevent race conditions

  -- Verificar que el evento existe
  IF current_available IS NULL THEN
    RAISE EXCEPTION 'El evento no existe';
  END IF;

  -- Verificar que hay tickets disponibles
  IF current_available <= 0 THEN
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  -- Decrementar los tickets disponibles
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id;

  RETURN NEW;
END;
$$;

-- Crear el trigger
CREATE TRIGGER on_ticket_created
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_available_tickets();

-- Asegurar permisos
GRANT UPDATE ON public.events TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_available_tickets() TO authenticated;

-- Comentario
COMMENT ON FUNCTION public.decrement_available_tickets() IS 'Decrementa available_tickets cuando se crea un ticket. Usa SECURITY DEFINER para bypasear RLS.';
