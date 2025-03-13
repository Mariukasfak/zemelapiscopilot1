import React from 'react';
import { Sliders, Thermometer } from 'lucide-react';

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
      <div className="text-xs text-gray-500 flex items-center">
        <Thermometer size={14} className="mr-1" /> 
        Orų duomenys atnaujinti prieš 15 min.
      </div>
    </div>
  );
};

export default FilterControls;
