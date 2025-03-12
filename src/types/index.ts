export type LocationCategory = 
  | 'fishing'
  | 'swimming'
  | 'camping'
  | 'rental'
  | 'paid'
  | 'free'
  | 'private'
  | 'public'
  | 'bonfire'
  | 'playground'
  | 'picnic'
  | 'campsite'
  | 'extreme'
  | 'ad';

export interface Location {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  categories: LocationCategory[];
  is_public: boolean;
  is_paid: boolean;
  images: string[];
  main_image_index?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  rating?: number;
  is_approved?: boolean;
  weather_data?: WeatherData;
}

export interface MapLayer {
  id: string;
  name: string;
  category: LocationCategory;
  isActive: boolean;
  color: string;
  icon: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  favorite_locations: string[];
  role?: UserRole;
}

export type UserRole = 'admin' | 'moderator' | 'user' | 'renter';

// Patikrinkite, ar šis tipas jau egzistuoja jūsų src/types/index.ts faile,
// jei ne - pridėkite jį arba atnaujinkite esantį:

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  date?: string;  // naudojama orų prognozei, nebūtinas einamųjų orų atveju
  lastUpdated?: string;  // paskutinio atnaujinimo laikas
}

export interface LocationRating {
  id: string;
  location_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
  username?: string;
}

export interface LocationComment {
  id: string;
  location_id: string;
  user_id: string;
  content: string;
  images: string[];
  created_at: string;
  updated_at: string;
  username?: string;
}