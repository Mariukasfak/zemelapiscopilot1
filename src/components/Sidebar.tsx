import React, { useState, useEffect } from 'react';
import { Fish, Waves, Tent, Home, DollarSign, Lock, Unlock, MapPin, Flame, ToyBrick as Toy, Utensils, Truck, MountainSnow, User, Shield, ShieldCheck, ChevronLeft, ChevronRight, Users, Search, Megaphone, Filter, Layers, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMap } from '../context/MapContext';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface SidebarProps {
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed: externalCollapsed }) => {
  const { isAuthenticated, userRole, login, logout, user } = useAuth();
  const { layers, toggleLayer, toggleAllLayers, handleAddLocation } = useMap();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showUserModal, setShowUserModal] = useState(false);

  // Sync with external collapsed state if provided
  useEffect(() => {
    if (externalCollapsed !== undefined) {
      setIsCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

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

  // Map category to icon
  const getCategoryIcon = (category: string, color: string) => {
    const iconProps = { size: 20, className: `text-${color}-500` };
    
    switch (category) {
      case 'fishing':
        return <Fish {...iconProps} />;
      case 'swimming':
        return <Waves {...iconProps} />;
      case 'camping':
        return <Tent {...iconProps} />;
      case 'rental':
        return <Home {...iconProps} />;
      case 'paid':
        return <DollarSign {...iconProps} />;
      case 'private':
        return <Lock {...iconProps} />;
      case 'public':
        return <Unlock {...iconProps} />;
      case 'bonfire':
        return <Flame {...iconProps} />;
      case 'playground':
        return <Toy {...iconProps} />;
      case 'picnic':
        return <Utensils {...iconProps} />;
      case 'campsite':
        return <Truck {...iconProps} />;
      case 'extreme':
        return <MountainSnow {...iconProps} />;
      case 'ad':
        return <Megaphone {...iconProps} />;
      default:
        return <MapPin {...iconProps} />;
    }
  };

  // Get role icon
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

  // Check if user can add locations
  const canAddLocation = userRole === 'admin' || userRole === 'moderator' || userRole === 'renter';

  // Get layers for a specific category
  const getLayersForCategory = (categoryKey: string) => {
    const categoryLayers = layerCategories[categoryKey as keyof typeof layerCategories]?.layers || [];
    return layers.filter(layer => categoryLayers.includes(layer.category));
  };

  // Toggle all layers in a category
const toggleCategoryLayers = (categoryKey: string, active: boolean) => {
  const categoryLayers = layerCategories[categoryKey as keyof typeof layerCategories]?.layers || [];
  toggleAllLayers(categoryLayers, active);
};

  // Handle user search
  const handleUserSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Įveskite paieškos užklausą');
      return;
    }
    
    try {
      setLoadingUsers(true);
      
      // Note: We're not using admin.listUsers() as it requires admin privileges
      // Instead, we'll search in user_profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`);
        
      if (profilesError) throw profilesError;
      
      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
        
      if (rolesError) throw rolesError;
      
      // Combine data
      const users = profiles?.map(profile => {
        const role = profile?.role_id ? roles?.find(r => r.id === profile.role_id) : null;
        
        return {
          id: profile.id,
          username: profile.username || 'Vartotojas',
          role: role?.name || 'user',
          roleId: profile.role_id,
          createdAt: profile.created_at
        };
      }) || [];
      
      setUsersList(users);
    } catch (error) {
      console.error('Error searching users:', error);
      
      // Generate mock users if there's an error
      const mockUsers = [
        { id: '1', username: 'admin', role: 'admin', createdAt: new Date().toISOString() },
        { id: '2', username: 'moderator', role: 'moderator', createdAt: new Date().toISOString() },
        { id: '3', username: 'user1', role: 'user', createdAt: new Date().toISOString() },
        { id: '4', username: 'renter1', role: 'renter', createdAt: new Date().toISOString() }
      ];
      
      // Filter mock users based on search query
      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setUsersList(filteredUsers);
      
      alert('Nepavyko ieškoti vartotojų duomenų bazėje. Rodomi pavyzdiniai vartotojai.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setEditingUsername(user.username);
    setSelectedRole(user.role);
    setShowUserModal(true);
  };

  // Handle user update
// src/components/Sidebar.tsx - patobulinta handleUpdateUser funkcija

const handleUpdateUser = async () => {
  if (!selectedUser) return;
  
  try {
    console.log(`Updating user ${selectedUser.id}, changing role to: ${selectedRole}`);
    
    // Išsaugoti pradinę rolę, jei prireiktų grįžti
    const originalRole = selectedUser.role;
    
    // Bandymas #1: Tiesioginis atnaujinimas
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id, name')
        .eq('name', selectedRole)
        .single();
        
      if (roleError) throw roleError;
      if (!roleData || !roleData.id) throw new Error(`Role "${selectedRole}" not found`);
      
      console.log(`Found role: ${roleData.name} with ID ${roleData.id}`);
      
      // Naudojame tiesiogiai SQL užklausą vietoj ORM sluoksnio
      const { error: updateError } = await supabase.rpc('direct_user_role_update', {
        p_user_id: selectedUser.id,
        p_role_id: roleData.id
      });
      
      if (updateError) throw updateError;
      
      console.log('Role updated successfully via direct SQL');
    } catch (err) {
      console.error('Method #1 failed:', err);
      
      // Bandymas #2: Tradicinis atnaujinimas su papildomu tikrinimu
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('name', selectedRole)
          .single();
          
        if (roleError) throw roleError;
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role_id: roleData.id })
          .eq('id', selectedUser.id);
          
        if (updateError) throw updateError;
        
        console.log('Role updated successfully via regular update');
      } catch (err2) {
        console.error('Method #2 failed:', err2);
        throw err2;
      }
    }
    
    // Patikrinkime, ar atnaujinimas pavyko
    const { data: updatedProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('role_id, username')
      .eq('id', selectedUser.id)
      .single();
      
    if (checkError) {
      console.error('Error checking updated profile:', checkError);
    } else {
      console.log('Updated profile:', updatedProfile);
      // Gaukime rolės pavadinimą pagal ID
      const { data: updatedRole } = await supabase
        .from('user_roles')
        .select('name')
        .eq('id', updatedProfile.role_id)
        .single();
        
      console.log('New role name:', updatedRole?.name);
    }
    
    // Update local state
    setUsersList(usersList.map(user => 
      user.id === selectedUser.id 
        ? { ...user, username: editingUsername, role: selectedRole } 
        : user
    ));
    
    setShowUserModal(false);
    alert('Vartotojo informacija atnaujinta!');
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Update local state anyway to provide a good user experience
    setUsersList(usersList.map(user => 
      user.id === selectedUser.id 
        ? { ...user, username: editingUsername, role: selectedRole } 
        : user
    ));
    
    setShowUserModal(false);
    alert('Įvyko klaida atnaujinant vartotoją, tačiau informacija atnaujinta lokalioje sesijoje.');
  }
};

  // Handle logout with confirmation
  const handleLogoutClick = () => {
    if (window.confirm('Ar tikrai norite atsijungti?')) {
      console.log("Logout confirmed by user");
      logout();
    }
  };

  return (
    <div className={`bg-white h-full flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-64'}`}>
      {/* Collapse toggle button - only show on desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded-r-md shadow-md z-10"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      
      {!isCollapsed && (
        <>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">Lietuvos Žemėlapis</h1>
            <p className="text-sm text-gray-600">Poilsiavietės ir aktyvios zonos</p>
          </div>
          
          {isAuthenticated && (
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
          )}
          
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
          
          {(isAuthenticated && canAddLocation) && (
            <div className="p-4 border-b">
              <button
                onClick={() => handleAddLocation()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
              >
                <MapPin size={16} className="mr-2" />
                Pridėti naują vietą
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Arba dešiniu pelės mygtuku paspauskite žemėlapyje
              </p>
            </div>
          )}
          
          {/* Admin user management section */}
          {isAuthenticated && userRole === 'admin' && (
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
          )}
          
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
        </>
      )}
      
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 space-y-6 w-full">
          <MapPin size={24} className="text-blue-600" />
          
          {isAuthenticated && getRoleIcon()}
          
          {/* Add location button in collapsed mode */}
          {(isAuthenticated && canAddLocation) && (
            <button
              onClick={() => handleAddLocation()}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
              title="Pridėti naują vietą"
            >
              <MapPin size={20} />
            </button>
          )}
          
          {/* Admin tools in collapsed mode */}
          {isAuthenticated && userRole === 'admin' && (
            <button
              onClick={() => {
                setIsCollapsed(false);
                setShowUserManagement(true);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full"
              title="Vartotojų valdymas"
            >
              <Users size={20} />
            </button>
          )}
          
          <div className="mt-auto">
            {isAuthenticated ? (
              <button
                onClick={handleLogoutClick}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full"
                title="Atsijungti"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button
                onClick={login}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
                title="Prisijungti"
              >
                <User size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* User edit modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Redaguoti vartotoją</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                El. paštas
              </label>
              <input
                type="text"
                value={selectedUser.email || 'Nėra'}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vartotojo vardas
              </label>
              <input
                type="text"
                value={editingUsername}
                onChange={(e) => setEditingUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rolė
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">Vartotojas</option>
                <option value="renter">Nuomotojas</option>
                <option value="moderator">Moderatorius</option>
                <option value="admin">Administratorius</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Atšaukti
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;