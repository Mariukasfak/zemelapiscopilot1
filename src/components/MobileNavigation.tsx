import React, { useState, useEffect } from 'react';
import { Layers, X, Filter, MapPin, Menu, Settings, Plus, User, LogOut, Home, Heart, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMap } from '../context/MapContext';
import Search from './Search';

const MobileNavigation: React.FC = () => {
  const { isAuthenticated, userRole, login, logout, user } = useAuth();
  const { layers, toggleLayer, toggleAllLayers, handleAddLocation } = useMap();
  const [filterDistance, setFilterDistance] = useState('10');
  const [menuOpen, setMenuOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeRating, setActiveRating] = useState(0);
  const [activePaymentFilter, setActivePaymentFilter] = useState('all'); // 'all', 'free', 'paid'
  
  // Kategorijos sluoksnių rūšiavimui
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
    }
  };
  
  // Gauti sluoksnius pagal kategoriją
  const getLayersForCategory = (categoryKey: string) => {
    const categoryLayers = layerCategories[categoryKey as keyof typeof layerCategories]?.layers || [];
    return layers.filter(layer => categoryLayers.includes(layer.category));
  };
  
  // Toggling all layers in a category
const toggleCategoryLayers = (categoryKey: string, active: boolean) => {
  const categoryLayers = layerCategories[categoryKey as keyof typeof layerCategories]?.layers || [];
  toggleAllLayers(categoryLayers, active);
};
  
  // Gauti rolės ikoną
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded ml-1">Admin</span>;
      case 'moderator':
        return <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded ml-1">Mod</span>;
      case 'renter':
        return <span className="text-xs bg-green-500 text-white px-1 py-0.5 rounded ml-1">Nuom.</span>;
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Viršutinė navigacijos juosta */}
<div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 flex justify-between items-center p-2">
  <button 
    onClick={() => setMenuOpen(true)}
    className="p-2 rounded-full hover:bg-gray-100"
  >
    <Menu size={24} />
  </button>
  
  <div className="flex-1 mx-2">
    <Search />
  </div>
  
  <div className="flex">
    <button 
      onClick={() => setLayersOpen(true)}
      className="p-2 rounded-full hover:bg-gray-100 mr-1"
      title="Sluoksniai"
    >
      <Layers size={22} />
    </button>
    
    <button 
      onClick={() => setFiltersOpen(true)}
      className="p-2 rounded-full hover:bg-gray-100"
      title="Filtrai"
    >
      <Filter size={22} />
    </button>
  </div>
</div>
      
      {/* Apatinis navigacijos meniu */}
<div className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-50 flex justify-around items-center p-2">
  <button 
    onClick={() => setLayersOpen(true)}
    className="p-2 rounded-full hover:bg-gray-100 flex flex-col items-center"
  >
    <Layers size={20} />
    <span className="text-xs">Sluoksniai</span>
  </button>
  
  {isAuthenticated && (
    <button 
      onClick={() => handleAddLocation()}
      className="p-3 rounded-full bg-blue-500 text-white -mt-4 shadow-lg"
    >
      <Plus size={24} />
    </button>
  )}
  
  <button 
    onClick={() => isAuthenticated ? setShowUserModal(true) : login()}
    className="p-2 rounded-full hover:bg-gray-100 flex flex-col items-center"
  >
    <User size={20} />
    <span className="text-xs">{isAuthenticated ? 'Profilis' : 'Prisijungti'}</span>
  </button>
</div>
      
      {/* Sluoksnių šoninis meniu */}
{layersOpen && (
  <div className="fixed inset-0 z-[1100] flex">
    <div 
      className="absolute inset-0 bg-black bg-opacity-40"
      onClick={() => setLayersOpen(false)}
    />
              
          <div className="relative bg-white h-full w-64 shadow-lg transform transition-transform duration-300 ease-in-out ml-0 z-10 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="font-bold">Sluoksniai</h2>
              <button 
                onClick={() => setLayersOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Kategorinis sluoksnių grupavimas */}
              {Object.entries(layerCategories).map(([key, category]) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    <div className="flex space-x-1">
                    <button 
  onClick={() => toggleCategoryLayers(key, true)}
  className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded"
>
  Įjungti visus
</button>
<button 
  onClick={() => toggleCategoryLayers(key, false)}
  className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded"
>
  Išjungti visus
</button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-2">
                    {getLayersForCategory(key).map(layer => (
                      <div key={layer.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`mobile-layer-${layer.id}`}
                          checked={layer.isActive}
                          onChange={() => toggleLayer(layer.id)}
                          className="mr-2"
                        />
                        <label 
                          htmlFor={`mobile-layer-${layer.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {layer.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Filtravimo šoninis meniu */}
{filtersOpen && (
  <div className="fixed inset-0 z-[1100] flex justify-end">
    <div 
      className="absolute inset-0 bg-black bg-opacity-40"
      onClick={() => setFiltersOpen(false)}
    />
              
          <div className="relative bg-white h-full w-64 shadow-lg transform transition-transform duration-300 ease-in-out z-10 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="font-bold">Filtrai</h2>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium mb-2">Įvertinimas</h3>
              <div className="flex flex-wrap gap-2 mb-4">
  {[0, 1, 2, 3, 4, 5].map(rating => (
    <button 
      key={rating}
      onClick={() => {
        setActiveRating(rating);
        // Išsiunčiame įvykį su nauja reitingo reikšme
        const event = new CustomEvent('setFilterRating', {
          detail: { value: rating }
        });
        document.dispatchEvent(event);
      }}
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        rating === activeRating ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}
    >
      {rating === 0 ? 'Visi' : rating}
    </button>
  ))}
</div>
              
              <h3 className="font-medium mb-2">Tipas</h3>
              <div className="flex flex-wrap gap-2 mb-4">
  <button 
    onClick={() => {
      if (activePaymentFilter === 'free') {
        setActivePaymentFilter('all');
        // Išjungiame visus filtrus
        const event = new CustomEvent('setFilterPaidStatus', {
          detail: { showFreeOnly: false, showPaidOnly: false }
        });
        document.dispatchEvent(event);
      } else {
        setActivePaymentFilter('free');
        // Įjungiame nemokamų filtrą
        const event = new CustomEvent('setFilterPaidStatus', {
          detail: { showFreeOnly: true, showPaidOnly: false }
        });
        document.dispatchEvent(event);
      }
    }}
    className={`px-3 py-1 rounded text-sm ${
      activePaymentFilter === 'free' ? 'bg-green-500 text-white' : 'bg-gray-100'
    }`}
  >
    Nemokama
  </button>
  <button 
    onClick={() => {
      if (activePaymentFilter === 'paid') {
        setActivePaymentFilter('all');
        // Išjungiame visus filtrus
        const event = new CustomEvent('setFilterPaidStatus', {
          detail: { showFreeOnly: false, showPaidOnly: false }
        });
        document.dispatchEvent(event);
      } else {
        setActivePaymentFilter('paid');
        // Įjungiame mokamų filtrą
        const event = new CustomEvent('setFilterPaidStatus', {
          detail: { showFreeOnly: false, showPaidOnly: true }
        });
        document.dispatchEvent(event);
      }
    }}
    className={`px-3 py-1 rounded text-sm ${
      activePaymentFilter === 'paid' ? 'bg-amber-500 text-white' : 'bg-gray-100'
    }`}
  >
    Mokama
  </button>
</div>
              
              <h3 className="font-medium mb-2">Atstumas nuo manęs</h3>
<div className="relative">
  <input 
    type="range" 
    min="0" 
    max="100" 
    className="w-full"
    value={filterDistance}
    onChange={(e) => {
      setFilterDistance(e.target.value);
      // Perduodame į pagrindinį komponentą per event bus
      const event = new CustomEvent('setFilterRadius', {
        detail: {
          value: parseInt(e.target.value)
        }
      });
      document.dispatchEvent(event);
    }}
  />
  <div className="flex justify-between text-xs text-gray-500 mt-1">
    <span>Išjungta</span>
    <span className="absolute left-1/2 transform -translate-x-1/2 text-blue-500 font-medium">
      {filterDistance === "0" ? "Viskas" : `${filterDistance}km`}
    </span>
    <span>100km</span>
  </div>
</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pagrindinis šoninis meniu */}
{menuOpen && (
  <div className="fixed inset-0 z-[1100] flex">
    <div 
      className="absolute inset-0 bg-black bg-opacity-40"
      onClick={() => setMenuOpen(false)}
    />
          
          <div className="relative bg-white h-full w-64 shadow-lg transform transition-transform duration-300 ease-in-out ml-0 z-10 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="font-bold">Meniu</h2>
              <button 
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {isAuthenticated ? (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center font-medium">
                    <User size={16} className="mr-1" />
                    {user?.email}
                    {getRoleIcon()}
                  </div>
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="mt-2 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Atsijungti
                  </button>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm">Prisijunkite, kad galėtumėte pridėti naujas vietas ir rašyti atsiliepimus.</p>
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      login();
                    }}
                    className="mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Prisijungti
                  </button>
                </div>
              )}
              
              <nav>
                <ul>
                  <li className="mb-2">
                    <a href="#" className="block p-2 hover:bg-gray-100 rounded">
                      Žemėlapis
                    </a>
                  </li>
                  {isAuthenticated && (
                    <>
                      <li className="mb-2">
                        <a href="#" className="block p-2 hover:bg-gray-100 rounded">
                          Mano išsaugotos vietos
                        </a>
                      </li>
                      <li className="mb-2">
                        <a 
                          href="#" 
                          className="block p-2 hover:bg-gray-100 rounded"
                          onClick={() => {
                            setMenuOpen(false);
                            handleAddLocation();
                          }}
                        >
                          Pridėti naują vietą
                        </a>
                      </li>
                    </>
                  )}
                  <li className="mb-2">
                    <a href="#" className="block p-2 hover:bg-gray-100 rounded">
                      Nustatymai
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="#" className="block p-2 hover:bg-gray-100 rounded">
                      Apie programą
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Vartotojo profilio modalinis langas */}
      {showUserModal && (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center">
    <div 
      className="absolute inset-0 bg-black bg-opacity-40"
      onClick={() => setShowUserModal(false)}
    />
    
    <div className="relative bg-white rounded-lg w-80 max-w-md shadow-lg p-4 z-10">
      <div className="text-center mb-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <User size={32} className="text-blue-600" />
        </div>
        <h2 className="font-bold mb-1">{user?.email || 'Vartotojas'}</h2>
        <p className="text-sm text-gray-500">
          {getRoleIcon()}
          <span className="ml-1">
            {userRole === 'admin' ? 'Administratorius' : 
             userRole === 'moderator' ? 'Moderatorius' : 
             userRole === 'renter' ? 'Nuomotojas' : 'Vartotojas'}
          </span>
        </p>
      </div>
      
      <div className="space-y-2 mb-4">
        <button className="w-full flex items-center p-2 rounded hover:bg-gray-100">
          <Settings size={16} className="mr-2 text-gray-600" />
          <span>Paskyros nustatymai</span>
        </button>
        <button className="w-full flex items-center p-2 rounded hover:bg-gray-100">
          <Heart size={16} className="mr-2 text-gray-600" />
          <span>Mano mėgstamos vietos</span>
        </button>
        <button className="w-full flex items-center p-2 rounded hover:bg-gray-100">
          <Bell size={16} className="mr-2 text-gray-600" />
          <span>Pranešimai</span>
        </button>
        <button className="w-full flex items-center p-2 rounded hover:bg-gray-100">
          <HelpCircle size={16} className="mr-2 text-gray-600" />
          <span>Pagalba</span>
        </button>
      </div>
      
      <div className="border-t pt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Nario statusas:</span>
            <span className="font-medium text-blue-600">Standartinis</span>
          </div>
          
          <button 
            onClick={() => {
              setShowUserModal(false);
              logout();
            }}
            className="w-full py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 mb-2 flex items-center justify-center"
          >
            <LogOut size={16} className="mr-2" />
            Atsijungti
          </button>
          
          <button 
            onClick={() => setShowUserModal(false)}
            className="w-full py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Uždaryti
          </button>
        </div>
      </div>
    </div>
  </div>
)}
</>
  );
};

export default MobileNavigation;