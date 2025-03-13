import React from 'react';
import { Location } from '../../types';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Location) => void;
  location: Location;
}

// Temporary solution until LocationFormModal is available
const EditLocationModal: React.FC<EditLocationModalProps> = ({ isOpen, onClose, onSave, location }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Edit Location: {location.name}</h2>
        <p className="text-gray-500">
          LocationFormModal is being implemented. This is a temporary placeholder.
        </p>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md mr-2"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(location);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLocationModal;
