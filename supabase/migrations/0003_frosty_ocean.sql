/*
  # Add client information to tickets table

  1. Changes
    - Add `client_name` column to store the name of the client
    - Add `client_email` column to store the email of the client
    - Make both fields required for new tickets

  2. Security
    - No changes to existing RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE tickets ADD COLUMN client_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'client_email'
  ) THEN
    ALTER TABLE tickets ADD COLUMN client_email text NOT NULL DEFAULT '';
  END IF;
END $$;