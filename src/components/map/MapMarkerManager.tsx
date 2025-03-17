import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { Location, MapLayer } from '../../types';
import { getLocationIcon, getCategoryIconsHtml } from '../../utils/MapUtils';

interface MapMarkerManagerProps {
  locations: Location[];
  layers: MapLayer[];
  onLocationClick: (location: Location) => void;
  onLocationContextMenu: (location: Location, event: any) => void;
}

const MapMarkerManager: React.FC<MapMarkerManagerProps> = ({
  locations,
  layers,
  onLocationClick,
  onLocationContextMenu
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;
    
    console.log('Creating markers for', locations.length, 'locations');
    
    // Create marker cluster group
    // @ts-ignore
    const markers = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16
    });
    
    // Add markers to cluster
    locations.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: getLocationIcon(location, layers)
      });
      
      // Add event listeners
      marker.on('click', () => {
        console.log("Marker clicked:", location.name);
        
        // Sukuriame popupo turinį
        let popupContent = '<div class="p-1">';
        
        // Pavadinimas su reklamos žyme
        popupContent += '<h3 class="font-medium text-base">' + location.name;
        if (location.categories && location.categories.includes('ad')) {
          popupContent += '<span class="ml-1 text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded-full">Reklama</span>';
        }
        popupContent += '</h3>';
        
        // Kategorijos ikonos
        popupContent += '<div class="flex flex-wrap gap-1 mt-1 category-icons" id="category-icons-' + location.id + '">' +
                       getCategoryIconsHtml(location) + '</div>';
        
        // Nuotraukos
        if (location.images && location.images.length > 0) {
          popupContent += '<div class="mt-2"><img src="' + location.images[location.main_image_index || 0] + 
                         '" alt="' + location.name + '" class="w-full h-24 object-cover rounded" /></div>';
        }
        
        // Reitingai
        if ((location.rating !== undefined && location.rating > 0) || (location.ratings_count && location.ratings_count > 0)) {
          popupContent += '<div class="flex items-center text-yellow-500 text-sm mt-1">' +
                         '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
                         (location.rating !== undefined ? Number(location.rating).toFixed(1) : '0') + '</div>';
        } else {
          popupContent += '<div class="flex items-center text-gray-400 text-xs mt-1">' +
                         '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
                         'Nėra įvertinimų</div>';
        }
        
        // Orai
        if (location.weather_data) {
          popupContent += '<div class="flex items-center text-sm mt-1 text-gray-600">' +
                         '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path></svg>' +
                         location.weather_data.temp + '°C</div>';
        }
        
        // Mygtukas
        popupContent += '<div class="flex space-x-2 mt-2">' +
                       '<button onclick="document.dispatchEvent(new CustomEvent(\'openLocationDetails\', {detail: {id: \'' + location.id + '\'}}))" ' +
                       'class="bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600">' +
                       'Daugiau informacijos</button></div>';
        
        popupContent += '</div>'; // Uždarome pagrindinį div
        
        // Create popup
        const popup = L.popup({
          offset: [0, -5],
          closeButton: true,
          className: 'location-popup-original',
          minWidth: 150,
          maxWidth: 200,
          autoClose: false
        }).setContent(popupContent);
        
        marker.bindPopup(popup).openPopup();
      });
      
      // Add context menu event
      marker.on('contextmenu', (e: any) => {
        onLocationContextMenu(location, e.originalEvent);
      });
      
      // Add marker to cluster
      markers.addLayer(marker);
    });
    
    // Add cluster to map
    map.addLayer(markers);
    
    // Cleanup when component unmounts
    return () => {
      map.removeLayer(markers);
    };
  }, [locations, map, layers, onLocationClick, onLocationContextMenu]);

  return null;
};

export default MapMarkerManager;
