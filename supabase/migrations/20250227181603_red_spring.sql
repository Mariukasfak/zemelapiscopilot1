/*
  # Add storage bucket for location images

  1. New Storage Bucket
    - `location-images` bucket for storing location photos
  2. Security
    - Enable public access for reading images
    - Allow authenticated users to upload images
*/

-- Create storage bucket for location images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to read images
CREATE POLICY "Public can view location images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'location-images');

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload location images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-images');

-- Create policy to allow users to update their own images
CREATE POLICY "Users can update their own location images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'location-images' AND auth.uid() = owner);

-- Create policy to allow users to delete their own images
CREATE POLICY "Users can delete their own location images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-images' AND auth.uid() = owner);