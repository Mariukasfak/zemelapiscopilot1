/*
  # Fix database relationships and add username columns

  1. Changes
    - Add username column to location_comments table
    - Add username column to location_ratings table
    - Create triggers to automatically populate username fields
    - Update existing records with usernames

  2. Notes
    - This avoids foreign key constraints that already exist
    - Provides a direct username field for easier queries
*/

-- Add username column to location_comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_comments' AND column_name = 'username'
  ) THEN
    ALTER TABLE location_comments ADD COLUMN username text;
    
    -- Update existing comments with usernames
    UPDATE location_comments c
    SET username = COALESCE(
      (SELECT username FROM user_profiles WHERE id = c.user_id),
      (SELECT email FROM auth.users WHERE id = c.user_id),
      'Vartotojas'
    );
  END IF;
END $$;

-- Create function to set username on comment creation
CREATE OR REPLACE FUNCTION get_username_for_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Get username from user_profiles or use email from auth.users as fallback
  NEW.username := (
    SELECT COALESCE(
      (SELECT username FROM user_profiles WHERE id = NEW.user_id),
      (SELECT email FROM auth.users WHERE id = NEW.user_id),
      'Vartotojas'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set username on insert
DROP TRIGGER IF EXISTS set_comment_username ON location_comments;
CREATE TRIGGER set_comment_username
  BEFORE INSERT ON location_comments
  FOR EACH ROW
  EXECUTE FUNCTION get_username_for_comment();

-- Add username column to location_ratings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_ratings' AND column_name = 'username'
  ) THEN
    ALTER TABLE location_ratings ADD COLUMN username text;
    
    -- Update existing ratings with usernames
    UPDATE location_ratings r
    SET username = COALESCE(
      (SELECT username FROM user_profiles WHERE id = r.user_id),
      (SELECT email FROM auth.users WHERE id = r.user_id),
      'Vartotojas'
    );
  END IF;
END $$;

-- Create function for ratings username
CREATE OR REPLACE FUNCTION get_username_for_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Get username from user_profiles or use email from auth.users as fallback
  NEW.username := (
    SELECT COALESCE(
      (SELECT username FROM user_profiles WHERE id = NEW.user_id),
      (SELECT email FROM auth.users WHERE id = NEW.user_id),
      'Vartotojas'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set username on insert for ratings
DROP TRIGGER IF EXISTS set_rating_username ON location_ratings;
CREATE TRIGGER set_rating_username
  BEFORE INSERT ON location_ratings
  FOR EACH ROW
  EXECUTE FUNCTION get_username_for_rating();