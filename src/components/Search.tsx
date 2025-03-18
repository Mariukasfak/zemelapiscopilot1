import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useMap } from '../context/MapContext';

interface SearchProps {
  onResultClick?: (location: any) => void;
}

const Search: React.FC<SearchProps> = ({ onResultClick }) => {
  const { locations } = useMap();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredLocations([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = locations.filter((location) =>
      location.name?.toLowerCase().includes(term) ||
      location.description?.toLowerCase().includes(term) ||
      location.categories?.some((category: string) => category.toLowerCase().includes(term))
    );

    // Limit to 5 results for better UX
    setFilteredLocations(filtered.slice(0, 5));
  }, [searchTerm, locations]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsResultsVisible(true);
  };

  const handleResultClick = (location: any) => {
    if (onResultClick) {
      onResultClick(location);
    }
    
    // Dispatch an event for the map to handle
    document.dispatchEvent(new CustomEvent('mapCenter', {
      detail: {
        lat: location.latitude,
        lng: location.longitude,
        zoom: 16
      }
    }));
    
    setSearchTerm('');
    setIsResultsVisible(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredLocations([]);
  };

  return (
    <div className="relative z-[450]" ref={searchContainerRef}>
      <div className="flex items-center bg-white rounded-md shadow-md">
        <div className="p-2 text-gray-400">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          placeholder="Ieškoti vietų..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsResultsVisible(true)}
          className="w-full py-2 pr-8 focus:outline-none rounded-md"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search results */}
      {isResultsVisible && filteredLocations.length > 0 && (
        <div className="absolute w-full mt-1 max-h-60 bg-white rounded-md overflow-y-auto shadow-md">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleResultClick(location)}
            >
              <div className="font-medium">{location.name}</div>
              {location.categories && location.categories.length > 0 && (
                <div className="text-xs text-gray-500">
                  {location.categories.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {isResultsVisible && searchTerm && filteredLocations.length === 0 && (
        <div className="absolute w-full mt-1 p-3 bg-white rounded-md shadow-md">
          <div className="text-gray-500">Nieko nerasta</div>
        </div>
      )}
    </div>
  );
};

export default Search;
