/*
  # Create location comments table

  1. New Tables
    - `location_comments`
      - `id` (uuid, primary key)
      - `location_id` (uuid, references locations)
      - `user_id` (uuid, references auth.users)
      - `content` (text, not null)
      - `images` (text array)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `location_comments` table
    - Add policies for:
      - Anyone can read comments
      - Authenticated users can insert their own comments
      - Users can update only their own comments
      - Users can delete only their own comments
*/

-- Create location comments table
CREATE TABLE IF NOT EXISTS location_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON location_comments
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert their own comments"
  ON location_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own comments
CREATE POLICY "Users can update only their own comments"
  ON location_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own comments
CREATE POLICY "Users can delete only their own comments"
  ON location_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS location_comments_location_id_idx ON location_comments (location_id);