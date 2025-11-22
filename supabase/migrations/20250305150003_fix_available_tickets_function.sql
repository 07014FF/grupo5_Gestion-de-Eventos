-- Function to fix available_tickets for events
-- This function has SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.fix_event_available_tickets(event_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET available_tickets = COALESCE(total_tickets, 100)
  WHERE id = event_id_param
    AND (available_tickets IS NULL OR available_tickets <= 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fix_event_available_tickets(UUID) TO authenticated;

-- Fix all events that currently have 0 or NULL available_tickets
UPDATE public.events
SET available_tickets = COALESCE(total_tickets, 100)
WHERE available_tickets IS NULL OR available_tickets <= 0;
