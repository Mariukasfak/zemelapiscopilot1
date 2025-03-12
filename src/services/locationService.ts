import { supabase } from '../lib/supabase';
import { Location, LocationCategory, UserRole } from '../types';

// Fetch locations
export const fetchLocations = async (userRole: UserRole) => {
  try {
    // Fetch all locations - we want everyone to see all locations
    let query = supabase.from('locations').select('*');
    
    // If not admin or moderator, only show approved locations
    if (userRole !== 'admin' && userRole !== 'moderator') {
      query = query.eq('is_approved', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Ensure all locations have proper structure
    const sanitizedData = (data || []).map(location => ({
      ...location,
      // Ensure categories is an array
      categories: Array.isArray(location.categories) ? location.categories : [],
      // Ensure images is an array
      images: Array.isArray(location.images) ? location.images : [],
      // Ensure rating is properly handled
      rating: typeof location.rating === 'number' ? location.rating : null
    }));
    
    return sanitizedData;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return generateMockLocations(); // Return mock data on error
  }
};

// Add new location
export const addLocation = async (locationData: any, userRole: UserRole) => {
  try {
    // Ensure locationData has valid structure
    const sanitizedData = {
      ...locationData,
      categories: Array.isArray(locationData.categories) ? locationData.categories : [],
      images: Array.isArray(locationData.images) ? locationData.images : [],
      created_by: (await supabase.auth.getUser()).data.user?.id,
      is_approved: userRole === 'admin' || userRole === 'moderator' // Auto-approve for admins and moderators
    };
    
    const { data, error } = await supabase
      .from('locations')
      .insert([sanitizedData])
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

// Update location
export const updateLocation = async (location: Location) => {
  try {
    const { error } = await supabase
      .from('locations')
      .update({
        name: location.name,
        description: location.description,
        latitude: location.latitude,
        longitude: location.longitude,
        categories: Array.isArray(location.categories) ? location.categories : [],
        is_public: location.is_public,
        is_paid: location.is_paid,
        main_image_index: location.main_image_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Delete location
export const deleteLocation = async (locationId: string) => {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// Approve location
export const approveLocation = async (locationId: string) => {
  try {
    const { error } = await supabase
      .from('locations')
      .update({ is_approved: true })
      .eq('id', locationId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error approving location:', error);
    throw error;
  }
};

// Fetch location comments
export const fetchLocationComments = async (locationId: string) => {
  try {
    const { data, error } = await supabase
      .from('location_comments')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Add location comment
export const addLocationComment = async (locationId: string, content: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('location_comments')
      .insert([
        {
          location_id: locationId,
          user_id: userId,
          content,
          images: []
        }
      ]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Fetch location ratings
export const fetchLocationRatings = async (locationId: string) => {
  try {
    const { data, error } = await supabase
      .from('location_ratings')
      .select('*')
      .eq('location_id', locationId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
};

// Add or update location rating
export const rateLocation = async (locationId: string, userId: string, rating: number, review?: string) => {
  try {
    // Check if user has already rated this location
    const { data: existingRating, error: checkError } = await supabase
      .from('location_ratings')
      .select('id')
      .eq('location_id', locationId)
      .eq('user_id', userId)
      .single();
      
    if (checkError && !checkError.message.includes('No rows found')) {
      throw checkError;
    }
    
    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('location_ratings')
        .update({
          rating,
          review
        })
        .eq('id', existingRating.id);
        
      if (error) throw error;
    } else {
      // Insert new rating
      const { error } = await supabase
        .from('location_ratings')
        .insert([
          {
            location_id: locationId,
            user_id: userId,
            rating,
            review
          }
        ]);
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error rating location:', error);
    throw error;
  }
};

// Generate mock locations for fallback
export const generateMockLocations = (): Location[] => {
  return [
    {
      id: '1',
      name: 'Mariuko Sodyba',
      description: 'Graži sodyba prie ežero su pirtimi ir žvejybos galimybėmis.',
      latitude: 54.8985,
      longitude: 23.9036,
      categories: ['rental', 'fishing', 'camping', 'ad'],
      is_public: true,
      is_paid: true,
      images: [
        'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
      ],
      main_image_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true,
      weather_data: {
        temp: -1,
        humidity: 70,
        windSpeed: 3,
        description: 'Šalta ir giedra',
        icon: '01d'
      }
    },
    {
      id: '2',
      name: 'Žvejybos vieta Kauno mariose',
      description: 'Populiari žvejybos vieta su geru priėjimu prie vandens.',
      latitude: 54.8679,
      longitude: 24.0691,
      categories: ['fishing', 'swimming'],
      is_public: true,
      is_paid: false,
      images: [
        'https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
      ],
      main_image_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true,
      weather_data: {
        temp: 3,
        humidity: 65,
        windSpeed: 5,
        description: 'Vėsu',
        icon: '02d'
      }
    },
    {
      id: '3',
      name: 'Stovyklavietė prie Platelių ežero',
      description: 'Graži stovyklavietė su laužavietėmis ir WC.',
      latitude: 56.0425,
      longitude: 21.8950,
      categories: ['camping', 'bonfire', 'picnic'],
      is_public: true,
      is_paid: true,
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
      ],
      main_image_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true,
      weather_data: {
        temp: 2,
        humidity: 75,
        windSpeed: 4,
        description: 'Vėsu',
        icon: '03d'
      }
    }
  ];
};