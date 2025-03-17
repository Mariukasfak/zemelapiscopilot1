import React, { useState, useEffect } from 'react';
import { Marker, Circle, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import * as L from 'leaflet';
import '../styles/location-marker.css';

// Define a pulsing icon for user location
const pulsingIcon = new DivIcon({
  className: 'custom-div-icon',
  html: `<div class="user-location-marker"><div class="pulse"></div></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const LocationMarker: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: false, watch: true, enableHighAccuracy: true });

    const onLocationFound = (e: L.LocationEvent) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setAccuracy(e.accuracy);

      // Dispatch event for other components
      document.dispatchEvent(new CustomEvent('userPositionChanged', {
        detail: {
          position: [e.latlng.lat, e.latlng.lng],
          accuracy: e.accuracy
        }
      }));
    };

    map.on('locationfound', onLocationFound);

    return () => {
      map.stopLocate();
      map.off('locationfound', onLocationFound);
    };
  }, [map]);

  return position === null ? null : (
    <>
      <Marker 
        position={position} 
        icon={pulsingIcon}
        zIndexOffset={1000}
      />
      <Circle 
        center={position} 
        radius={accuracy}
        pathOptions={{ 
          color: '#4285F4', 
          fillColor: '#4285F4', 
          fillOpacity: 0.1 
        }}
      />
    </>
  );
};

export default LocationMarker;