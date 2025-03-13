import React from 'react';
import { 
  Fish, Waves, Tent, Home, DollarSign, Lock, Unlock, 
  MapPin, Flame, ToyBrick as Toy, Utensils, Truck, 
  MountainSnow, User, Shield, ShieldCheck, ChevronRight, 
  Users, Search, Megaphone, LogOut 
} from 'lucide-react';
import { UserRole, MapLayer } from '../../types';

// Component for user profile section
export const UserProfileSection: React.FC<{
  isAuthenticated: boolean;
  userRole: UserRole;
  user: any;
}> = ({ isAuthenticated, userRole, user }) => {
  if (!isAuthenticated) return null;
  
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <ShieldCheck size={16} className="text-red-500 mr-1" />;
      case 'moderator':
        return <Shield size={16} className="text-blue-500 mr-1" />;
      case 'renter':
        return <Home size={16} className="text-green-500 mr-1" />;
      default:
        return <User size={16} className="text-gray-500 mr-1" />;
    }
  };
  
  return (
    <div className="p-4 border-b">
      <div className="flex items-center">
        {getRoleIcon()}
        <span className="text-sm font-medium">
          {userRole === 'admin' ? 'Administratorius' : 
           userRole === 'moderator' ? 'Moderatorius' : 
           userRole === 'renter' ? 'Nuomotojas' : 'Vartotojas'}
        </span>
      </div>
      {user && (
        <div className="text-xs text-gray-500 mt-1">
          {user.email}
        </div>
      )}
    </div>
  );
};

// Component for layers section
export const LayersSection: React.FC<{
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  toggleAllLayers: (categoryLayers: string[], active: boolean) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
}> = ({ layers, toggleLayer, toggleAllLayers, activeCategory, setActiveCategory }) => {
  // Group layers by category
  const layerCategories = {
    'accommodation': {
      name: 'Apgyvendinimas',
      layers: ['campsite', 'camping', 'rental']
    },
    'nature': {
      name: 'Gamtos objektai',
      layers: ['fishing', 'swimming', 'bonfire', 'picnic']
    },
    'activities': {
      name: 'Aktyvus laisvalaikis',
      layers: ['playground', 'extreme']
    },
    'access': {
      name: 'Prieinamumas',
      layers: ['paid', 'private']
    },
    'other': {
      name: 'Kita',
      layers: ['ad']
    }
  };
  
  // Get layers for a specific category
  const getLayersForCategory = (categoryKey: string) => {
    const categoryLayers = layerCategories[categoryKey as keyof typeof layerCategories]?.layers || [];
    return layers.filter(layer => categoryLayers.includes(layer.category));
  };
  
  // Map category to icon
  const getCategoryIcon = (category: string, color: string) => {
    const iconProps = { size: 20, className: `text-${color}-500` };
    
    switch (category) {
      case 'fishing': return <Fish {...iconProps} />;
      case 'swimming': return <Waves {...iconProps} />;
      case 'camping': return <Tent {...iconProps} />;
      case 'rental': return <Home {...iconProps} />;
      case 'paid': return <DollarSign {...iconProps} />;
      case 'private': return <Lock {...iconProps} />;
      case 'public': return <Unlock {...iconProps} />;
      case 'bonfire': return <Flame {...iconProps} />;
      case 'playground': return <Toy {...iconProps} />;
      case 'picnic': return <Utensils {...iconProps} />;
      case 'campsite': return <Truck {...iconProps} />;
      case 'extreme': return <MountainSnow {...iconProps} />;
      case 'ad': return <Megaphone {...iconProps} />;
      default: return <MapPin {...iconProps} />;
    }
  };
  
  return (
    <div className="p-4 border-b">
      <h2 className="font-semibold mb-2">Sluoksniai</h2>
      
      {/* Category-based layer organization */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {Object.entries(layerCategories).map(([key, category]) => (
          <div key={key} className="space-y-1">
            <button 
              className="flex items-center justify-between w-full text-left font-medium text-sm"
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            >
              <span>{category.name}</span>
              <ChevronRight 
                size={16} 
                className={`transform transition-transform ${activeCategory === key ? 'rotate-90' : ''}`}
              />
            </button>
            
            {activeCategory === key && (
              <div className="pl-2 space-y-1 border-l-2 border-gray-200">
                {/* Toggle all button */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Visi sluoksniai</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => toggleAllLayers(layerCategories[key as keyof typeof layerCategories].layers, true)}
                      className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded"
                    >
                      Įjungti visus
                    </button>
                    <button 
                      onClick={() => toggleAllLayers(layerCategories[key as keyof typeof layerCategories].layers, false)}
                      className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded"
                    >
                      Išjungti visus
                    </button>
                  </div>
                </div>
                
                {getLayersForCategory(key).map(layer => (
                  <div 
                    key={layer.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`layer-${layer.id}`}
                      checked={layer.isActive}
                      onChange={() => toggleLayer(layer.id)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <label 
                      htmlFor={`layer-${layer.id}`}
                      className="flex items-center cursor-pointer"
                    >
                      {getCategoryIcon(layer.category, layer.color)}
                      <span className="ml-2 text-sm">{layer.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for add location button
export const AddLocationButton: React.FC<{
  isAuthenticated: boolean;
  canAddLocation: boolean;
  handleAddLocation: () => void;
}> = ({ isAuthenticated, canAddLocation, handleAddLocation }) => {
  if (!isAuthenticated || !canAddLocation) return null;
  
  return (
    <div className="p-4 border-b">
      <button
        onClick={handleAddLocation}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
      >
        <MapPin size={16} className="mr-2" />
        Pridėti naują vietą
      </button>
      <p className="text-xs text-gray-500 mt-1 text-center">
        Arba dešiniu pelės mygtuku paspauskite žemėlapyje
      </p>
    </div>
  );
};

// Component for admin tools section
export const AdminToolsSection: React.FC<{
  isAuthenticated: boolean;
  userRole: UserRole;
  showUserManagement: boolean;
  setShowUserManagement: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleUserSearch: () => void;
  usersList: any[];
  loadingUsers: boolean;
  handleSelectUser: (user: any) => void;
}> = ({ 
  isAuthenticated, 
  userRole, 
  showUserManagement, 
  setShowUserManagement,
  searchQuery,
  setSearchQuery,
  handleUserSearch,
  usersList,
  loadingUsers,
  handleSelectUser
}) => {
  if (!isAuthenticated || userRole !== 'admin') return null;
  
  return (
    <div className="p-4 border-b">
      <h2 className="font-semibold mb-2">Administravimas</h2>
      <div className="space-y-2">
        <button
          onClick={() => setShowUserManagement(!showUserManagement)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md flex items-center justify-center"
        >
          <Users size={16} className="mr-2" />
          Vartotojų valdymas
        </button>
        
        {showUserManagement && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <div className="flex mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ieškoti vartotojo..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded-l-md text-sm"
              />
              <button
                onClick={handleUserSearch}
                className="bg-blue-500 text-white px-2 py-1 rounded-r-md"
              >
                <Search size={14} />
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : usersList.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                {usersList.map(user => (
                  <div 
                    key={user.id} 
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                        {user.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-xs text-gray-500 py-2">
                Nerasta vartotojų pagal paiešką
              </p>
            ) : (
              <p className="text-xs text-gray-500 py-2">
                Įveskite paieškos užklausą ir spauskite paieškos mygtuką
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Component for authentication buttons
export const AuthButtons: React.FC<{
  isAuthenticated: boolean;
  login: () => void;
  handleLogoutClick: () => void;
}> = ({ isAuthenticated, login, handleLogoutClick }) => {
  return (
    <div className="mt-auto p-4 border-t">
      {isAuthenticated ? (
        <button
          onClick={handleLogoutClick}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md flex items-center justify-center"
        >
          <LogOut size={16} className="mr-2" />
          Atsijungti
        </button>
      ) : (
        <button
          onClick={login}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
        >
          <User size={16} className="mr-2" />
          Prisijungti
        </button>
      )}
    </div>
  );
};