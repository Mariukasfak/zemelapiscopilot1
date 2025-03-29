import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { Location, MapLayer } from '../../types';
import { getLocationIcon } from '../../utils/MapUtils';

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

  const createPopupContent = (location: Location) => {
    let popupContent = '<div class="location-card">';
    
    // Nuotrauka
    if (location.images && location.images.length > 0) {
      popupContent += `<img src="${location.images[location.main_image_index || 0]}" 
                          alt="${location.name}" 
                          class="location-card-image" />`;
    } else {
      popupContent += `<div class="location-card-image-placeholder"></div>`;
    }
    
    popupContent += '<div class="location-card-content">';
    
    // Pavadinimas
    popupContent += `<div class="location-card-title">${location.name}</div>`;
    
    // Aprašymas - trumpas
    const shortDesc = location.description ? 
      (location.description.length > 80 ? location.description.substring(0, 80) + '...' : location.description) : 
      'Vandens kokybė: gera';
    
    popupContent += `<div class="text-sm">${shortDesc}</div>`;
    
    // Statistika
    popupContent += '<div class="location-card-stats">';
    
    // Temperatūra
    const temp = location.weather_data ? `${location.weather_data.temp}°C` : "N/A";
    popupContent += `
      <div class="location-card-stat">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
        </svg>
        ${temp}
      </div>`;
      
    // Atstumas - dinamiškas
    popupContent += `
      <div class="location-card-stat">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span class="distance-placeholder">Skaičiuojama...</span>
      </div>`;
    
    popupContent += '</div>'; // Uždarome stats
    
    // Mygtukas
    popupContent += `
      <button 
        onclick="document.dispatchEvent(new CustomEvent('openLocationDetails', {detail: {id: '${location.id}'}}))" 
        class="bg-[var(--color-nature-green)] text-white text-xs py-1 px-3 rounded-md mt-2 w-full">
        Daugiau informacijos
      </button>`;
      
    popupContent += '</div>'; // Uždarome content
    popupContent += '</div>'; // Uždarome location-card
    
    // Add distance calculation script
    popupContent += `
      <script>
        document.addEventListener('userPositionChanged', function(e) {
          if (e.detail && e.detail.position) {
            const userLat = e.detail.position[0];
            const userLng = e.detail.position[1]; 
            const locLat = ${location.latitude};
            const locLng = ${location.longitude};
            
            // Atstumo skaičiavimo funkcija
            function calculateDistance(lat1, lon1, lat2, lon2) {
              const R = 6371; // Žemės spindulys km
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              return Math.round(R * c);
            }
            
            const distance = calculateDistance(userLat, userLng, locLat, locLng);
            const elements = document.querySelectorAll('.distance-placeholder');
            elements.forEach(el => {
              el.textContent = distance + ' km';
            });
          }
        });
      </script>
    `;
    
    popupContent += '</div>'; // Uždarome location-card
    
    return popupContent;
  };

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
        
        // Create popup
        const popup = L.popup({
          offset: [0, -5],
          closeButton: true,
          className: 'location-popup-original',
          minWidth: 150,
          maxWidth: 200,
          autoClose: false
        }).setContent(createPopupContent(location));
        
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
