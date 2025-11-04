-- Migration: Add student_price and general_price fields to events table
-- Date: 2025-10-25
-- Description: Adds pricing differentiation for student and general tickets

-- Add new columns for differentiated pricing
ALTER TABLE events
ADD COLUMN IF NOT EXISTS student_price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS general_price DECIMAL(10, 2) DEFAULT 5.00;

-- Update existing events with default values
UPDATE events
SET
  student_price = 0.00,
  general_price = 5.00
WHERE student_price IS NULL OR general_price IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN events.student_price IS 'Price for student tickets in Peruvian Soles (S/). Default: 0.00 (free)';
COMMENT ON COLUMN events.general_price IS 'Price for general admission tickets in Peruvian Soles (S/). Default: 5.00';

-- Create index for price queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_events_student_price ON events(student_price);
CREATE INDEX IF NOT EXISTS idx_events_general_price ON events(general_price);
