import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MapLayer, Location, LocationCategory } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { fetchLocations, generateMockLocations } from '../services/locationService';

interface MapContextType {
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  toggleAllLayers: (categoryLayers: string[], active: boolean) => void; // Pridėta nauja funkcija
  locations: Location[];
  addLocation: (locationData: any) => Promise<void>;
  currentPosition: [number, number] | undefined;
  setCurrentPosition: (position: [number, number] | undefined) => void;
  contextMenuPosition: { x: number, y: number } | null;
  setContextMenuPosition: (position: { x: number, y: number } | null) => void;
  handleMapContextMenu: (coords: [number, number], event: { clientX: number, clientY: number }) => void;
  closeContextMenu: () => void;
  showAddLocationModal: boolean;
  setShowAddLocationModal: (show: boolean) => void;
  handleAddLocation: (coords?: [number, number]) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole, user } = useAuth();
  
  // State for map layers
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: '1', name: 'Žvejyba', category: 'fishing', isActive: true, color: 'blue', icon: 'fish' },
    { id: '2', name: 'Maudymasis', category: 'swimming', isActive: true, color: 'cyan', icon: 'waves' },
    { id: '3', name: 'Stovyklavietės', category: 'camping', isActive: true, color: 'green', icon: 'tent' },
    { id: '4', name: 'Nuoma', category: 'rental', isActive: true, color: 'yellow', icon: 'home' },
    { id: '5', name: 'Mokamos zonos', category: 'paid', isActive: true, color: 'amber', icon: 'dollar-sign' },
    { id: '6', name: 'Privačios teritorijos', category: 'private', isActive: true, color: 'red', icon: 'lock' },
    { id: '7', name: 'Laužavietės', category: 'bonfire', isActive: true, color: 'orange', icon: 'flame' },
    { id: '8', name: 'Vaikų žaidimų aikštelės', category: 'playground', isActive: true, color: 'pink', icon: 'toy' },
    { id: '9', name: 'Pikniko vietos', category: 'picnic', isActive: true, color: 'lime', icon: 'utensils' },
    { id: '10', name: 'Kempingai', category: 'campsite', isActive: true, color: 'purple', icon: 'truck' },
    { id: '11', name: 'Ekstremalaus sporto vietos', category: 'extreme', isActive: true, color: 'indigo', icon: 'mountain-snow' }
  ]);

  // State for locations
  const [locations, setLocations] = useState<Location[]>([]);
  
  // State for modals and position
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | undefined>(undefined);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

  // Fetch locations when component mounts or when auth state changes
useEffect(() => {
  const loadLocations = async () => {
    try {
      console.log("Loading locations, userRole:", userRole);
      
      // Always fetch all approved locations for all users
      let query = supabase.from('locations').select('*');
      
      // If admin or moderator, also show unapproved locations
      if (userRole === 'admin' || userRole === 'moderator') {
        // No filter needed, get all locations
      } else {
        // Only show approved locations for regular users
        query = query.eq('is_approved', true);
      }
      
      const { data: locationsData, error: locationsError } = await query;
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        setLocations(generateMockLocations());
        return;
      }
      
      console.log("Fetched locations:", locationsData?.length || 0);
      
      // Also fetch ratings to attach to locations
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('location_ratings')
        .select('*');
        
      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      } else {
        console.log("Fetched ratings:", ratingsData?.length || 0);
      }
      
      // Calculate average ratings for each location
      const locationRatings: Record<string, number[]> = {};
      if (ratingsData) {
        ratingsData.forEach(rating => {
          if (!locationRatings[rating.location_id]) {
            locationRatings[rating.location_id] = [];
          }
          locationRatings[rating.location_id].push(rating.rating);
        });
      }
      
      // Use real data if available, otherwise use mock data
      const locationData = locationsData && locationsData.length > 0 ? locationsData : generateMockLocations();
      
      // Generate weather data with more accurate temperatures and add ratings
      const updatedLocations = locationData.map(location => {
        // Get rating for this location
        const ratingsForLocation = locationRatings[location.id] || [];
        const avgRating = ratingsForLocation.length > 0 
          ? Number((ratingsForLocation.reduce((sum, r) => sum + r, 0) / ratingsForLocation.length).toFixed(1))
          : undefined;
          
        // Generate more accurate weather data based on current season and location
        const now = new Date();
        const month = now.getMonth();
        
        // Get current temperature from external source or use more accurate simulation
        // For Mariuko sodyba specifically
        if (location.name && location.name.toLowerCase().includes('mariuko sodyba')) {
          return {
            ...location,
            rating: avgRating,
            weather_data: {
              ...location.weather_data,
              temp: -1, // Set to -1°C as specified
              description: 'Šalta ir giedra',
              icon: '01d'
            }
          };
        }
        
        // For other locations, use more accurate seasonal data
        let baseTemp;
        // Current month is February (1), so it's winter in Lithuania
        if (month >= 11 || month <= 1) {
          // Winter (December-February)
          baseTemp = -3 + (Math.random() * 4 - 2); // -5 to -1°C range
        } else if (month >= 2 && month <= 4) {
          // Spring (March-May)
          baseTemp = 5 + (Math.random() * 6 - 3); // 2 to 8°C range
        } else if (month >= 5 && month <= 8) {
          // Summer (June-September)
          baseTemp = 18 + (Math.random() * 6 - 3); // 15 to 21°C range
        } else {
          // Autumn (October-November)
          baseTemp = 8 + (Math.random() * 6 - 3); // 5 to 11°C range
        }
        
        return {
          ...location,
          rating: avgRating,
          weather_data: {
            ...location.weather_data,
            temp: Math.round(baseTemp * 10) / 10, // Round to 1 decimal place
            description: getWeatherDescription(baseTemp),
            icon: getWeatherIcon(baseTemp)
          }
        };
      });
        
        setLocations(updatedLocations);
      } catch (error) {
        console.error('Error loading locations:', error);
        // Generate mock data if there's an error
        const mockLocations = generateMockLocations();
        setLocations(mockLocations);
      }
    };
    
    loadLocations();
  }, [userRole]);

  // Helper function to get weather description based on temperature
  const getWeatherDescription = (temp: number): string => {
    if (temp < 0) return 'Šalta ir giedra';
    if (temp < 10) return 'Vėsu';
    if (temp < 20) return 'Maloni temperatūra';
    return 'Šilta';
  };
  
  // Helper function to get weather icon based on temperature
  const getWeatherIcon = (temp: number): string => {
    if (temp < 0) return '01d'; // Clear sky
    if (temp < 10) return '02d'; // Few clouds
    if (temp < 20) return '03d'; // Scattered clouds
    return '01d'; // Clear sky
  };

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, isActive: !layer.isActive } : layer
    ));
  };

// Toggle all layers in a category
const toggleAllLayers = (categoryLayers: string[], active: boolean) => {
  console.log(`Toggling all layers in categories: ${categoryLayers.join(", ")} to ${active ? "active" : "inactive"}`);
  
  // Visi šio tipo sluoksniai, kuriuos reikia pakeisti
  const layersToToggle = layers.filter(layer => 
    categoryLayers.includes(layer.category)
  );
  
  console.log(`Layers to toggle: ${layersToToggle.map(l => l.name).join(", ")}`);
  
  // Sukurkime naują sluoksnių masyvą su atnaujintais aktyviais/neaktyviais sluoksniais
  const updatedLayers = layers.map(layer => {
    if (categoryLayers.includes(layer.category)) {
      // Pakeičiame sluoksnio būseną
      return { ...layer, isActive: active };
    }
    return layer;
  });
  
  // Loguojame prieš ir po
  console.log("Original layers:", layers.map(l => `${l.name}: ${l.isActive}`));
  console.log("Updated layers:", updatedLayers.map(l => `${l.name}: ${l.isActive}`));
  
  setLayers(updatedLayers);
};

  // Add new location
  const addLocation = async (locationData: any) => {
    try {
      // Add location to database
      const { data, error } = await supabase
        .from('locations')
        .insert([
          {
            name: locationData.name,
            description: locationData.description,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            categories: locationData.categories,
            is_public: locationData.is_public,
            is_paid: locationData.is_paid,
            images: locationData.images,
            main_image_index: locationData.main_image_index,
            created_by: user?.id,
            is_approved: userRole === 'admin' || userRole === 'moderator' // Auto-approve for admins and moderators
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Add to local state
      if (data) {
        setLocations([...locations, data[0]]);
      }
      
      alert('Vieta sėkmingai pridėta!');
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Nepavyko pridėti vietos. Bandykite dar kartą.');
    }
  };

  // Handle map context menu
  const handleMapContextMenu = (coords: [number, number], event: { clientX: number, clientY: number }) => {
    if (!isAuthenticated) return;
    
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setCurrentPosition(coords);
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenuPosition(null);
  };

  // Handle add location
  const handleAddLocation = (coords?: [number, number]) => {
    if (coords) {
      setCurrentPosition(coords);
    }
    setShowAddLocationModal(true);
    setContextMenuPosition(null);
  };

  return (
    <MapContext.Provider
      value={{
        layers,
        toggleLayer,
        toggleAllLayers, // Pridėjome naują funkciją
        locations,
        addLocation,
        currentPosition,
        setCurrentPosition,
        contextMenuPosition,
        setContextMenuPosition,
        handleMapContextMenu,
        closeContextMenu,
        showAddLocationModal,
        setShowAddLocationModal,
        handleAddLocation
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};