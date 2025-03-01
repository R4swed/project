/*
  # Add chat functionality

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references tickets)
      - `sender_id` (uuid, references auth.users)
      - `message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `chats` table
    - Add policies for authenticated users to read/write their own chats
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Policies for chats
CREATE POLICY "Users can read their own chats"
  ON chats FOR SELECT
  USING (
    sender_id = auth.uid() OR 
    ticket_id IN (
      SELECT id FROM tickets WHERE client_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own messages"
  ON chats FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT id FROM tickets WHERE 
        client_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        assigned_to = auth.uid()
    )
  );