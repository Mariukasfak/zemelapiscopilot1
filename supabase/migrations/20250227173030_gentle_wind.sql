/*
  # User roles and location ratings

  1. New Tables
    - `user_roles` - Stores user role information
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
    
    - `location_ratings` - Stores user ratings for locations
      - `id` (uuid, primary key)
      - `location_id` (uuid, references locations)
      - `user_id` (uuid, references auth.users)
      - `rating` (integer, 1-5)
      - `review` (text)
      - `created_at` (timestamptz)
  
  2. Changes
    - Add `role` column to `user_profiles` table
    - Add default roles (admin, moderator, user, renter)
    - Add `is_approved` column to `locations` table
    - Add `weather_data` column to `locations` table

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for each table
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles
CREATE POLICY "Anyone can read user roles"
  ON user_roles
  FOR SELECT
  USING (true);

-- Insert default roles
INSERT INTO user_roles (name, description)
VALUES 
  ('admin', 'Can manage all content and users'),
  ('moderator', 'Can approve locations and moderate content'),
  ('user', 'Regular user with basic permissions'),
  ('renter', 'Can add rental properties with additional information')
ON CONFLICT (name) DO NOTHING;

-- Add role column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role_id uuid REFERENCES user_roles(id);
    
    -- Set default role to 'user' for existing profiles
    UPDATE user_profiles 
    SET role_id = (SELECT id FROM user_roles WHERE name = 'user')
    WHERE role_id IS NULL;
  END IF;
END $$;

-- Create location_ratings table
CREATE TABLE IF NOT EXISTS location_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, user_id)
);

-- Enable RLS
ALTER TABLE location_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for location_ratings
CREATE POLICY "Anyone can read location ratings"
  ON location_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON location_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON location_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON location_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add is_approved column to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE locations ADD COLUMN is_approved boolean DEFAULT false;
    
    -- Set existing locations as approved
    UPDATE locations SET is_approved = true WHERE is_approved IS NULL;
  END IF;
END $$;

-- Add weather_data column to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'weather_data'
  ) THEN
    ALTER TABLE locations ADD COLUMN weather_data jsonb;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS location_ratings_location_id_idx ON location_ratings (location_id);
CREATE INDEX IF NOT EXISTS location_ratings_user_id_idx ON location_ratings (user_id);