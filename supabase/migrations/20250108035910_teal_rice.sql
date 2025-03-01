/*
  # Fix ticket table RLS policies

  1. Changes
    - Drop existing policies
    - Create new explicit policies for public ticket creation
    - Add policies for support staff access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
DROP POLICY IF EXISTS "Public can create tickets" ON tickets;
DROP POLICY IF EXISTS "Support staff can view tickets" ON tickets;
DROP POLICY IF EXISTS "Support staff can update tickets" ON tickets;

-- Create new policies
CREATE POLICY "Enable insert for everyone"
  ON tickets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable read for support"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for support"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);