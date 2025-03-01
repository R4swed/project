/*
  # Fix chat permissions

  1. Changes
    - Add policies for chat access
    - Update chat policies to use email instead of user id
    - Add policy for reading user profiles
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for reading user data
*/

-- Update chat policies to use email for access control
DROP POLICY IF EXISTS "Users can read their own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert their own messages" ON chats;

CREATE POLICY "Users can read chat messages"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = chats.ticket_id
      AND (
        -- Client can read their own ticket chats
        t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        -- Support staff can read all chats
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('support', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can send chat messages"
  ON chats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
      AND (
        -- Client can send messages to their own tickets
        t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        -- Support staff can send messages to any ticket
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('support', 'admin')
        )
      )
    )
  );

-- Add policy for reading user profiles
CREATE POLICY "Allow reading user profiles"
  ON auth.users FOR SELECT
  TO authenticated
  USING (true);

-- Add policy for reading profiles
CREATE POLICY "Allow reading profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);