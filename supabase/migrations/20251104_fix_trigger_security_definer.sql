-- Fix decrement_available_tickets trigger to bypass RLS
-- The trigger needs SECURITY DEFINER to update events table with elevated privileges

CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges to bypass RLS
SET search_path = public
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update available tickets count
  UPDATE public.events
  SET available_tickets = available_tickets - 1
  WHERE id = NEW.event_id
    AND available_tickets > 0;

  -- Check if the update was successful
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    -- Check if event exists
    IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = NEW.event_id) THEN
      RAISE EXCEPTION 'El evento no existe';
    END IF;
    -- Event exists but no tickets available
    RAISE EXCEPTION 'No hay tickets disponibles para este evento';
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it's properly configured
DROP TRIGGER IF EXISTS on_ticket_created ON public.tickets;

CREATE TRIGGER on_ticket_created
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_available_tickets();

-- Grant necessary permissions to ensure the function works
GRANT UPDATE ON public.events TO authenticated;
