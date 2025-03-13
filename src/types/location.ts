import { WeatherData } from './map';

/**
 * Location categories
 */
export type LocationCategory =
  | 'fishing'
  | 'swimming'
  | 'camping'
  | 'rental'
  | 'paid'
  | 'private'
  | 'bonfire'
  | 'playground'
  | 'picnic'
  | 'campsite'
  | 'extreme'
  | 'ad';

/**
 * Location entity
 */
export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  categories: LocationCategory[];
  is_public: boolean;
  is_paid: boolean;
  images?: string[];
  main_image_index?: number;
  created_at: string;
  updated_at: string;
  is_approved: boolean;
  user_id?: string;
  rating?: number;
  ratings_count?: number;
  weather_data?: WeatherData;
}

/**
 * Comment on a location
 */
export interface LocationComment {
  id: string;
  location_id: string;
  user_id: string;
  username?: string;
  content: string;
  images?: string[];
  created_at: string;
}

/**
 * Rating for a location
 */
export interface LocationRating {
  id: string;
  location_id: string;
  user_id: string;
  username?: string;
  rating: number;
  review?: string;
  created_at: string;
}
