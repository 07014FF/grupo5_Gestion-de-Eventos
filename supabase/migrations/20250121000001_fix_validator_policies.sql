-- Migration: Fix ticket_validations policies to support qr_validator role
-- Only updates RLS policies, no user changes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all validations" ON ticket_validations;
DROP POLICY IF EXISTS "Admins can create validations" ON ticket_validations;
DROP POLICY IF EXISTS "Users can view their own validations" ON ticket_validations;
DROP POLICY IF EXISTS "Admins and validators can view validations" ON ticket_validations;
DROP POLICY IF EXISTS "Admins and validators can create validations" ON ticket_validations;

-- Create new policies that include qr_validator role
CREATE POLICY "Admins and validators can view validations" ON ticket_validations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'qr_validator')
    )
  );

CREATE POLICY "Admins and validators can create validations" ON ticket_validations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'qr_validator')
    )
  );

-- Users can still view their own validations
CREATE POLICY "Users can view their own validations" ON ticket_validations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = ticket_validations.ticket_id
      AND purchases.user_id = auth.uid()
    )
  );
