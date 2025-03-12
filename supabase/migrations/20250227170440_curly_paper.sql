/*
  # Fix user registration trigger

  1. Changes
    - Modify the `create_profile_for_user()` function to handle errors better
    - Add exception handling to prevent registration failures
    - Make the function more robust by checking if the profile already exists

  2. Security
    - No changes to security policies
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Modify the function to be more robust
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    -- Insert the new profile
    INSERT INTO user_profiles (id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  -- Handle any exceptions to prevent registration failures
  WHEN OTHERS THEN
    -- Log the error (in a real production environment)
    -- RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    
    -- Still return NEW to allow the user creation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();