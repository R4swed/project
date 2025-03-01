/*
  # Fix support staff role verification

  1. Changes
    - Add policy to ensure proper role verification
    - Add index on role column for faster lookups
*/

-- Add index on role column for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Ensure proper role policies
DO $$ 
BEGIN
  -- Add role check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('client', 'support'));
  END IF;
END $$;