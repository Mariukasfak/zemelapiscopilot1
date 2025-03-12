import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  user: any | null;
  login: () => void;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  handleAuthSuccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [user, setUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Pirmiausia patikriname, ar nėra pasenusių žetonų
        const hasLocalToken = localStorage.getItem('sb-fliivvucsnqvycajbpoe-auth-token');
        
        // Jei randame lokalų žetoną, bet jis galimai negalioja, iš karto valome
        if (hasLocalToken) {
          try {
            // Bandome gauti sesiją
            const { data } = await supabase.auth.getSession();
            const hasSession = !!data.session;
            
            console.log("Initial auth check:", hasSession ? "Authenticated" : "Not authenticated");
            setIsAuthenticated(hasSession);
            
            if (data.session) {
              setUser(data.session.user);
              await fetchUserRole(data.session.user.id);
            } else {
              // Jei nėra sesijos, bet yra lokalus žetonas, valome
              await clearAuthData();
              setIsAuthenticated(false);
              setUser(null);
              setUserRole('user');
            }
          } catch (error) {
            console.error("Error during session check:", error);
            // Jei įvyko klaida, valome autentifikacijos duomenis
            await clearAuthData();
            setIsAuthenticated(false);
            setUser(null);
            setUserRole('user');
          }
        } else {
          // Jei nėra lokalaus žetono, nustatome būseną į neprisijungusio
          setIsAuthenticated(false);
          setUser(null);
          setUserRole('user');
        }
      } catch (error) {
        console.error("Error during initial auth check:", error);
        // Bet kokios klaidos atveju valome duomenis
        await clearAuthData();
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('user');
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('user');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery if needed
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // New function to clear auth data in case of corruption
  const clearAuthData = async () => {
    try {
      // Bandome atsijungti per Supabase
      await supabase.auth.signOut({ scope: 'local' });
      
      // Valome visus su Supabase susijusius localStorage elementus
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Tiesiogiai valome specifinius žetonus
      localStorage.removeItem('sb-fliivvucsnqvycajbpoe-auth-token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.expires_at');
      
      // Valome visą sessionStorage
      sessionStorage.clear();
      
      console.log("Auth data cleared successfully");
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      
      // Get user role
      const { data: roleData, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        // If we can't fetch the role, set a default role
        setUserRole('user');
        return;
      }
      
      if (roleData?.role_id) {
        // Get role name
        const { data: role, error: roleError } = await supabase
          .from('user_roles')
          .select('name')
          .eq('id', roleData.role_id)
          .single();
          
        if (roleError) {
          console.error('Error fetching role:', roleError);
          // If we can't fetch the role name, set a default role
          setUserRole('user');
          return;
        }
        
        if (role) {
          console.log("User role:", role.name);
          setUserRole(role.name as UserRole);
        } else {
          // Default to user if role name not found
          setUserRole('user');
        }
      } else {
        // Default to user if role_id not found
        setUserRole('user');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      // Default to user role if there's an error
      setUserRole('user');
    }
  };

  const login = () => {
    setShowAuthModal(true);
  };

// src/context/AuthContext.tsx - pakeiskite logout funkciją

const logout = async () => {
  console.log("Logout initiated");
  
  try {
    // Pirma atnaujinkite būseną, kad UI iš karto reaguotų
    setIsAuthenticated(false);
    setUser(null);
    setUserRole('user');
    
    // Tada išvalykite duomenis
    await clearAuthData();
    
    console.log("Logout successful");
    
    // Naudojame window.location.pathname vietoj URL su parametrais
    const currentPath = window.location.pathname || '/';
    window.location.href = currentPath;
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    
    // Jei nepavyko, bandome dar kartą su kitokiu metodu
    try {
      // Bandome dar kartą išvalyti
      localStorage.clear();
      sessionStorage.clear();
      
      // Dar vienas bandymas be parametrų
      window.location.href = '/';
    } catch {
      // Paskutinis variantas - tiesiog perkrauname puslapį
      window.location.reload();
    }
  }
};

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        userRole,
        user,
        login, 
        logout, 
        showAuthModal, 
        setShowAuthModal,
        handleAuthSuccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
