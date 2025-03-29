import React from 'react';
import { Sliders, Thermometer } from 'lucide-react';
import { useMap } from '../../context/MapContext';

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

const FilterControls: React.FC<FilterControlsProps> = ({
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
}) => {
  const { toggleAllLayers } = useMap();

  // Using isFilterOpen for conditional rendering
  if (!isFilterOpen) {
    return (
      <button
        onClick={toggleFilter}
        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
        title="Open filters"
      >
        <Sliders size={20} />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-md p-3 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Filtrai</h3>
        <button 
          onClick={toggleFilter}
          className="text-gray-500"
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
      <div className="flex space-x-2 mb-3 overflow-x-auto py-1">
        <button
          onClick={() => toggleAllLayers(['fishing'], true)}
          className="flex items-center bg-[var(--color-nature-green)] text-white px-4 py-2 rounded-full whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M18 16.5a9 9 0 1 0-9 9 9 9 0 0 0 9-9Z"/>
            <path d="M13 16.5a4 4 0 1 0-4 4 4 4 0 0 0 4-4Z"/>
            <path d="M3 9.5V4.25C3 3.56 3.56 3 4.25 3h4.5C9.44 3 10 3.56 10 4.25V8"/>
            <path d="m7 15 3-3"/>
          </svg>
          Žvejybos vietos
        </button>
        
        <button
          onClick={() => toggleAllLayers(['picnic'], true)}
          className="flex items-center bg-[var(--color-nature-cream)] text-[var(--color-nature-green)] px-4 py-2 rounded-full whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          Pikniko vietos
        </button>
        
        <button
          onClick={() => toggleAllLayers(['swimming'], true)}
          className="flex items-center bg-[var(--color-water-blue)] text-white px-4 py-2 rounded-full whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M2 12h20"/>
            <path d="M2 16h20"/>
            <path d="M2 20h20"/>
            <path d="M4 8h10"/>
            <path d="M14 4h2"/>
            <path d="M14 8c0-2.5 2-4 4-4"/>
          </svg>
          Maudymosi vietos
        </button>
        
        <button
          onClick={() => toggleAllLayers(['camping', 'campsite'], true)}
          className="flex items-center bg-[var(--color-wood-brown)] text-white px-4 py-2 rounded-full whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 20 10 4"/>
            <path d="m5 20 9-16"/>
            <path d="M3 20h18"/>
            <path d="m12 15-3 5"/>
            <path d="m12 15 3 5"/>
          </svg>
          Stovyklavietės
        </button>
      </div>
      <div className="text-xs text-gray-500 flex items-center">
        <Thermometer size={14} className="mr-1" /> 
        Orų duomenys atnaujinti prieš 15 min.
      </div>
    </div>
  );
};

export default FilterControls;
