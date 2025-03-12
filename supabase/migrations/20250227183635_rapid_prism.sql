/*
  # Add main_image_index to locations table

  1. Changes
    - Add main_image_index column to locations table to track which image is the main one
    - Default value is 0 (first image)
*/

-- Add main_image_index column to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'main_image_index'
  ) THEN
    ALTER TABLE locations ADD COLUMN main_image_index integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update weather data periodically
CREATE OR REPLACE FUNCTION update_location_weather()
RETURNS VOID AS $$
DECLARE
  loc RECORD;
BEGIN
  -- Loop through all locations
  FOR loc IN SELECT id FROM locations LOOP
    -- Generate mock weather data
    UPDATE locations
    SET weather_data = json_build_object(
      'temp', floor(random() * 25 + 5)::int,
      'humidity', floor(random() * 50 + 30)::int,
      'windSpeed', floor(random() * 10 + 1)::int,
      'description', (ARRAY['Sunny', 'Cloudy', 'Partly cloudy', 'Rainy', 'Clear'])[floor(random() * 5 + 1)],
      'icon', (ARRAY['01d', '02d', '03d', '04d', '10d'])[floor(random() * 5 + 1)]
    )
    WHERE id = loc.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update weather data daily
-- Note: This is a mock implementation. In a real production environment,
-- you would use a proper scheduled job system.
DO $$
BEGIN
  -- Run the function once to initialize weather data
  PERFORM update_location_weather();
END $$;