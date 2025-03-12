/*
  # Create locations table and related schema

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `latitude` (float, not null)
      - `longitude` (float, not null)
      - `categories` (text array, not null)
      - `is_public` (boolean, default true)
      - `is_paid` (boolean, default false)
      - `images` (text array)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
      - `created_by` (uuid, references auth.users)
      - `rating` (float)

  2. Security
    - Enable RLS on `locations` table
    - Add policies for:
      - Anyone can read locations
      - Authenticated users can insert their own locations
      - Users can update only their own locations
      - Users can delete only their own locations
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  latitude float NOT NULL,
  longitude float NOT NULL,
  categories text[] NOT NULL,
  is_public boolean DEFAULT true,
  is_paid boolean DEFAULT false,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users,
  rating float
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read locations
CREATE POLICY "Anyone can read locations"
  ON locations
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own locations
CREATE POLICY "Authenticated users can insert their own locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update only their own locations
CREATE POLICY "Users can update only their own locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete only their own locations
CREATE POLICY "Users can delete only their own locations"
  ON locations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create index for faster spatial queries
CREATE INDEX IF NOT EXISTS locations_coordinates_idx ON locations (latitude, longitude);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS locations_categories_idx ON locations USING GIN (categories);