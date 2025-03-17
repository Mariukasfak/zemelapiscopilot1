import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Location, UserRole, WeatherData } from '../types';
import { fetchWeatherData } from '../services/weatherService';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseLocationsResult {
  locations: Location[];
  loading: boolean;
  fetchLocationsByBounds: (bounds: MapBounds) => Promise<void>;
  updateLocationsWithRatings: (locations: Location[]) => Promise<Location[]>;
  updateLocationsWithWeatherData: (locationsData: Location[]) => Promise<Location[]>;
}

export const useLocations = (userRole: UserRole = 'user'): UseLocationsResult => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch locations by map bounds
  const fetchLocationsByBounds = useCallback(async (bounds: MapBounds) => {
    try {
      setLoading(true);
      // Start building the query
      let query = supabase
        .from('locations')
        .select('*')
        // Filter by bounds
        .lt('latitude', bounds.north)
        .gt('latitude', bounds.south)
        .lt('longitude', bounds.east)
        .gt('longitude', bounds.west);
      
      // If not admin or moderator, only show approved locations
      if (userRole !== 'admin' && userRole !== 'moderator') {
        query = query.eq('is_approved', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching locations by bounds:', error);
        return;
      }
      
      // Update locations with ratings
      const updatedLocations = await updateLocationsWithRatings(data || []);
      
      setLocations(prevLocations => {
        const existingIds = new Set(prevLocations.map(loc => loc.id));
        const newLocations = updatedLocations.filter((loc: Location) => !existingIds.has(loc.id));
        return [...prevLocations, ...newLocations];
      });
    } catch (error) {
      console.error('Error in fetchLocationsByBounds:', error);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Helper function to get ratings and update locations
  const updateLocationsWithRatings = useCallback(async (locations: Location[]): Promise<Location[]> => {
    try {
      // Get all ratings
      const { data: ratings, error } = await supabase
        .from('location_ratings')
        .select('*');
        
      if (error) throw error;
      
      // Calculate average ratings for each location
      const locationRatings: Record<string, number[]> = {};
      if (ratings) {
        ratings.forEach(rating => {
          if (!locationRatings[rating.location_id]) {
            locationRatings[rating.location_id] = [];
          }
          locationRatings[rating.location_id].push(rating.rating);
        });
      }
      
      // Log ratings for debugging
      console.log('Fetched ratings for locations:', 
        Object.keys(locationRatings).length, 'locations have ratings');
      
      // Update locations with calculated average ratings
      const updatedLocations = locations.map(location => {
        const ratingsForLocation = locationRatings[location.id] || [];
        let avgRating = undefined;
        if (ratingsForLocation.length > 0) {
          // Calculate average and ensure it's a number
          const sum = ratingsForLocation.reduce((acc, r) => acc + r, 0);
          avgRating = Number((sum / ratingsForLocation.length).toFixed(1));
        }
        
        return {
          ...location,
          rating: avgRating,
          ratings_count: ratingsForLocation.length
        };
      });
      
      return updatedLocations;
    } catch (error) {
      console.error('Error updating locations with ratings:', error);
      return locations;
    }
  }, []);

  // Function to update locations with weather data
  const updateLocationsWithWeatherData = useCallback(async (locationsData: Location[]): Promise<Location[]> => {
    // Create a copy to avoid modifying direct values
    const updatedLocations = [...locationsData];
    
    // Prepare personal update limits
    const MAX_CONCURRENT_UPDATES = 3;
    const locationsToUpdate = [];
    
    // Review all locations
    for (let i = 0; i < updatedLocations.length; i++) {
      const location = updatedLocations[i];
      
      // If it has coordinates and no new weather data, add to queue
      if (location.latitude && location.longitude && 
        (!location.weather_data || 
         !('lastUpdated' in (location.weather_data || {})) || 
         new Date().getTime() - new Date((location.weather_data as any).lastUpdated).getTime() > 60 * 60 * 1000)) {
        locationsToUpdate.push(i);
      }
    }
    
    // Update weather for each location up to MAX_CONCURRENT_UPDATES at a time
    for (let i = 0; i < locationsToUpdate.length; i += MAX_CONCURRENT_UPDATES) {
      const batch = locationsToUpdate.slice(i, i + MAX_CONCURRENT_UPDATES);
      await Promise.all(batch.map(async (index) => {
        try {
          const location = updatedLocations[index];
          // Get real weather data for all locations, without exceptions
          const weatherData = await fetchWeatherData(location.latitude, location.longitude);
          if (weatherData) {
            updatedLocations[index] = {
              ...location,
              weather_data: {
                ...weatherData,
                // Add lastUpdated as a custom field separate from standard WeatherData
                lastUpdated: new Date().toISOString()
              } as WeatherData & { lastUpdated: string }
            };
          }
        } catch (error) {
          console.error(`Error updating weather for location at index ${index}:`, error);
        }
      }));
      
      // Add a small pause between each batch
      if (i + MAX_CONCURRENT_UPDATES < locationsToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return updatedLocations;
  }, []);

  return {
    locations,
    loading,
    fetchLocationsByBounds,
    updateLocationsWithRatings,
    updateLocationsWithWeatherData // Export the weather update function
  };
};
