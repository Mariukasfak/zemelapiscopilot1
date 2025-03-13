import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import { Icon, LeafletMouseEvent, DivIcon } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet.markercluster importai - įdėkite juos čia
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Kiti importai
import { Location, MapLayer, UserRole, LocationRating } from '../types';
import { supabase } from '../lib/supabase';
import { MapPin, Fish, Waves, Tent, Home, DollarSign, Lock, Unlock, Flame, ToyBrick as Toy, Utensils, Truck, MountainSnow, Star, MessageSquare, Edit, Trash, Menu, Megaphone, Filter, Sliders, Camera, Thermometer } from 'lucide-react';
import LocationDetails from './LocationDetails';
import EditLocationModal from './EditLocationModal';
import { useMap as useMapContext } from '../context/MapContext';
import { useAuth } from '../context/AuthContext';
import { fetchWeatherData } from '../services/weatherService';
import LocationMarker from './LocationMarker';

// Fix for default marker icon issue in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Custom icons for different categories
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

// Grąžina kategorijai tinkamą emoji ikoną
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

// Map center coordinates (Lithuania)
const CENTER_POSITION: [number, number] = [54.8985, 23.9036];
const DEFAULT_ZOOM = 7;

// Component to handle map events
const MapEventHandler = () => {
  const { handleMapContextMenu, closeContextMenu } = useMapContext();
  const map = useMapEvents({
    contextmenu: (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleMapContextMenu([lat, lng], { clientX: e.originalEvent.clientX, clientY: e.originalEvent.clientY });
    },
    click: () => {
      closeContextMenu();
    }
  });
  
  return null;
};

// Map type control component
const MapTypeControl = ({ mapType, setMapType }: { 
  mapType: 'streets' | 'satellite' | 'outdoors', 
  setMapType: (type: 'streets' | 'satellite' | 'outdoors') => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getMapTypeIcon = () => {
    switch (mapType) {
      case 'satellite':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_iconCarrier">
              <path d="M14.475 11.4247C14.6143 11.2854 14.7247 11.12 14.8001 10.938C14.8755 10.756 14.9143 10.561 14.9143 10.364C14.9143 10.167 14.8755 9.97196 14.8001 9.78997C14.7247 9.60798 14.6143 9.44262 14.475 9.30334C14.3357 9.16405 14.1703 9.05356 13.9883 8.97818C13.8063 8.90279 13.6113 8.864 13.4143 8.864C13.2173 8.864 13.0223 8.90279 12.8403 8.97818C12.6583 9.05356 12.4929 9.16405 12.3536 9.30334L13.4143 10.364L14.475 11.4247Z" fill="currentColor"></path>
              <path d="M8.05887 15.9411C7.40613 15.2883 6.88835 14.5134 6.53508 13.6606C6.18182 12.8077 6 11.8936 6 10.9705C6 10.0474 6.18182 9.13331 6.53508 8.28046C6.88835 7.42761 7.40613 6.65269 8.05888 5.99995L18 15.9411C17.3473 16.5938 16.5723 17.1116 15.7195 17.4649C14.8666 17.8181 13.9526 17.9999 13.0294 17.9999C12.1063 17.9999 11.1922 17.8181 10.3394 17.4649C9.48654 17.1116 8.71162 16.5938 8.05887 15.9411ZM8.05887 15.9411L5 21H10M17.6025 9.0463C17.1056 7.87566 16.1813 6.93835 15.0177 6.42515M20.6901 8.79485C20.3187 7.49954 19.6261 6.31904 18.6766 5.36288C17.7271 4.40672 16.5514 3.7059 15.2587 3.32544" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
        );
      case 'outdoors':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_iconCarrier">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_iconCarrier">
              <path d="M12 6H12.01M9 20L3 17V4L5 5M9 20L15 17M9 20V14M15 17L21 20V7L19 6M15 17V14M15 6.2C15 7.96731 13.5 9.4 12 11C10.5 9.4 9 7.96731 9 6.2C9 4.43269 10.3431 3 12 3C13.6569 3 15 4.43269 15 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
        );
    }
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 flex items-center justify-center"
        title="Pasirinkti žemėlapio tipą"
      >
        <svg viewBox="0 0 512 512" width="24" height="24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="currentColor">
          <g id="SVGRepo_iconCarrier">
            <title>layers-filled</title>
            <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g id="layers-filled" fill="currentColor" fillRule="nonzero">
                <g id="drop" transform="translate(42.666667, 53.973333)">
                  <path d="M378.986667,273.557333 L426.666667,297.386667 L213.333333,404.053333 L7.10542736e-15,297.386667 L47.68,273.557333 L213.333333,356.396117 L378.986667,273.557333 Z M213.333333,190.72 L235.925333,202.026667 L213.333333,213.331174 L190.741333,202.026667 L213.333333,190.72 Z" id="Shape"></path>
                  <polygon id="Path" points="379.008 178.180039 426.666667 202.026667 213.333333 308.693333 3.55271368e-14 202.026667 47.6586667 178.180039 213.333333 261.036117"></polygon>
                  <polygon id="Combined-Shape" points="213.333333 -7.10542736e-15 426.666667 106.666667 213.333333 213.333333 3.55271368e-14 106.666667"></polygon>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg p-2 z-10 w-48">
          <div className="text-xs font-medium mb-1 text-gray-500">Žemėlapio tipas</div>
          <button 
            onClick={() => {
              setMapType('streets');
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded mb-1 flex items-center ${mapType === 'streets' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <g id="SVGRepo_iconCarrier">
                <path d="M12 6H12.01M9 20L3 17V4L5 5M9 20L15 17M9 20V14M15 17L21 20V7L19 6M15 17V14M15 6.2C15 7.96731 13.5 9.4 12 11C10.5 9.4 9 7.96731 9 6.2C9 4.43269 10.3431 3 12 3C13.6569 3 15 4.43269 15 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </g>
            </svg>
            Paprastas žemėlapis
          </button>
          <button 
            onClick={() => {
              setMapType('satellite');
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded mb-1 flex items-center ${mapType === 'satellite' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <g id="SVGRepo_iconCarrier">
                <path d="M14.475 11.4247C14.6143 11.2854 14.7247 11.12 14.8001 10.938C14.8755 10.756 14.9143 10.561 14.9143 10.364C14.9143 10.167 14.8755 9.97196 14.8001 9.78997C14.7247 9.60798 14.6143 9.44262 14.475 9.30334C14.3357 9.16405 14.1703 9.05356 13.9883 8.97818C13.8063 8.90279 13.6113 8.864 13.4143 8.864C13.2173 8.864 13.0223 8.90279 12.8403 8.97818C12.6583 9.05356 12.4929 9.16405 12.3536 9.30334L13.4143 10.364L14.475 11.4247Z" fill="currentColor"></path>
                <path d="M8.05887 15.9411C7.40613 15.2883 6.88835 14.5134 6.53508 13.6606C6.18182 12.8077 6 11.8936 6 10.9705C6 10.0474 6.18182 9.13331 6.53508 8.28046C6.88835 7.42761 7.40613 6.65269 8.05888 5.99995L18 15.9411C17.3473 16.5938 16.5723 17.1116 15.7195 17.4649C14.8666 17.8181 13.9526 17.9999 13.0294 17.9999C12.1063 17.9999 11.1922 17.8181 10.3394 17.4649C9.48654 17.1116 8.71162 16.5938 8.05887 15.9411ZM8.05887 15.9411L5 21H10M17.6025 9.0463C17.1056 7.87566 16.1813 6.93835 15.0177 6.42515M20.6901 8.79485C20.3187 7.49954 19.6261 6.31904 18.6766 5.36288C17.7271 4.40672 16.5514 3.7059 15.2587 3.32544" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </g>
            </svg>
            Palydovinis vaizdas
          </button>
          <button 
            onClick={() => {
              setMapType('outdoors');
              setIsOpen(false);
            }}
            className={`w-full text-left p-2 rounded flex items-center ${mapType === 'outdoors' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>
            Reljefinis vaizdas
          </button>
        </div>
      )}
    </div>
  );
};

// FilterControls component
const FilterControls = ({ 
  minRating, 
  setMinRating,  
  showFreeOnly, 
  setShowFreeOnly,  
  showPaidOnly, 
  setShowPaidOnly, 
  isFilterOpen,
  toggleFilter,
  filterRadius,
  setFilterRadius
}: {
  minRating: number;
  setMinRating: (rating: number) => void;
  showFreeOnly: boolean;
  setShowFreeOnly: (show: boolean) => void;
  showPaidOnly: boolean;
  setShowPaidOnly: (show: boolean) => void;
  isFilterOpen: boolean;
  toggleFilter: () => void;
  filterRadius: number;
  setFilterRadius: (radius: number) => void;
}) => {
  return (
    <>
      {/* Filter panel content */}
      <div className="bg-white rounded-md shadow-md p-3 max-w-xs">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Filtrai</h3>
          <button 
            onClick={toggleFilter}
            className="md:hidden text-gray-500"
          >
            <Sliders size={16} />
          </button>
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium block mb-1">Minimalus įvertinimas</label>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setMinRating(rating)}
                className={`w-8 h-8 flex items-center justify-center rounded ${minRating === rating ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              >
                {rating === 0 ? 'Visi' : rating}
              </button>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => {
              // Jei jau aktyvus, išjungiame
              if (showFreeOnly) {
                setShowFreeOnly(false);
                setShowPaidOnly(false);
              } else {
                // Jei neaktyvus, įjungiame ir išjungiame kitą
                setShowFreeOnly(true);
                setShowPaidOnly(false);
              }
            }}
            className={`px-2 py-1 text-xs rounded flex-1 ${showFreeOnly ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Nemokamos
          </button>
          <button
            onClick={() => {
              // Jei jau aktyvus, išjungiame
              if (showPaidOnly) {
                setShowFreeOnly(false);
                setShowPaidOnly(false);
              } else {
                // Jei neaktyvus, įjungiame ir išjungiame kitą
                setShowFreeOnly(false);
                setShowPaidOnly(true);
              }
            }}
            className={`px-2 py-1 text-xs rounded flex-1 ${showPaidOnly ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
          >
            Mokamos
          </button>
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium block mb-1">Atstumas nuo manęs ({filterRadius} km)</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1"
            value={filterRadius}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setFilterRadius(newValue);
              // Perduodame į kitus komponentus per event
              const event = new CustomEvent('setFilterRadius', {
                detail: {
                  value: newValue
                }
              });
              document.dispatchEvent(event);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Išjungta</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <Thermometer size={14} className="mr-1" /> 
          Orų duomenys atnaujinti prieš 15 min.
        </div>
      </div>
    </>
  );
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
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'outdoors'>('streets');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState<boolean>(false);
  const [ratings, setRatings] = useState<LocationRating[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPaidOnly, setShowPaidOnly] = useState<boolean>(false);
  const [locationContextMenu, setLocationContextMenu] = useState<{
    location: Location,
    x: number,
    y: number
  } | null>(null);
  const [showPopup, setShowPopup] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const mapRef = useRef<any>(null);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [filterRadius, setFilterRadius] = useState<number>(0);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [hasShownLocationWarning, setHasShownLocationWarning] = useState<boolean>(false);

  const handleBoundsChange = useCallback((bounds: any) => {
    setMapBounds(bounds);
  }, []);
  
  // Žemėlapio riboms stebėti
  useEffect(() => {
    if (!mapReady || !mapBounds) return;
    console.log('Map bounds changed:', mapBounds);
    
    const loadLocationsInView = async () => {
      try {
        setLoading(true);
        // Pataisyta eilutė, išvengiant void tipo klaidos
        const fetchResult = await fetchLocationsByBounds(mapBounds, userRole);
        const locationsInView = Array.isArray(fetchResult) ? fetchResult : [];
        
        setLocations(prevLocations => {
          const existingIds = new Set(prevLocations.map(loc => loc.id));
          const newLocations = locationsInView.filter((loc: Location) => !existingIds.has(loc.id));
          return [...prevLocations, ...newLocations];
        });
      } catch (error) {
        console.error('Error loading locations in view:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLocationsInView();
  }, [mapBounds, mapReady, userRole]);

  // Pridėkime įvykių klausymąsi žemėlapio centravimui
  useEffect(() => {
    const handleMapCenter = (event: any) => {
      const { lat, lng, zoom } = event.detail;
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], zoom);
      }
    };

    // Užregistruokime įvykio klausymą
    document.addEventListener('mapCenter', handleMapCenter);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('mapCenter', handleMapCenter);
    };
  }, []);

  // Klausomės vartotojo pozicijos pasikeitimo
  useEffect(() => {
    const handleUserPositionChanged = (event: any) => {
      const { position } = event.detail;
      setUserPosition(position);
    };

    // Užregistruokime įvykio klausymą
    document.addEventListener('userPositionChanged', handleUserPositionChanged);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('userPositionChanged', handleUserPositionChanged);
    };
  }, []);

  // Klausomės filtro keitimo įvykio
  useEffect(() => {
    const handleSetFilterRadius = (event: any) => {
      const { value } = event.detail;
      setFilterRadius(value);
    };

    // Užregistruokime įvykio klausymą
    document.addEventListener('setFilterRadius', handleSetFilterRadius);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('setFilterRadius', handleSetFilterRadius);
    };
  }, []);

  // Klausomės reitingo filtro keitimo įvykio
  useEffect(() => {
    const handleSetFilterRating = (event: any) => {
      const { value } = event.detail;
      setMinRating(value);
    };

    // Užregistruokime įvykio klausymą
    document.addEventListener('setFilterRating', handleSetFilterRating);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('setFilterRating', handleSetFilterRating);
    };
  }, []);

  // Klausomės mokama/nemokama filtro keitimo įvykio
  useEffect(() => {
    const handleSetFilterPaidStatus = (event: any) => {
      const { showFreeOnly, showPaidOnly } = event.detail;
      setShowFreeOnly(showFreeOnly);
      setShowPaidOnly(showPaidOnly);
    };

    // Užregistruokime įvykio klausymą
    document.addEventListener('setFilterPaidStatus', handleSetFilterPaidStatus);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('setFilterPaidStatus', handleSetFilterPaidStatus);
    };
  }, []);

  // Funkcija centruoti žemėlapį pagal vartotojo poziciją
  const centerMapOnUser = (zoom: number = 14) => {
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
  };

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user || null;
        
        // If user has geolocation, center the map on their location
        if (navigator.geolocation && mapRef.current) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              mapRef.current.setView([latitude, longitude], 12);
            },
            (error) => {
              console.log('Geolocation error:', error);
            }
          );
        }
      } catch (error) {
        console.error('Error getting user session:', error);
      }
    };
    getUser();
  }, []);

  // src/components/Map.tsx - redaguokite useEffect, kuris užkrauna vietas
  useEffect(() => {
    const updateLocationsWithWeather = async (locationsData: any[]) => {
      // Sukuriame kopijas, kad nemodifikuotume tiesioginių reikšmių
      const updatedLocations = [...locationsData];
      // Pasiruošiame asmeninio atnaujinimo limitus
      const MAX_CONCURRENT_UPDATES = 3;
      const locationsToUpdate = [];
      
      // Peržiūrime visas lokacijas
      for (let i = 0; i < updatedLocations.length; i++) {
        const location = updatedLocations[i];
        
        // Jei turi koordinates ir neturi naujų orų duomenų, pridedame į eilę
        if (location.latitude && location.longitude && 
          (!location.weather_data || 
           !location.weather_data.lastUpdated || 
           new Date().getTime() - new Date(location.weather_data.lastUpdated).getTime() > 60 * 60 * 1000)) {
          locationsToUpdate.push(i);
        }
      }
      
      // Atnaujinkime kiekvienos lokacijos orus iki MAX_CONCURRENT_UPDATES vienu metu
      for (let i = 0; i < locationsToUpdate.length; i += MAX_CONCURRENT_UPDATES) {
        const batch = locationsToUpdate.slice(i, i + MAX_CONCURRENT_UPDATES);
        await Promise.all(batch.map(async (index) => {
          try {
            const location = updatedLocations[index];
            // Gauname tikrus orų duomenis visoms vietoms, be išimčių
            const weatherData = await fetchWeatherData(location.latitude, location.longitude);
            if (weatherData) {
              updatedLocations[index] = {
                ...location,
                weather_data: {
                  ...weatherData,
                  lastUpdated: new Date().toISOString()
                }
              };
            }
          } catch (error) {
            console.error(`Error updating weather for location at index ${index}:`, error);
          }
        }));
        
        // Pridedame mažą pauzę tarp kiekvieno batch'o
        if (i + MAX_CONCURRENT_UPDATES < locationsToUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Atnaujiname state'ą
      setLocations(updatedLocations);
    };

    const fetchLocations = async () => {
      try {
        setLoading(true);
        // Fetch all locations - we want everyone to see all locations
        let query = supabase.from('locations').select('*');
        // If not admin or moderator, only show approved locations
        if (userRole !== 'admin' && userRole !== 'moderator') {
          query = query.eq('is_approved', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching locations:', error);
          setLocations(generateMockLocations());
          setLoading(false);
          return;
        }
        
        console.log("Got locations data:", data?.length || 0);
        
        // Generate mock data if no data is returned
        const mockLocations = data && data.length > 0 ? data : generateMockLocations();
        
        // Ensure all locations have required properties
        const updatedLocations = mockLocations.map(location => {
          // Ensure we have valid categories array
          const categories = Array.isArray(location.categories) ? location.categories : [];
          // Ensure we have valid images array
          const images = Array.isArray(location.images) ? location.images : [];
          return {
            ...location,
            categories,
            images
          };
        });
        
        console.log("Processed locations:", updatedLocations.length);
        
        // Delay setting the locations to ensure the map is ready
        setTimeout(() => {
          // Tiesiog nustatome lokacijas be orų, orus atnaujinsime vėliau 
          // atskirame useEffect bloke, kurį pridėjome
          setLocations(updatedLocations);
          setLoading(false);
        }, 500);
        
      } catch (error) {
        console.error('Error in fetchLocations:', error);
        // Generate mock data if there's an error
        const mockLocations = generateMockLocations();
        setLocations(mockLocations);
        setLoading(false);
      }
    };
    
    if (mapReady) {
      fetchLocations();
    } else {
      // Set a timeout to fetch locations even if mapReady doesn't trigger
      const timer = setTimeout(() => {
        console.log("Fetching locations after timeout");
        fetchLocations();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userRole, mapReady]);

  // Generate mock locations if Supabase connection fails
  const generateMockLocations = (): Location[] => {
    return [
      {
        id: '1',
        name: 'Mariuko Sodyba',
        description: 'Graži sodyba prie ežero su pirtimi ir žvejybos galimybėmis.',
        latitude: 54.8985,
        longitude: 23.9036,
        categories: ['rental', 'fishing', 'camping', 'ad'],
        is_public: true,
        is_paid: true,
        images: [
          'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
        ],
        main_image_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_approved: true,
        weather_data: {
          temp: -1,
          humidity: 70,
          windSpeed: 3,
          description: 'Šalta ir giedra',
          icon: '01d'
        }
      },
      {
        id: '2',
        name: 'Žvejybos vieta Kauno mariose',
        description: 'Populiari žvejybos vieta su geru priėjimu prie vandens.',
        latitude: 54.8679,
        longitude: 24.0691,
        categories: ['fishing', 'swimming'],
        is_public: true,
        is_paid: false,
        images: [
          'https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
        ],
        main_image_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_approved: true,
        weather_data: {
          temp: 3,
          humidity: 65,
          windSpeed: 5,
          description: 'Vėsu',
          icon: '02d'
        }
      },
      {
        id: '3',
        name: 'Stovyklavietė prie Platelių ežero',
        description: 'Graži stovyklavietė su laužavietėmis ir WC.',
        latitude: 56.0425,
        longitude: 21.8950,
        categories: ['camping', 'bonfire', 'picnic'],
        is_public: true,
        is_paid: true,
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
        ],
        main_image_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_approved: true,
        weather_data: {
          temp: 2,
          humidity: 75,
          windSpeed: 4,
          description: 'Vėsu',
          icon: '03d'
        }
      }
    ];
  };

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Fetch ratings for locations
  useEffect(() => {
    const fetchAllRatings = async () => {
      try {
        console.log("Fetching ratings for locations...");
        const { data, error } = await supabase
          .from('location_ratings')
          .select('*');
        if (error) throw error;
        
        console.log(`Got ${data?.length || 0} ratings from database`);
        setRatings(data || []);
        
        // Calculate average ratings for each location
        const locationRatings = data?.reduce((acc, rating) => {
          if (!acc[rating.location_id]) {
            acc[rating.location_id] = [];
          }
          acc[rating.location_id].push(rating.rating);
          return acc;
        }, {} as Record<string, number[]>);
        
        // Update locations with calculated average ratings
        setLocations(prevLocations => {
          const updatedLocations = prevLocations.map(location => {
            const ratingsForLocation = locationRatings?.[location.id] || [];
            const avgRating = ratingsForLocation.length > 0 
              ? Number((ratingsForLocation.reduce((sum: number, r: number) => sum + r, 0) / ratingsForLocation.length).toFixed(1))
              : undefined;  // Naudojame undefined vietoj null
            return {
              ...location,
              rating: avgRating
            };
          });
          
          // Log how many locations got ratings
          const withRatings = updatedLocations.filter(loc => loc.rating !== undefined).length;
          console.log(`Updated ${withRatings} locations with ratings`);
          
          return updatedLocations;
        });
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };
    
    // Only fetch when locations are loaded
    if (locations.length > 0) {
      fetchAllRatings();
    }
  }, [locations.length]);
  
  // Funkcija atstumui tarp dviejų taškų skaičiuoti (kilometrais)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Žemės spindulys kilometrais
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Optimized with useMemo
  const filteredLocations = useMemo(() => {
    console.time('locations-filter');
    
    const result = locations.filter(location => {
      // Safety check for null location objects
      if (!location || !location.latitude || !location.longitude) return false;
      
      // Diagnostinis pranešimas - įjunkite tik derinimui
      const isDebug = false;
      if (isDebug) {
        console.log(`Filtering location: ${location.name}`);
      }
      
      // If location.categories doesn't exist, use empty array
      const categories = location.categories || [];
      
      // Filter by active layers
      const matchesLayer = categories.some(category => 
        layers.some(layer => layer.isActive && layer.category === category)
      );
      if (isDebug && !matchesLayer) {
        console.log(`  - Layer filter failed: ${categories.join(', ')}`);
      }
      
      // Filter by minimum rating
      const matchesRating = 
        minRating === 0 || 
        (location.rating !== undefined && location.rating >= minRating);
      if (isDebug && !matchesRating) {
        console.log(`  - Rating filter failed: ${location.rating} < ${minRating}`);
      }
      
      // Filter by paid/free status
      const matchesPaidStatus = 
        (!showPaidOnly && !showFreeOnly) || 
        (showPaidOnly && location.is_paid) || 
        (showFreeOnly && !location.is_paid);
      if (isDebug && !matchesPaidStatus) {
        console.log(`  - Paid status filter failed: is_paid=${location.is_paid}, showPaidOnly=${showPaidOnly}, showFreeOnly=${showFreeOnly}`);
      }
      
      // Filter by distance from user
      let matchesDistance = true;
      if (filterRadius > 0) {
        if (userPosition) {
          const distance = calculateDistance(
            userPosition[0], userPosition[1], 
            location.latitude, location.longitude
          );
          matchesDistance = distance <= filterRadius;
        } else {
          // Jei nėra vartotojo pozicijos, bet filtras aktyvus, vistiek rodome viską
          matchesDistance = true;
        }
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
    
    return layer ? createCategoryIcon(primaryCategory, layer.color) : DefaultIcon;
  };

  // Optimized with useCallback
  const handleLocationClick = useCallback((location: Location) => {
    console.log("Location clicked:", location.name);
    // Immediately show location details without delay
    setSelectedLocation(location);
    setShowLocationDetails(true);
  }, []);

  // Optimized with useCallback
  const handleLocationContextMenu = useCallback((location: Location, event: React.MouseEvent) => {
    event.preventDefault();
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    setLocationContextMenu({
      location,
      x: event.clientX,
      y: event.clientY
    });
  }, [userRole]);

  // Optimized with useCallback
  const handleEditLocation = useCallback((location: Location) => {
    setEditingLocation(location);
    setShowEditModal(true);
    setLocationContextMenu(null);
  }, []);

  // Optimized with useCallback
  const handleDeleteLocation = useCallback(async (location: Location) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    if (window.confirm('Ar tikrai norite ištrinti šią vietą?')) {
      try {
        const { error } = await supabase
          .from('locations')
          .delete()
          .eq('id', location.id);
          
        if (error) throw error;
        
        // Remove from local state
        setLocations(locations.filter(loc => loc.id !== location.id));
        setLocationContextMenu(null);
      } catch (error) {
        console.error('Error deleting location:', error);
        
        // Remove from local state anyway to provide a good user experience
        setLocations(locations.filter(loc => loc.id !== location.id));
        setLocationContextMenu(null);
        
        alert('Vieta ištrinta lokaliai. Duomenų bazės atnaujinimas nepavyko, bet pakeitimai išsaugoti šioje sesijoje.');
      }
    }
  }, [userRole, locations]);

  // Toggle filter panel
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Get tile layer URL based on map type
  const getTileLayerUrl = () => {
    switch (mapType) {
      case 'satellite':
        // Use a satellite map with labels for better visibility of streets and cities
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'outdoors':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get category icons for popup
  const getCategoryIcons = (location: Location) => {
    // Saugiklis: jei categories yra undefined arba null, grąžiname tuščią masyvą
    if (!location.categories) {
      return [];
    }
    
    return location.categories.map(category => {
      // Ieškome layer, jei nerandame - saugiai grįžtame, kad išvengtume klaidų
      const layer = layers.find(l => l.category === category);
      if (!layer) return null;
      
      let IconComponent;
      switch (category) {
        case 'fishing': IconComponent = Fish; break;
        case 'swimming': IconComponent = Waves; break;
        case 'camping': IconComponent = Tent; break;
        case 'rental': IconComponent = Home; break;
        case 'paid': IconComponent = DollarSign; break;
        case 'private': IconComponent = Lock; break;
        case 'bonfire': IconComponent = Flame; break;
        case 'playground': IconComponent = Toy; break;
        case 'picnic': IconComponent = Utensils; break;
        case 'campsite': IconComponent = Truck; break;
        case 'extreme': IconComponent = MountainSnow; break;
        case 'ad': IconComponent = Megaphone; break;
        default: IconComponent = MapPin;
      }
      
      return (
        <IconComponent 
          key={category} 
          size={16} 
          className={`text-${layer.color}-500 ${category === 'ad' ? 'text-purple-500' : ''}`} 
        />
      );
    }).filter(Boolean); // Pašaliname null reikšmes, jei tokių būtų
  };
  
  // Diagnostikos funkcija
  const logState = () => {
    console.log("Current state:");
    console.log("- userPosition:", userPosition);
    console.log("- filterRadius:", filterRadius);
    console.log("- minRating:", minRating);
    console.log("- showFreeOnly:", showFreeOnly);
    console.log("- showPaidOnly:", showPaidOnly);
    console.log("- layers:", layers.map(l => `${l.name}: ${l.isActive}`).join(", "));
    console.log("- filteredLocations:", filteredLocations.length);
    console.log("- total locations:", locations.length);
    
    // Locations with ratings
    const locationsWithRatings = locations.filter(l => l.rating !== undefined);
    console.log(`${locationsWithRatings.length} locations have ratings`);
    console.log("Locations with ratings:", locationsWithRatings.map(l => ({
      id: l.id,
      name: l.name,
      rating: l.rating
    })));
    
    // Filtered locations with ratings
    const filteredWithRatings = filteredLocations.filter(l => l.rating !== undefined);
    console.log(`${filteredWithRatings.length} filtered locations have ratings`);
    
    // Check rating filter effectiveness
    console.log("Rating filter effectiveness:");
    console.log("- Locations filtered out by rating:", 
      locations.filter(l => !(minRating === 0 || 
        (l.rating !== undefined && l.rating >= minRating))).length
    );
  };

  // Marker clustering implementation
  useEffect(() => {
    // Jei žemėlapis nepasirengęs arba nėra lokacijų, grįžti
    if (!mapRef.current || !mapReady || filteredLocations.length === 0) return;
    
    console.log('Creating markers for', filteredLocations.length, 'locations');
    
    const map = mapRef.current;
    
    // Sukurti marker klasterizacijos grupę
    // @ts-ignore -- Ignoruoti TypeScript klaidą, jei negalite rasti tinkamų tipų
    const markers = L.markerClusterGroup({
      maxClusterRadius: 40,         // Klasterio spindulys pikseliais
      spiderfyOnMaxZoom: true,      // Išskleisti žymeklius max priartinime
      showCoverageOnHover: false,   // Nerodyti apskritimų
      zoomToBoundsOnClick: true,    // Priartinti prie klasterio paspaudus
      disableClusteringAtZoom: 16   // Nustoti grupuoti pasiekus tam tikrą priartinimą
    });
    
    // Pridėti žymeklius į klasterį
    filteredLocations.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: getLocationIcon(location)
      });
      
      // Pridėti įvykių klausytojus
      marker.on('click', () => {
        console.log("Marker clicked:", location.name);
        setShowPopup(location.id);
        
        // Sukuriame popup turinį
        const popupContent = `
<div class="p-0 leaflet-popup-modern">
  <div class="relative h-48 bg-gray-100">
    ${location.images && location.images.length > 0 ? `
      <img 
        src="${location.images[location.main_image_index || 0]}" 
        alt="${location.name}"
        class="w-full h-full object-cover"
      />
      ${location.is_paid ? `
        <div class="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-md font-medium">
          Mokama
        </div>
      ` : ''}
      ${location.categories && location.categories.includes('ad') ? `
        <div class="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-md font-medium animate-pulse">
          Reklama
        </div>
      ` : ''}
    ` : `
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `}
  </div>
  
  <div class="p-3">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-medium text-lg leading-tight">${location.name}</h3>
      ${location.rating !== undefined ? `
        <div class="flex items-center text-amber-500 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${Number(location.rating).toFixed(1)}
        </div>
      ` : ''}
    </div>
    
    <div class="flex flex-wrap gap-1 mb-2">
      ${(location.categories || []).map(category => `
        <span class="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
          ${getCategoryEmoji(category)} ${category}
        </span>
      `).join('')}
    </div>
    
    ${location.weather_data ? `
      <div class="bg-blue-50 rounded-md p-2 mb-2 flex justify-between">
        <div class="text-center">
          <div class="text-xl font-semibold text-blue-700">${location.weather_data.temp}°C</div>
          <div class="text-xs text-blue-600">${location.weather_data.description}</div>
        </div>
        <div class="flex flex-col text-xs text-blue-700">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.94"/></svg>
            ${location.weather_data.humidity}%
          </div>
          <div class="flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
            ${location.weather_data.windSpeed} m/s
          </div>
        </div>
      </div>
    ` : ''}
    
    <button
      onclick="document.dispatchEvent(new CustomEvent('openLocationDetails', {detail: {id: '${location.id}'}}));"
      class="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Daugiau informacijos
    </button>
  </div>
</div>
`;

        // Sukurti popup
        const popup = L.popup({
          offset: [0, -5],
          closeButton: true,
          className: 'location-popup-original',
          minWidth: 200,
          maxWidth: 280,
          autoClose: false
        }).setContent(popupContent);
        
        marker.bindPopup(popup).openPopup();
      });
      
      // Pridėti kontekstinio meniu įvykį
      marker.on('contextmenu', (e: any) => {
        handleLocationContextMenu(location, e.originalEvent);
      });
      
      // Pridėti žymeklį į klasterį
      markers.addLayer(marker);
    });
    
    // Pridėti klasterį į žemėlapį
    map.addLayer(markers);
    
    // Išvalyti, kai komponentas išmontuojamas
    return () => {
      map.removeLayer(markers);
    };
  }, [filteredLocations, mapRef.current, mapReady, getLocationIcon, handleLocationContextMenu, layers]);

  // Funkcija, kuri grąžina HTML kodo string su kategorijų ikonoms
  const getCategoryIconsHtml = (location: Location): string => {
    // Saugiklis: jei categories yra undefined arba null, grąžiname tuščią string
    if (!location.categories) {
      return '';
    }
    
    return location.categories.map(category => {
      // Ieškome layer, jei nerandame - saugiai grįžtame, kad išvengtume klaidų
      const layer = layers.find(l => l.category === category);
      if (!layer) return '';
      
      const color = layer.color;
      let iconSvg = '';
      
      switch (category) {
        case 'fishing':
          iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16.5a9 9 0 1 0-9 9 9 9 0 0 0 9-9Z"/><path d="M13 16.5a4 4 0 1 0-4 4 4 4 0 0 0 4-4Z"/><path d="M3 9.5V4.25C3 3.56 3.56 3 4.25 3h4.5C9.44 3 10 3.56 10 4.25V8"/><path d="m7 15 3-3"/><path d="M19.5 8.5c.5-1 .5-2 .5-3 0-2.5-2-3-3-3s-2.5.5-3 3c0 1 0 2 .5 3"/><path d="M17 5.5v3"/></svg>';
          break;
        case 'swimming':
          iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M2 16h20"/><path d="M2 20h20"/><path d="M4 8h10"/><path d="M14 4h2"/><path d="M14 8c0-2.5 2-4 4-4"/></svg>';
          break;
        // ... other cases
        default:
          iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
      }
      
      return `<span class="text-${color}-500 ${category === 'ad' ? 'text-purple-500' : ''}">${iconSvg}</span>`;
    }).join('');
  };

  // Add event listener for marker interactions
  useEffect(() => {
    // Įvykio klausytojas popupams atidaryti
    const handleOpenLocationDetails = (e: any) => {
      console.log("Opening location details for ID:", e.detail.id);
      const location = locations.find(loc => loc.id === e.detail.id);
      if (location) {
        handleLocationClick(location);
      } else {
        console.error("Location not found with ID:", e.detail.id);
      }
    };
    
    document.addEventListener('openLocationDetails', handleOpenLocationDetails);
    
    return () => {
      document.removeEventListener('openLocationDetails', handleOpenLocationDetails);
    };
  }, [locations, handleLocationClick]);

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
        
        {/* We removed the markers here since we're now using clustering */}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-[400]">
        <MapTypeControl mapType={mapType} setMapType={setMapType} />
      </div>

      {/* Centravimo mygtukas tik PC režime */}
      <div className="hidden md:block absolute top-16 right-4 z-[400]">
        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const map = mapRef.current;
                  if (map) {
                    map.setView([position.coords.latitude, position.coords.longitude], 14);
                  }
                },
                (error) => {
                  console.error('Geolocation error:', error);
                  // Jei nepavyksta nustatyti vietos, centruojame į Kauną
                  if (mapRef.current) {
                    mapRef.current.setView([54.8985, 23.9036], 8);
                  }
                }
              );
            } else {
              // Jei geolokacija nepasiekiama, centruojame į Kauną
              if (mapRef.current) {
                mapRef.current.setView([54.8985, 23.9036], 8);
              }
            }
          }} 
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          title="Centruoti žemėlapį pagal jūsų vietą"
        >
          <MapPin size={20} className="text-blue-500" />
        </button>
      </div>

      {/* Centravimo mygtukas tik mobiliajame režime - kairėje apačioje */}
      <div className="md:hidden absolute bottom-20 left-4 z-[400]">
        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const map = mapRef.current;
                  if (map) {
                    map.setView([position.coords.latitude, position.coords.longitude], 14);
                  }
                },
                (error) => {
                  console.error('Geolocation error:', error);
                  // Jei nepavyksta nustatyti vietos, centruojame į Kauną
                  if (mapRef.current) {
                    mapRef.current.setView([54.8985, 23.9036], 8);
                  }
                }
              );
            } else {
              // Jei geolokacija nepasiekiama, centruojame į Kauną
              if (mapRef.current) {
                mapRef.current.setView([54.8985, 23.9036], 8);
              }
            }
          }} 
          className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
          title="Centruoti žemėlapį pagal jūsų vietą"
        >
          <MapPin size={24} className="text-blue-500" />
        </button>
      </div>

      {/* Filtro kontrolės tik kompiuteriams, ne mobiliems įrenginiams */}
      <div className="hidden md:block absolute bottom-4 right-4 z-[400]">
        <FilterControls 
          minRating={minRating}
          setMinRating={setMinRating}
          showFreeOnly={showFreeOnly}
          setShowFreeOnly={setShowFreeOnly}
          showPaidOnly={showPaidOnly}
          setShowPaidOnly={setShowPaidOnly}
          isFilterOpen={isFilterOpen}
          toggleFilter={toggleFilter}
          filterRadius={filterRadius}
          setFilterRadius={setFilterRadius}
        />
        
        {/* Diagnostikos mygtukas - tik administratoriams */}
        {userRole === 'admin' && (
          <button 
            onClick={logState}
            className="mt-2 bg-gray-800 text-white px-2 py-1 text-xs rounded w-full"
          >
            Diagnostika
          </button>
        )}
      </div>
      
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
              <Edit size={16} className="mr-2" />
              Redaguoti vietą
            </button>
            <button 
              className="px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
              onClick={() => handleDeleteLocation(locationContextMenu.location)}
            >
              <Trash size={16} className="mr-2" />
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

async function fetchLocationsByBounds(
  mapBounds: { north: number; south: number; east: number; west: number; }, 
  userRole: string
): Promise<Location[]> {
  try {
    // Start building the query
    let query = supabase
      .from('locations')
      .select('*')
      // Filter by bounds
      .lt('latitude', mapBounds.north)
      .gt('latitude', mapBounds.south)
      .lt('longitude', mapBounds.east)
      .gt('longitude', mapBounds.west);
    
    // If not admin or moderator, only show approved locations
    if (userRole !== 'admin' && userRole !== 'moderator') {
      query = query.eq('is_approved', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching locations by bounds:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchLocationsByBounds:', error);
    return [];
  }
}