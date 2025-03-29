export * from './map';
export * from './location';
export * from './user';

// Define types here in case they're not properly exported from the modules above
export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  categories: string[];
  is_public: boolean;
  is_paid: boolean;
  images?: string[];
  main_image_index?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_approved?: boolean;
  rating?: number;
  ratings_count?: number;
  weather_data?: any;
}

export type UserRole = 'user' | 'renter' | 'moderator' | 'admin';

export interface LocationComment {
  id: string;
  location_id: string;
  user_id: string;
  username?: string;
  content: string;
  images?: string[];
  created_at: string;
}

export interface LocationRating {
  id: string;
  location_id: string;
  user_id: string;
  username?: string;
  rating: number;
  review?: string;
  created_at: string;
}

export type LocationCategory = string;