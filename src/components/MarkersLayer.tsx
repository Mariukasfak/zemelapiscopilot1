import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Location, MapLayer } from '../types';
import { DivIcon } from 'leaflet';

interface MarkersLayerProps {
  locations: Location[];
  layers: MapLayer[];
  onMarkerClick: (location: Location) => void;
  onMarkerContextMenu: (location: Location, event: React.MouseEvent) => void;
}

// Create a custom category icon
const createCategoryIcon = (category: string, color: string, isAd = false) => {
  // Create a custom HTML icon
  const iconHtml = `
    <div class="map-pin-container" style="position: relative; width: 30px; height: 40px;">
      <div class="map-pin-icon ${isAd ? 'bg-purple-500 animate-pulse' : `bg-${color}-500`}" style="position: absolute; top: 0; left: 0; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
        ${getCategoryIconSvg(category)}
      </div>
      <div class="map-pin-pointer" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid ${isAd ? '#a855f7' : `var(--tw-bg-opacity-${color}-500)`};"></div>
    </div>
  `;

  return new DivIcon({
    html: iconHtml,
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40]
  });
};

// Get SVG for category icon
const getCategoryIconSvg = (category: string) => {
  switch (category) {
    case 'fishing': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16.5a9 9 0 1 0-9 9 9 9 0 0 0 9-9Z"/><path d="M13 16.5a4 4 0 1 0-4 4 4 4 0 0 0 4-4Z"/><path d="M3 9.5V4.25C3 3.56 3.56 3 4.25 3h4.5C9.44 3 10 3.56 10 4.25V8"/><path d="m7 15 3-3"/><path d="M19.5 8.5c.5-1 .5-2 .5-3 0-2.5-2-3-3-3s-2.5.5-3 3c0 1 0 2 .5 3"/><path d="M17 5.5v3"/></svg>';
    case 'swimming': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M2 16h20"/><path d="M2 20h20"/><path d="M4 8h10"/><path d="M14 4h2"/><path d="M14 8c0-2.5 2-4 4-4"/></svg>';
    case 'camping': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20 10 4"/><path d="m5 20 9-16"/><path d="M3 20h18"/><path d="m12 15-3 5"/><path d="m12 15 3 5"/></svg>';
    // ... and so on for other categories
    default: return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
};

// Get category emoji
const getCategoryEmoji = (category: string): string => {
  switch(category) {
    case 'fishing': return '🎣';
    case 'swimming': return '🏊';
    case 'camping': return '⛺';
    case 'rental': return '🏠';
    case 'paid': return '💰';
    case 'private': return '🔒';
    case 'bonfire': return '🔥';
    case 'playground': return '🎮';
    case 'picnic': return '🍽️';
    case 'campsite': return '🏕️';
    case 'extreme': return '🏂';
    case 'ad': return '📢';
    default: return '📍';
  }
};

const MarkersLayer: React.FC<MarkersLayerProps> = ({ 
  locations, 
  layers, 
  onMarkerClick, 
  onMarkerContextMenu 
}) => {
  // Get icon for location based on its primary category
  const getLocationIcon = (location: Location) => {
    // Safety check for categories
    const categories = location.categories || [];
    
    // Check if it's an ad first
    if (categories.includes('ad')) {
      return createCategoryIcon('ad', 'purple', true);
    }
    
    // Find the first active category
    const primaryCategory = categories.find(category => 
      layers.some(layer => layer.isActive && layer.category === category)
    ) || categories[0];
    
    // Find the layer for this category
    const layer = layers.find(layer => layer.category === primaryCategory);
    
    return layer ? createCategoryIcon(primaryCategory, layer.color) : null;
  };

  // Generate popup content
  const createPopupContent = (location: Location) => {
    let popupContent = '<div class="p-0 leaflet-popup-modern">';
    
    // Image section
    popupContent += '<div class="relative h-32 bg-gray-100">';
    
    if (location.images && location.images.length > 0) {
      // Photo
      popupContent += '<img src="' + location.images[location.main_image_index || 0] + 
                    '" alt="' + location.name + '" class="w-full h-full object-cover" />';
      
      // Paid badge
      if (location.is_paid) {
        popupContent += '<div class="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-md font-medium">' +
                      'Mokama</div>';
      }
      
      // Ad badge
      if (location.categories && location.categories.includes('ad')) {
        popupContent += '<div class="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-md font-medium animate-pulse">' +
                      'Reklama</div>';
      }
    } else {
      // If no image, show location icon
      popupContent += '<div class="w-full h-full flex items-center justify-center text-gray-400">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" ' +
                    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>' +
                    '<circle cx="12" cy="10" r="3"/></svg></div>';
    }
    
    // Name
    popupContent += '<h3 class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 text-sm font-medium">' +
                  location.name + '</h3>';
    
    popupContent += '</div>'; // End upper section
    
    // Lower section with info and button
    popupContent += '<div class="p-2">';
    
    // Categories
    popupContent += '<div class="flex flex-wrap gap-1 mb-2">';
    if (location.categories && location.categories.length > 0) {
      location.categories.forEach(category => {
        popupContent += '<span class="inline-flex items-center text-xs px-1 py-0.5 rounded-full bg-blue-50 text-blue-700">' +
                    getCategoryEmoji(category) + ' ' + category + '</span>';
      });
    }
    popupContent += '</div>';
    
    // Rating
    if ((location.rating !== undefined && location.rating > 0) || 
        (location.ratings_count && location.ratings_count > 0)) {
      popupContent += '<div class="flex items-center text-yellow-500 text-sm mb-2">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" ' +
                    'stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mr-1">' +
                    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
                    (location.rating !== undefined ? Number(location.rating).toFixed(1) : '0') +
                    (location.ratings_count ? ' (' + location.ratings_count + ')' : '') +
                    '</div>';
    } else {
      popupContent += '<div class="flex items-center text-gray-400 text-xs mb-2">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" ' +
                    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">' +
                    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
                    'Nėra įvertinimų</div>';
    }
    
    // Weather data
    if (location.weather_data) {
      popupContent += '<div class="bg-blue-50 rounded-md p-1 mb-1 flex justify-between">' +
                    '<div class="text-center"><div class="text-md font-semibold text-blue-700">' +
                    location.weather_data.temp + '°C</div></div>' +
                    '<div class="flex flex-col text-xs text-blue-700">' +
                    '<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" ' +
                    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">' +
                    '<path d="M12 3v16M4 13h16"></path></svg>' +
                    location.weather_data.humidity + '%</div>' +
                    '<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" ' +
                    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">' +
                    '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>' +
                    location.weather_data.windSpeed + ' m/s</div></div></div>';
    }
    
    // Button
    popupContent += '<button ' +
                  'onclick="document.dispatchEvent(new CustomEvent(\'openLocationDetails\', {detail: {id: \'' + location.id + '\'}}));" ' +
                  'class="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
                  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">' +
                  '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
                  '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
                  'Daugiau informacijos</button>';
    
    popupContent += '</div>'; // End lower section
    popupContent += '</div>'; // End popup
    
    return popupContent;
  };

  return (
    <>
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        const icon = getLocationIcon(location);
        if (!icon) return null;
        
        return (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(location),
              contextmenu: (e: any) => {
                // Ensure we're getting the original event
                const originalEvent = e.originalEvent || e;
                if (originalEvent) {
                  // Prevent the default context menu
                  if (originalEvent.preventDefault) {
                    originalEvent.preventDefault();
                  }
                  onMarkerContextMenu(location, originalEvent);
                }
              }
            }}
          >
            <Popup 
              className="enhanced-popup"
              minWidth={200}
              maxWidth={280}
              closeButton={true}
              autoPan={false}
            >
              <div dangerouslySetInnerHTML={{ __html: createPopupContent(location) }} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default MarkersLayer;
