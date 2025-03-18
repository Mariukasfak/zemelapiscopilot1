import React, { useState } from 'react';
import { MapPin, Sliders, Thermometer } from 'lucide-react';

interface MapTypeControlProps { 
  mapType: 'streets' | 'satellite' | 'outdoors';
  setMapType: (type: 'streets' | 'satellite' | 'outdoors') => void;
}

export const MapTypeControl: React.FC<MapTypeControlProps> = ({ mapType, setMapType }) => {
  const [isOpen, setIsOpen] = useState(false);
  
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

interface FilterControlsProps {
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
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  minRating,
  setMinRating,
  showFreeOnly,
  setShowFreeOnly,
  showPaidOnly,
  setShowPaidOnly,
  toggleFilter,
  filterRadius,
  setFilterRadius
}) => {
  return (
    <>
      {/* Filter panel content */}
      <div className="bg-white rounded-md shadow-md p-3 max-w-xs">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Filtrai</h3>
          <button 
            onClick={toggleFilter}
            className="lg:hidden text-gray-500"
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
              // If already active, turn off
              if (showFreeOnly) {
                setShowFreeOnly(false);
                setShowPaidOnly(false);
              } else {
                // If inactive, turn on and turn off the other one
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
              // If already active, turn off
              if (showPaidOnly) {
                setShowFreeOnly(false);
                setShowPaidOnly(false);
              } else {
                // If inactive, turn on and turn off the other one
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
              // Pass to other components via event
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

interface MapControlsProps {
  onCenterMap: () => void;
  mapType: 'streets' | 'satellite' | 'outdoors';
  setMapType: (type: 'streets' | 'satellite' | 'outdoors') => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  showFreeOnly: boolean;
  setShowFreeOnly: (show: boolean) => void;
  showPaidOnly: boolean;
  setShowPaidOnly: (show: boolean) => void;
  filterRadius: number;
  setFilterRadius: (radius: number) => void;
  isFilterOpen: boolean;
  toggleFilter: () => void;
  userRole: string;
  logState?: () => void; // Optional debugging function
}

const MapControls: React.FC<MapControlsProps> = ({
  onCenterMap,
  mapType,
  setMapType,
  minRating,
  setMinRating,
  showFreeOnly,
  setShowFreeOnly,
  showPaidOnly,
  setShowPaidOnly,
  filterRadius,
  setFilterRadius,
  isFilterOpen,
  toggleFilter,
  userRole,
  logState
}) => {
  // Ensure onCenterMap is called safely
  const handleCenterMap = () => {
    if (typeof onCenterMap === 'function') {
      onCenterMap();
    }
  };

  return (
    <>
      {/* Mobili versija */}
      <div className="xl:hidden">
        {/* Mobilūs kontrolės elementai */}
      </div>
      
      {/* PC versija */}
      <div className="hidden xl:block">
        {/* Map type control - top right */}
        <div className="absolute top-4 right-4 z-[400]">
          <MapTypeControl mapType={mapType} setMapType={setMapType} />
        </div>
        
        {/* Center button - desktop only */}
        <div className="absolute top-16 right-4 z-[400]">
          <button 
            onClick={handleCenterMap}
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
            title="Centruoti žemėlapį pagal jūsų vietą"
          >
            <MapPin size={20} className="text-blue-500" />
          </button>
        </div>
        
        {/* Filter controls - desktop only */}
        <div className="absolute bottom-4 right-4 z-[400]">
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
          
          {/* Debug button - admin only */}
          {userRole === 'admin' && logState && (
            <button 
              onClick={logState}
              className="mt-2 bg-gray-800 text-white px-2 py-1 text-xs rounded w-full"
            >
              Diagnostika
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MapControls;
