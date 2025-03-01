/*
  # Fix permissions for chat and user access

  1. Changes
    - Grant SELECT permissions on auth.users to authenticated users
    - Update chat policies for better access control
    - Add missing indexes for performance
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Chat access policy" ON chats;

-- Allow users to read messages
CREATE POLICY "Read chat messages"
  ON chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('support', 'admin')
        )
      )
    )
  );

-- Allow users to send messages
CREATE POLICY "Send chat messages"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('support', 'admin')
        )
      )
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_client_email ON tickets(client_email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(id, role);