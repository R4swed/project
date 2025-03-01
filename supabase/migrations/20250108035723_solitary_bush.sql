/*
  # Fix RLS policies for tickets table

  1. Changes
    - Update RLS policy to allow public access for ticket creation
    - Keep existing policies for support staff
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;

-- Create new insert policy that explicitly allows public access
CREATE POLICY "Public can create tickets"
  ON tickets
  FOR INSERT
  TO public
  WITH CHECK (true);