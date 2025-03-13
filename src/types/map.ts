/**
 * Map layer type representing categories shown on map
 */
export interface MapLayer {
  id: string;
  name: string;
  category: string;
  color: string;
  isActive: boolean;
}

/**
 * Map bounds for filtering locations by area
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Map type options
 */
export type MapType = 'streets' | 'satellite' | 'outdoors';

/**
 * Weather data for location
 */
export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}
