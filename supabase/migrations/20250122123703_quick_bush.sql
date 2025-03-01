/*
  # Add support codes and enhance authentication

  1. New Tables
    - `support_codes`
      - `code` (text, primary key) - Unique registration code
      - `is_used` (boolean) - Whether the code has been used
      - `created_at` (timestamptz) - When the code was created
      - `used_at` (timestamptz) - When the code was used
      - `used_by` (uuid) - Reference to the user who used the code

  2. Security
    - Enable RLS on `support_codes` table
    - Add policies for support code verification
*/

-- Create support codes table
CREATE TABLE IF NOT EXISTS support_codes (
  code text PRIMARY KEY,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE support_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can verify support codes"
  ON support_codes
  FOR SELECT
  TO public
  USING (true);

-- Create function to verify support code
CREATE OR REPLACE FUNCTION verify_support_code(code_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM support_codes 
    WHERE code = code_to_verify 
    AND is_used = false
  );
END;
$$;