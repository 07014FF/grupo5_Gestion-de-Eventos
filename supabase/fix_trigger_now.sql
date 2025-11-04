-- Quick fix: Update trigger to use SECURITY DEFINER to bypass RLS
-- Run this SQL directly in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.decrement_available_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key: run with function owner's privileges
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
