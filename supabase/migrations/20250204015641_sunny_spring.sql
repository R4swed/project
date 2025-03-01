/*
  # Add admin user

  1. Changes
    - Create admin user with credentials admin/admin
    - Add admin profile with proper ID handling
*/

DO $$ 
DECLARE 
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Create admin user if not exists
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    confirmation_sent_at
  )
  SELECT
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin',
    crypt('admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin'
  );

  -- Create profile for the admin user
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = new_user_id) THEN
    INSERT INTO profiles (id, email, role)
    VALUES (new_user_id, 'admin', 'admin');
  END IF;
END $$;