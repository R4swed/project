/*
  # Fix chat system permissions

  1. Changes
    - Update chat policies to be more permissive
    - Add explicit policies for auth.users table
    - Simplify chat access logic
  
  2. Security
    - Maintain security while allowing necessary access
    - Enable proper chat functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read chat messages" ON chats;
DROP POLICY IF EXISTS "Users can send chat messages" ON chats;

-- Create simplified chat policies
CREATE POLICY "Chat access policy"
  ON chats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = chats.ticket_id
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

-- Grant necessary permissions
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;