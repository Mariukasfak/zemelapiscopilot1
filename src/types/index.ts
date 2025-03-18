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
  website?: string;
  image?: string;
}

export type LocationCategory = string;