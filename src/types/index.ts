export * from './map';
export * from './location';
export * from './user';

export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  categories: LocationCategory[];
  images?: string[];
  is_public: boolean;
  is_paid: boolean;
  main_image_index?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;  // Pridėta savybė
  website?: string;
  image?: string;
  rating?: number;      // Pridėta savybė
  ratings_count?: number; // Pridėta savybė
  is_approved?: boolean;  // Pridėta savybė
  weather_data?: any;    // Pridėta savybė
}

export type LocationCategory = string;