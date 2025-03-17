import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>Kraunami duomenys...</p>
    </div>
  );
}

export default LoadingSpinner;
