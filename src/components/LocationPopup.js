import React from 'react';
import { Popup } from 'react-leaflet';
import './LocationPopup.css';

function LocationPopup({ location }) {
  return (
    <Popup>
      <div className="popup-container">
        <h3>{location.name}</h3>
        <p>{location.description}</p>
        {location.image && (
          <img src={location.image} alt={location.name} className="popup-image" />
        )}
        {location.website && (
          <p>
            <a href={location.website} target="_blank" rel="noopener noreferrer">
              Sužinoti daugiau
            </a>
          </p>
        )}
      </div>
    </Popup>
  );
}

export default LocationPopup;
