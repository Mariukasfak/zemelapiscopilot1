import React, { useState } from 'react';

interface MapTypeControlProps {
  mapType: 'streets' | 'satellite' | 'outdoors';
  setMapType: (type: 'streets' | 'satellite' | 'outdoors') => void;
}

const MapTypeControl: React.FC<MapTypeControlProps> = ({ mapType, setMapType }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // This function is now properly used in the UI
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
        {getMapTypeIcon()} {/* Now using the function */}
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

export default MapTypeControl;
