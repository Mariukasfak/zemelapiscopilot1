import { Location, LocationComment, LocationRating, UserRole } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Create a new location
 * @param locationData - The location data to create
 * @param userId - The user ID creating the location
 */
export const createLocation = async (locationData: Partial<Location>, userId: string): Promise<Location> => {
  try {
    // Set default values for new location
    const newLocation = {
      ...locationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
      is_approved: false, // New locations need approval by default
      rating: 0,
      ratings_count: 0
    };
    
    const { data, error } = await supabase
      .from('locations')
      .insert([newLocation])
      .select()
      .single();
      
    if (error) throw error;
    
    return data as Location;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

/**
 * Update an existing location
 * @param locationId - The ID of the location to update
 * @param locationData - The location data to update
 * @param userId - The user ID updating the location
 * @param userRole - The role of the user making the update
 */
export const updateLocation = async (
  locationId: string, 
  locationData: Partial<Location>, 
  userId: string,
  userRole: string
): Promise<Location> => {
  try {
    // Check permissions - only creators, admins, and moderators can edit
    if (userRole !== 'admin' && userRole !== 'moderator') {
      const { data: existingLocation, error: fetchError } = await supabase
        .from('locations')
        .select('user_id')
        .eq('id', locationId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (existingLocation.user_id !== userId) {
        throw new Error('You do not have permission to edit this location');
      }
    }
    
    // Update location
    const { data, error } = await supabase
      .from('locations')
      .update({
        ...locationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data as Location;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

/**
 * Delete a location
 * @param locationId - The ID of the location to delete
 * @param userId - The user ID deleting the location 
 * @param userRole - The role of the user making the deletion
 */
export const deleteLocation = async (
  locationId: string, 
  userId: string,
  userRole: string
): Promise<void> => {
  try {
    // Check permissions - only creators, admins, and moderators can delete
    if (userRole !== 'admin' && userRole !== 'moderator') {
      const { data: existingLocation, error: fetchError } = await supabase
        .from('locations')
        .select('user_id')
        .eq('id', locationId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (existingLocation.user_id !== userId) {
        throw new Error('You do not have permission to delete this location');
      }
    }
    
    // Delete location
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

/**
 * Approve a location
 * @param locationId - The ID of the location to approve
 * @param userRole - The role of the user approving the location
 */
export const approveLocation = async (locationId: string, userRole: string): Promise<void> => {
  try {
    // Only admins and moderators can approve locations
    if (userRole !== 'admin' && userRole !== 'moderator') {
      throw new Error('You do not have permission to approve locations');
    }
    
    const { error } = await supabase
      .from('locations')
      .update({ is_approved: true })
      .eq('id', locationId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error approving location:', error);
    throw error;
  }
};

/**
 * Fetch comments for a location
 * @param locationId - The location ID to fetch comments for
 */
export const fetchLocationComments = async (locationId: string): Promise<LocationComment[]> => {
  try {
    const { data, error } = await supabase
      .from('location_comments')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data as LocationComment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Add a comment to a location
 * @param locationId - The location ID to add comment to
 * @param userId - The user ID adding the comment
 * @param content - The comment text
 * @param images - Optional array of image URLs
 */
export const addLocationComment = async (
  locationId: string, 
  userId: string, 
  content: string,
  images: string[] = []
): Promise<LocationComment> => {
  try {
    const { data, error } = await supabase
      .from('location_comments')
      .insert([
        {
          location_id: locationId,
          user_id: userId,
          content,
          images,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    return data as LocationComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Fetch ratings for a location
 * @param locationId - The location ID to fetch ratings for
 */
export const fetchLocationRatings = async (locationId: string): Promise<LocationRating[]> => {
  try {
    const { data, error } = await supabase
      .from('location_ratings')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data as LocationRating[];
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
};

/**
 * Rate a location
 * @param locationId - The location ID to rate
 * @param userId - The user ID adding the rating
 * @param rating - The rating value (1-5)
 * @param review - Optional review text
 */
export const rateLocation = async (
  locationId: string, 
  userId: string, 
  rating: number,
  review: string = ''
): Promise<LocationRating> => {
  try {
    // Check if user already rated this location
    const { data: existingRating, error: fetchError } = await supabase
      .from('location_ratings')
      .select('*')
      .eq('location_id', locationId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    let result;
    
    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('location_ratings')
        .update({
          rating,
          review,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('location_ratings')
        .insert([
          {
            location_id: locationId,
            user_id: userId,
            rating,
            review,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }
    
    // Update location average rating
    await updateLocationAverageRating(locationId);
    
    return result as LocationRating;
  } catch (error) {
    console.error('Error rating location:', error);
    throw error;
  }
};

// Function moved to avoid duplication - implementation is at the bottom of the file

/**
 * Fetch locations with optional filters
 * @param userRole - The user's role for permission checks
 */
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

/**
 * Add new location to database
 * @param locationData - The location data to add
 * @param userRole - User role to determine if location is auto-approved
 */
export const addLocation = async (locationData: any, userRole: UserRole) => {
  try {
    // Ensure locationData has valid structure
    const sanitizedData = {
      ...locationData,
      categories: Array.isArray(locationData.categories) ? locationData.categories : [],
      images: Array.isArray(locationData.images) ? locationData.images : [],
      created_by: (await supabase.auth.getUser()).data.user?.id,
      is_approved: userRole === 'admin' || userRole === 'moderator', // Auto-approve for admins and moderators
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

/**
 * Update location in database
 * @param location - The location data to update
 */
export const updateLocationDetails = async (location: Location) => {
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
        images: location.images,
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

/**
 * Delete location from database
 * @param locationId - The ID of the location to delete
 */
export const removeLocation = async (locationId: string) => {
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

/**
 * Approve location in database
 * @param locationId - The ID of the location to approve
 */
export const approveLocationById = async (locationId: string) => {
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

/**
 * Fetch comments for a location (alternative implementation)
 * @param locationId - The location ID to fetch comments for
 */
export const getLocationComments = async (locationId: string) => {
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

/**
 * Add a comment to a location (simplified version)
 * @param locationId - The location ID to add comment to
 * @param content - The comment content
 * @param userId - The user ID adding the comment
 */
export const addSimpleLocationComment = async (locationId: string, content: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('location_comments')
      .insert([
        {
          location_id: locationId,
          user_id: userId,
          content,
          images: [],
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Fetch ratings for a location (alternative implementation)
 * @param locationId - The location ID to fetch ratings for
 */
export const getLocationRatings = async (locationId: string) => {
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

/**
 * Rate a location or update an existing rating
 * @param locationId - The location ID to rate
 * @param userId - The user ID giving the rating
 * @param rating - The rating value (1-5)
 * @param review - Optional review text
 */
export const updateLocationRating = async (locationId: string, userId: string, rating: number, review?: string) => {
  try {
    // Check if user has already rated this location
    const { data: existingRating, error: checkError } = await supabase
      .from('location_ratings')
      .select('id')
      .eq('location_id', locationId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError && !checkError.message?.includes('No rows found')) {
      throw checkError;
    }
    
    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('location_ratings')
        .update({
          rating,
          review,
          updated_at: new Date().toISOString()
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
            review,
            created_at: new Date().toISOString()
          }
        ]);
        
      if (error) throw error;
    }
    
    // Update location average rating
    await updateLocationAverageRating(locationId);
    
    return true;
  } catch (error) {
    console.error('Error rating location:', error);
    throw error;
  }
};

/**
 * Update the average rating for a location
 * @param locationId - The location ID to update rating for
 */
const updateLocationAverageRating = async (locationId: string): Promise<void> => {
  try {
    // Get all ratings for this location
    const { data: ratings, error } = await supabase
      .from('location_ratings')
      .select('rating')
      .eq('location_id', locationId);
    
    if (error) throw error;
    
    // Calculate average
    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    // Update location
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        rating: avgRating,
        ratings_count: ratings ? ratings.length : 0
      })
      .eq('id', locationId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating location average rating:', error);
    throw error;
  }
};

/**
 * Fetch locations by map bounds
 * @param bounds - The map bounds to fetch locations within
 * @param userRole - User role to filter locations by approval status
 */
export const fetchLocationsByBounds = async (
  bounds: { north: number; south: number; east: number; west: number },
  userRole: UserRole
): Promise<Location[]> => {
  try {
    console.log('Fetching locations by bounds:', bounds);
    
    // Create Supabase query with geographic filters
    let query = supabase.from('locations')
      .select('*')
      .gte('latitude', bounds.south)  // Latitude greater than or equal to south bound
      .lte('latitude', bounds.north)  // Latitude less than or equal to north bound
      .gte('longitude', bounds.west)  // Longitude greater than or equal to west bound
      .lte('longitude', bounds.east); // Longitude less than or equal to east bound
    
    // If not admin or moderator, only show approved locations
    if (userRole !== 'admin' && userRole !== 'moderator') {
      query = query.eq('is_approved', true);
    }
    
    // Set limit for efficiency
    query = query.limit(200);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching locations by bounds:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchLocationsByBounds:', error);
    return [];
  }
};

/**
 * Generate mock locations for fallback
 */
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

// Export aliases for backward compatibility
// export const removeLocationAlias = deleteLocation; // Use this if you need an alias