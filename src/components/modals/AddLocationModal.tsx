import React from 'react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: any) => void;
  currentPosition?: [number, number];
}

// Temporary solution until LocationFormModal is available
const AddLocationModal: React.FC<AddLocationModalProps> = ({ isOpen, onClose, onSave, currentPosition }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Add Location</h2>
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
              onSave({
                name: 'New Location',
                description: '',
                latitude: currentPosition ? currentPosition[0] : 55.1694,
                longitude: currentPosition ? currentPosition[1] : 23.8813,
              });
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;
