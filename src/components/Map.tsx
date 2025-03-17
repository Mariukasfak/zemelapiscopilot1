import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet.markercluster imports
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Custom hooks & components
import { useLocations } from '../hooks/useLocations';
import LocationMarker from './LocationMarker';
import MarkersLayer from './MarkersLayer';
import MapControls from './MapControls';
import LocationDetails from './LocationDetails';
import EditLocationModal from './EditLocationModal';

// Context
import { useMap as useMapContext } from '../context/MapContext';
import { useAuth } from '../context/AuthContext';

// Types
import { Location } from '../types';

// Map center coordinates (Lithuania)
const CENTER_POSITION: [number, number] = [54.8985, 23.9036];
const DEFAULT_ZOOM = 7;

// Component to handle map events
const MapEventHandler = () => {
  const { handleMapContextMenu, closeContextMenu } = useMapContext();
  useMapEvents({
    contextmenu: (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleMapContextMenu([lat, lng], { clientX: e.originalEvent.clientX, clientY: e.originalEvent.clientY });
    },
    click: () => {
      closeContextMenu();
    }
  });
  
  return null;
};

// Component to detect when map is ready
const MapReadyDetector = ({ onMapReady }: { onMapReady: () => void }) => {
  const map = useMap();
  
  useEffect(() => {
    // Map is ready when it's initialized
    if (map) {
      // Small delay to ensure all tiles are loaded
      setTimeout(() => {
        onMapReady();
      }, 500);
    }
  }, [map, onMapReady]);
  
  return null;
};

// MapBoundsListener component
const MapBoundsListener: React.FC<{ onBoundsChange: (bounds: any) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    };
    
    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChange]);
  
  return null;
};

const Map: React.FC = () => {
  const { userRole } = useAuth();
  const { layers, closeContextMenu } = useMapContext();
  
  // Use our custom locations hook
  const { locations, loading, fetchLocationsByBounds } = useLocations(userRole);
  
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'outdoors'>('streets');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPaidOnly, setShowPaidOnly] = useState<boolean>(false);
  const [locationContextMenu, setLocationContextMenu] = useState<{
    location: Location,
    x: number,
    y: number
  } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [filterRadius, setFilterRadius] = useState<number>(0);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);

  // Handle map bounds changes
  const handleBoundsChange = useCallback((bounds: any) => {
    setMapBounds(bounds);
  }, []);
  
  // Fetch locations when map bounds change
  useEffect(() => {
    if (!mapReady || !mapBounds) return;
    console.log('Map bounds changed:', mapBounds);
    
    fetchLocationsByBounds(mapBounds);
  }, [mapBounds, mapReady, fetchLocationsByBounds]);

  // Listen for map centering events
  useEffect(() => {
    const handleMapCenter = (event: any) => {
      const { lat, lng, zoom } = event.detail;
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], zoom);
      }
    };

    document.addEventListener('mapCenter', handleMapCenter);
    return () => document.removeEventListener('mapCenter', handleMapCenter);
  }, []);

  // Listen for user position changes
  useEffect(() => {
    const handleUserPositionChanged = (event: any) => {
      const { position } = event.detail;
      setUserPosition(position);
    };

    document.addEventListener('userPositionChanged', handleUserPositionChanged);
    return () => document.removeEventListener('userPositionChanged', handleUserPositionChanged);
  }, []);

  // Listen for filter radius changes
  useEffect(() => {
    const handleSetFilterRadius = (event: any) => {
      const { value } = event.detail;
      setFilterRadius(value);
    };

    document.addEventListener('setFilterRadius', handleSetFilterRadius);
    return () => document.removeEventListener('setFilterRadius', handleSetFilterRadius);
  }, []);

  // Listen for rating filter changes
  useEffect(() => {
    const handleSetFilterRating = (event: any) => {
      const { value } = event.detail;
      setMinRating(value);
    };

    document.addEventListener('setFilterRating', handleSetFilterRating);
    return () => document.removeEventListener('setFilterRating', handleSetFilterRating);
  }, []);

  // Listen for paid/free filter changes
  useEffect(() => {
    const handleSetFilterPaidStatus = (event: any) => {
      const { showFreeOnly, showPaidOnly } = event.detail;
      setShowFreeOnly(showFreeOnly);
      setShowPaidOnly(showPaidOnly);
    };

    document.addEventListener('setFilterPaidStatus', handleSetFilterPaidStatus);
    return () => document.removeEventListener('setFilterPaidStatus', handleSetFilterPaidStatus);
  }, []);

  // Listen for opening location details when button in popup is clicked
  useEffect(() => {
    const handleOpenLocationDetails = (event: any) => {
      const locationId = event.detail?.id;
      if (locationId) {
        const location = locations.find(loc => loc.id === locationId);
        if (location) {
          setSelectedLocation(location);
          setShowLocationDetails(true);
        }
      }
    };

    document.addEventListener('openLocationDetails', handleOpenLocationDetails);
    return () => document.removeEventListener('openLocationDetails', handleOpenLocationDetails);
  }, [locations]);

  // Function to center map on user's position
  const centerMapOnUser = useCallback((zoom: number = 14) => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, zoom);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], zoom);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Nepavyko nustatyti jūsų buvimo vietos. Patikrinkite lokacijos leidimus.');
        }
      );
    }
  }, [userPosition]);

  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter locations based on current filter settings
  const filteredLocations = useMemo(() => {
    console.time('locations-filter');
    
    const result = locations.filter(location => {
      // Safety check for null location objects
      if (!location || !location.latitude || !location.longitude) return false;
      
      // If location.categories doesn't exist, use empty array
      const categories = location.categories || [];
      
      // Filter by active layers
      const matchesLayer = categories.some(category => 
        layers.some(layer => layer.isActive && layer.category === category)
      );
      
      // Filter by minimum rating
      const matchesRating = 
        minRating === 0 || 
        (location.rating !== undefined && location.rating >= minRating);
      
      // Filter by paid/free status
      const matchesPaidStatus = 
        (!showPaidOnly && !showFreeOnly) || 
        (showPaidOnly && location.is_paid) || 
        (showFreeOnly && !location.is_paid);
      
      // Filter by distance from user
      let matchesDistance = true;
      if (filterRadius > 0 && userPosition) {
        const distance = calculateDistance(
          userPosition[0], userPosition[1], 
          location.latitude, location.longitude
        );
        matchesDistance = distance <= filterRadius;
      }
      
      return matchesLayer && matchesRating && matchesPaidStatus && matchesDistance;
    });
    
    console.timeEnd('locations-filter');
    return result;
  }, [
    locations, 
    layers, 
    minRating, 
    showFreeOnly, 
    showPaidOnly, 
    filterRadius, 
    userPosition
  ]);

  // Handle location click - only open popup, not full details
  const handleLocationClick = useCallback((location: Location) => {
    console.log("Location clicked:", location.name);
    // Don't set selected location or show details here
    // This will just allow the popup to show
  }, []);

  // Handle right-click on location
  const handleLocationContextMenu = useCallback((location: Location, event: any) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    setLocationContextMenu({
      location,
      x: event.clientX,
      y: event.clientY
    });
  }, [userRole]);

  // Handle edit location
  const handleEditLocation = useCallback((location: Location) => {
    setEditingLocation(location);
    setShowEditModal(true);
    setLocationContextMenu(null);
  }, []);

  // Toggle filter panel
  const toggleFilter = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  // Get tile layer URL based on map type
  const getTileLayerUrl = useCallback(() => {
    switch (mapType) {
      case 'satellite':
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'outdoors':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [mapType]);

  // Diagnostic function
  const logState = useCallback(() => {
    console.log("Current state:");
    console.log("- userPosition:", userPosition);
    console.log("- filterRadius:", filterRadius);
    console.log("- minRating:", minRating);
    console.log("- showFreeOnly:", showFreeOnly);
    console.log("- showPaidOnly:", showPaidOnly);
    console.log("- layers:", layers.map(l => `${l.name}: ${l.isActive}`).join(", "));
    console.log("- filteredLocations:", filteredLocations.length);
    console.log("- total locations:", locations.length);
  }, [userPosition, filterRadius, minRating, showFreeOnly, showPaidOnly, layers, filteredLocations, locations]);

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  return (
    <div className="h-full w-full relative">
      {loading && !mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-[150]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <MapContainer 
        center={CENTER_POSITION} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: 'calc(100% - 2px)', width: '100%', zIndex: 1 }}
        zoomControl={false}
        ref={mapRef}
        className="z-[1]"
      >
        <MapReadyDetector onMapReady={handleMapReady} />
        <MapBoundsListener onBoundsChange={handleBoundsChange} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileLayerUrl()}
        />
        <LocationMarker />
        <MapEventHandler />

        {/* Use MarkersLayer component instead of inline marker rendering */}
        <MarkersLayer 
          locations={filteredLocations}
          layers={layers}
          onMarkerClick={handleLocationClick}
          onMarkerContextMenu={handleLocationContextMenu}
        />
      </MapContainer>
      
      {/* Use MapControls component for all UI controls */}
      <MapControls 
        onCenterMap={centerMapOnUser}
        mapType={mapType}
        setMapType={setMapType}
        minRating={minRating}
        setMinRating={setMinRating}
        showFreeOnly={showFreeOnly}
        setShowFreeOnly={setShowFreeOnly}
        showPaidOnly={showPaidOnly}
        setShowPaidOnly={setShowPaidOnly}
        filterRadius={filterRadius}
        setFilterRadius={setFilterRadius}
        isFilterOpen={isFilterOpen}
        toggleFilter={toggleFilter}
        userRole={userRole}
        logState={logState}
      />
      
      {/* Location context menu */}
      {locationContextMenu && (
        <div 
          className="fixed bg-white rounded-md shadow-lg z-[1000] overflow-hidden"
          style={{ 
            left: `${locationContextMenu.x}px`, 
            top: `${locationContextMenu.y}px`, 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <button 
              className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
              onClick={() => handleEditLocation(locationContextMenu.location)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Redaguoti vietą
            </button>
            <button 
              className="px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
              onClick={() => {
                closeContextMenu();
                setLocationContextMenu(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Ištrinti vietą
            </button>
          </div>
        </div>
      )}
      
      {/* Location details modal */}
      {selectedLocation && (
        <LocationDetails 
          location={selectedLocation}
          isOpen={showLocationDetails}
          onClose={() => setShowLocationDetails(false)}
          userRole={userRole}
        />
      )}
      
      {/* Edit location modal */}
      {editingLocation && (
        <EditLocationModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditLocation}
          location={editingLocation}
        />
      )}
    </div>
  );
};

export default Map;