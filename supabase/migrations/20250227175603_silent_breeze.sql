/*
  # Fix user roles and add super admin

  1. Updates
    - Add super admin role
    - Fix user profile creation
    - Ensure mariukasfak@gmail.com has admin role
*/

-- Add super admin role if it doesn't exist
INSERT INTO user_roles (name, description)
VALUES ('super_admin', 'Super administrator with all permissions')
ON CONFLICT (name) DO NOTHING;

-- Create function to set mariukasfak@gmail.com as admin
CREATE OR REPLACE FUNCTION set_super_admin()
RETURNS VOID AS $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
  
  -- Find user by email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'mariukasfak@gmail.com';
  
  -- If user exists, set as admin
  IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    -- Check if user profile exists
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = admin_user_id) THEN
      -- Update existing profile
      UPDATE user_profiles 
      SET role_id = admin_role_id
      WHERE id = admin_user_id;
    ELSE
      -- Create profile with admin role
      INSERT INTO user_profiles (id, role_id)
      VALUES (admin_user_id, admin_role_id);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT set_super_admin();

-- Drop the function after use
DROP FUNCTION set_super_admin();

-- Fix user profile creation on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get default user role ID
  SELECT id INTO default_role_id FROM user_roles WHERE name = 'user';

  -- Check if profile already exists to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    -- Insert the new profile with default role
    INSERT INTO user_profiles (id, role_id)
    VALUES (NEW.id, default_role_id);
  END IF;
  
  -- Special case for mariukasfak@gmail.com
  IF NEW.email = 'mariukasfak@gmail.com' THEN
    UPDATE user_profiles 
    SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  -- Handle any exceptions to prevent registration failures
  WHEN OTHERS THEN
    -- Still return NEW to allow the user creation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();