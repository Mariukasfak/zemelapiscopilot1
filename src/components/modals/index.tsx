import React from 'react';
import AddLocationModal from '../AddLocationModal';
import AuthModal from '../AuthModal';
import { useMap } from '../../context/MapContext';
import { useAuth } from '../../context/AuthContext';

const Modals: React.FC = () => {
  const { showAddLocationModal, setShowAddLocationModal, addLocation, currentPosition } = useMap();
  const { showAuthModal, setShowAuthModal, handleAuthSuccess } = useAuth();

  return (
    <>
      {/* Add location modal */}
      <AddLocationModal 
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        onSave={addLocation}
        currentPosition={currentPosition}
      />
      
      {/* Auth modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Modals;