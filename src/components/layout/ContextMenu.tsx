import React from 'react';
import { MapPin } from 'lucide-react';
import { useMap } from '../../context/MapContext';

const ContextMenu: React.FC = () => {
  const { contextMenuPosition, handleAddLocation, currentPosition } = useMap();

  if (!contextMenuPosition) return null;

  return (
    <div 
      className="fixed bg-white rounded-md shadow-lg z-[1000] overflow-hidden"
      style={{ 
        left: `${contextMenuPosition.x}px`, 
        top: `${contextMenuPosition.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col">
        <button 
          className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
          onClick={() => handleAddLocation(currentPosition)}
        >
          <MapPin size={16} className="mr-2" />
          Pridėti naują vietą
        </button>
      </div>
    </div>
  );
};

export default ContextMenu;