/*
  # Fix tickets table RLS policies - Final

  1. Changes
    - Temporarily disable RLS
    - Drop all existing policies
    - Create new policies with public access
    - Re-enable RLS
*/

-- Temporarily disable RLS
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
DROP POLICY IF EXISTS "Public can create tickets" ON tickets;
DROP POLICY IF EXISTS "Enable insert for everyone" ON tickets;
DROP POLICY IF EXISTS "Enable read for support" ON tickets;
DROP POLICY IF EXISTS "Enable update for support" ON tickets;
DROP POLICY IF EXISTS "Support staff can view tickets" ON tickets;
DROP POLICY IF EXISTS "Support staff can update tickets" ON tickets;

-- Create new simplified policies
CREATE POLICY "tickets_insert_policy"
  ON tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "tickets_select_policy"
  ON tickets FOR SELECT
  USING (true);

CREATE POLICY "tickets_update_policy"
  ON tickets FOR UPDATE
  USING (true);

-- Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;