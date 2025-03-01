/*
  # Fix chat relationships and queries

  1. Changes
    - Add foreign key relationship between chats and profiles
    - Update chat queries to use auth.users instead of profiles
    - Add indexes for better performance
  
  2. Security
    - Maintain existing RLS policies
    - Ensure proper relationships between tables
*/

-- Add foreign key relationship for sender_id
ALTER TABLE chats
DROP CONSTRAINT IF EXISTS chats_sender_id_fkey;

ALTER TABLE chats
ADD CONSTRAINT chats_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES auth.users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_ticket_id ON chats(ticket_id);