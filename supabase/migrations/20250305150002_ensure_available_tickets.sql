-- Ensure all events have available_tickets set properly
-- If available_tickets is 0 or NULL, set it to a reasonable default

UPDATE public.events
SET available_tickets = COALESCE(total_tickets, 100)
WHERE available_tickets IS NULL OR available_tickets = 0;

-- Ensure available_tickets is never NULL
ALTER TABLE public.events
ALTER COLUMN available_tickets SET DEFAULT 100,
ALTER COLUMN available_tickets SET NOT NULL;

-- Add a check to ensure available_tickets is never negative
ALTER TABLE public.events
ADD CONSTRAINT check_available_tickets_positive
CHECK (available_tickets >= 0);
