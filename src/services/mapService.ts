import { Location, WeatherData, MapBounds } from '../types';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../utils/MapUtils';

/**
 * Fetches locations from the database with optional filtering
 * @param userRole - The user's role for permission checks
 * @param bounds - Optional map bounds to filter locations
 * @param filterRadius - Optional radius to filter by distance
 * @param userPosition - User's current position for distance calculations
 */
export const fetchLocations = async (
  userRole: string | null = null,
  bounds?: MapBounds,
  filterRadius?: number,
  userPosition?: [number, number]
): Promise<Location[]> => {
  try {
    // Start query
    let query = supabase.from('locations').select('*');
    
    // Filter by bounds if provided
    if (bounds) {
      query = query
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);
    }
    
    // Show unapproved locations only to admins and moderators
    if (userRole !== 'admin' && userRole !== 'moderator') {
      query = query.eq('is_approved', true);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Filter by radius if needed
    let filteredLocations = data || [];
    if (filterRadius && filterRadius > 0 && userPosition) {
      filteredLocations = filteredLocations.filter(location => {
        const distance = calculateDistance(
          userPosition[0], userPosition[1],
          location.latitude, location.longitude
        );
        return distance <= filterRadius;
      });
    }
    
    return filteredLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

/**
 * Fetch weather data for a specific location
 * @param latitude - Location latitude used to get weather for that specific coordinate
 * @param longitude - Location longitude used to get weather for that specific coordinate
 */
export const fetchWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);
    
    // Demonstration of using the coordinates to fetch different weather
    // In a real app, we would call an external weather API with these coordinates
    const randomFactor = (Math.sin(latitude) + Math.cos(longitude)) * 5;
    
    return {
      temp: Math.round(Math.random() * 20 - 5 + randomFactor), // Random temp between -5 and 15 + location factor
      humidity: Math.round(Math.random() * 40 + 40 + randomFactor % 20), // Random humidity between 40 and 80
      windSpeed: Math.round((Math.random() * 10 + (longitude % 5)) * 10) / 10, // Random wind speed with location variation
      description: ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Partly cloudy'][Math.floor((latitude + longitude) % 5)],
      icon: ['01d', '02d', '03d', '09d', '13d'][Math.floor((latitude * longitude) % 5)]
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

/**
 * Update weather data for multiple locations
 * @param locations - List of locations to update weather for
 */
export const updateWeatherData = async (locations: Location[]): Promise<Location[]> => {
  try {
    // In a production app, you would batch these requests
    // or use a weather API that supports multiple locations
    const updatedLocations = await Promise.all(locations.map(async location => {
      if (!location.latitude || !location.longitude) return location;
      
      try {
        const weather = await fetchWeatherData(location.latitude, location.longitude);
        return {
          ...location,
          weather_data: weather
        };
      } catch (error) {
        // If weather fetch fails for a location, just return the location without weather
        console.error(`Failed to get weather for location ${location.id}:`, error);
        return location;
      }
    }));
    
    return updatedLocations;
  } catch (error) {
    console.error('Error updating weather data:', error);
    return locations;
  }
};
