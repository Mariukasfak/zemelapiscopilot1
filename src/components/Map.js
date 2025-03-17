import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../supabaseClient';
import './Map.css';
import LocationPopup from './LocationPopup'; // Importuojame naują komponentą
import LoadingSpinner from './LoadingSpinner'; // Importuojame įkrovimo indikatorių

// ...existing code...

function Map() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Komponentas, kuris atnaujina duomenis keičiantis žemėlapio rodinį
  function MapEvents() {
    const map = useMap();
    
    // Funkcija duomenų gavimui pagal žemėlapio matomą dalį
    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const bounds = map.getBounds();
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();
        
        // Supabase užklausa su geografiniu filtru
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .filter('coordinates', 'intersects', `ST_MakeEnvelope(${southWest.lng}, ${southWest.lat}, ${northEast.lng}, ${northEast.lat}, 4326)`);
        
        if (error) throw error;
        
        setLocations(data || []);
      } catch (err) {
        console.error("Klaida gaunant duomenis:", err);
        setError("Nepavyko gauti duomenų. Bandykite dar kartą vėliau.");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Pradinių duomenų gavimas
    useEffect(() => {
      fetchLocations();
      
      // Tik įvykus žemėlapio perkėlimo įvykiui
      map.on('moveend', fetchLocations);
      
      return () => {
        map.off('moveend', fetchLocations);
      };
    }, [map]);
    
    return null;
  }

  return (
    <div className="map-container">
      {error && <div className="error-message">{error}</div>}
      
      <MapContainer
        center={[54.687157, 25.279652]}
        zoom={13}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents />
        
        {isLoading && <LoadingSpinner />}
        
        {!isLoading && locations.map((location) => (
          <Marker 
            key={location.id}
            position={[location.coordinates.lat, location.coordinates.lng]}
          >
            <LocationPopup location={location} />
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
