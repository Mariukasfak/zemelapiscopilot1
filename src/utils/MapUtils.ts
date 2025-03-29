import { Location, MapLayer } from '../types';
import { Icon, DivIcon } from 'leaflet';

// Create custom icon for location based on category
export const createCategoryIcon = (category: string, color: string) => {
  // Nustatome skirtingas spalvas pagal kategoriją
  let bgColor;
  switch (category) {
    case 'fishing': bgColor = '#4682B4'; break;
    case 'swimming': bgColor = '#6CA6CD'; break;
    case 'camping': bgColor = '#8B4513'; break;
    case 'campsite': bgColor = '#8B4513'; break;
    case 'bonfire': bgColor = '#FF8C00'; break;
    case 'picnic': bgColor = '#7FFF00'; break;
    case 'playground': bgColor = '#FF69B4'; break;
    case 'extreme': bgColor = '#9932CC'; break;
    case 'ad': bgColor = '#a855f7'; break;
    default: bgColor = color ? `#${color}` : '#697b61';
  }

  // Sukuriame HTML ikoną
  const iconHtml = `
    <div class="map-pin-container">
      <div class="map-pin-icon" style="width: 30px; height: 30px; border-radius: 50%; background-color: ${bgColor}; color: white; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white;">
        ${getCategoryIconSvg(category)}
      </div>
    </div>
  `;

  return new DivIcon({
    html: iconHtml,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Get SVG for category icon
export const getCategoryIconSvg = (category: string) => {
  switch (category) {
    case 'fishing': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16.5a9 9 0 1 0-9 9 9 9 0 0 0 9-9Z"/><path d="M13 16.5a4 4 0 1 0-4 4 4 4 0 0 0 4-4Z"/><path d="M3 9.5V4.25C3 3.56 3.56 3 4.25 3h4.5C9.44 3 10 3.56 10 4.25V8"/><path d="m7 15 3-3"/><path d="M19.5 8.5c.5-1 .5-2 .5-3 0-2.5-2-3-3-3s-2.5.5-3 3c0 1 0 2 .5 3"/><path d="M17 5.5v3"/></svg>';
    case 'swimming': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M2 16h20"/><path d="M2 20h20"/><path d="M4 8h10"/><path d="M14 4h2"/><path d="M14 8c0-2.5 2-4 4-4"/></svg>';
    case 'camping': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20 10 4"/><path d="m5 20 9-16"/><path d="M3 20h18"/><path d="m12 15-3 5"/><path d="m12 15 3 5"/></svg>';
    case 'rental': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    case 'paid': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
    case 'private': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    case 'bonfire': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v5"/><path d="m8 10 2-2"/><path d="m14 10-2-2"/><path d="M8.8 14a4 4 0 0 0 6.4 0"/><path d="M12 2a8 8 0 0 1 8 8c0 4.5-1.8 6.5-4 8.5s-2 3.5-2 5.5h-4c0-2-.5-3.5-2-5.5s-4-4-4-8.5a8 8 0 0 1 8-8z"/></svg>';
    case 'playground': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2v5"/><path d="M7 2v5"/><path d="M12 22v-6"/><path d="M12 11v2"/></svg>';
    case 'picnic': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';
    case 'campsite': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 14v6h16v-6"/><path d="M6 6h12l-6 8-6-8Z"/></svg>';
    case 'extreme': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>';
    case 'ad': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18"/><path d="M8 11v5a4 4 0 0 1-4 4H3"/><path d="M17 7v9"/><path d="M21 11v4"/><path d="M8 7V3"/><path d="M12 7V3"/></svg>';
    default: return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
};

// Get location icon based on its primary category
export const getLocationIcon = (location: Location, layers: MapLayer[]) => {
  // Safety check for categories
  const categories = location.categories || [];
  
  // Check if it's an ad first
  if (categories.includes('ad')) {
    return createCategoryIcon('ad', 'purple');
  }
  
  // Find the first active category
  const primaryCategory = categories.find(category => 
    layers.some(layer => layer.isActive && layer.category === category)
  ) || categories[0];
  
  // Find the layer for this category
  const layer = layers.find(layer => layer.category === primaryCategory);
  
  if (layer) {
    return createCategoryIcon(primaryCategory, layer.color);
  } else {
    // Default icon
    const defaultIcon = new Icon({
      iconUrl: 'path/to/icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    return defaultIcon;
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Generate category icons HTML for popups
export const getCategoryIconsHtml = (location: Location): string => {
  // Safety check for categories
  if (!location.categories) {
    return '';
  }
  
  return location.categories.map(category => {
    const iconSvg = getCategoryIconSvg(category);
    return `<span class="text-${category === 'ad' ? 'purple' : 'blue'}-500">${iconSvg}</span>`;
  }).join('');
};
