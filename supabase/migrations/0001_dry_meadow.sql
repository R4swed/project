/*
  # Technical Support System Schema

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `complexity` (text)
      - `created_at` (timestamp)
      - `assigned_to` (uuid, references auth.users)
    
  2. Security
    - Enable RLS on `tickets` table
    - Add policies for ticket management
*/

-- Create tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL,
  complexity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  assigned_to uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create tickets"
  ON tickets
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Support staff can view tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Support staff can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);