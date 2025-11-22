-- Sistema de ticket único por compra
-- Un ticket representa múltiples entradas (quantity)

-- 1. Agregar campo quantity a tickets
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1);

COMMENT ON COLUMN public.tickets.quantity IS 'Cantidad de entradas que representa este ticket';

-- 2. Crear función para decrementar tickets por cantidad
CREATE OR REPLACE FUNCTION public.decrement_tickets_by_quantity(
  event_id_param UUID,
  decrement_by INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  SELECT available_tickets INTO current_available
  FROM public.events
  WHERE id = event_id_param
  FOR UPDATE;

  IF current_available IS NULL THEN
    RAISE EXCEPTION 'El evento no existe';
  END IF;

  IF current_available < decrement_by THEN
    RAISE EXCEPTION 'No hay suficientes tickets disponibles';
  END IF;

  UPDATE public.events
  SET available_tickets = available_tickets - decrement_by
  WHERE id = event_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_tickets_by_quantity(UUID, INTEGER) TO authenticated;

-- 3. Deshabilitar trigger automático que decrementa uno por uno
DROP TRIGGER IF EXISTS on_ticket_created ON public.tickets;
