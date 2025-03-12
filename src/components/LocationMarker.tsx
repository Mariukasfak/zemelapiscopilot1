import React, { useState, useEffect } from 'react';
import { Marker, Popup, Circle, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';

const LocationMarker: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [filterRadius, setFilterRadius] = useState<number>(0);
  const map = useMap();

  // Sekame filtro radiuso pasikeitimus
  useEffect(() => {
    const handleSetFilterRadius = (event: CustomEvent) => {
      setFilterRadius(event.detail.value);
    };

    // Užregistruojame įvykio klausymą
    document.addEventListener('setFilterRadius', handleSetFilterRadius as EventListener);

    return () => {
      // Išregistruojame įvykio klausymą
      document.removeEventListener('setFilterRadius', handleSetFilterRadius as EventListener);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setPosition([latitude, longitude]);
          setAccuracy(accuracy);
          
          // Dispačiname įvykį, kad kiti komponentai žinotų apie pozicijos pasikeitimą
          const event = new CustomEvent('userPositionChanged', {
            detail: {
              position: [latitude, longitude]
            }
          });
          document.dispatchEvent(event);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
      
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [map]);

  return position === null ? null : (
    <>
      <Marker position={position} icon={
        new DivIcon({
          html: `<div class="pulse-dot"></div>`,
          className: 'location-marker-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12]
        })
      }>
        <Popup>Jūsų dabartinė vieta</Popup>
      </Marker>
      {/* Rodome tikslumą - mažesnį apskritimą */}
      <Circle 
        center={position} 
        radius={accuracy} 
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
      />
      {/* Rodome filtravimo spindulį tik jei jis > 0 */}
      {filterRadius > 0 && (
        <Circle 
          center={position} 
          radius={filterRadius * 1000} // Konvertuojame km į metrus
          pathOptions={{ 
            color: 'green', 
            fillColor: 'green', 
            fillOpacity: 0.05, 
            weight: 1, 
            dashArray: '5, 5' 
          }}
        />
      )}
    </>
  );
};

export default LocationMarker;