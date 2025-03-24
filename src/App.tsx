import { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import ContextMenu from './components/layout/ContextMenu';
import Modals from './components/modals';
import { AuthProvider } from './context/AuthContext';
import { MapProvider } from './context/MapContext';
import { supabase } from './lib/supabase';
import MobileNavigation from './components/MobileNavigation';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Atnaujinimas ekrano dydžio pasikeitimui stebėti
useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    
    // Tikslesnis mobilaus įrenginio aptikimas pagal dydį ir kraštinių santykį
    setIsMobile(width < 768 || (width < 1024 && aspectRatio < 1));
  };
  
  // Iškviečiame iš karto, kad nustatytume pradinę būseną
  handleResize();
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  // Patikrinkime autentifikacijos būseną
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // Check if session exists
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session check error:", error);
          setAuthError("Nepavyko patikrinti prisijungimo būsenos");
        }
        
        // Log auth change for debugging
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event);
        });
        
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Unexpected auth check error:", error);
        setAuthError("Įvyko nenumatyta klaida tikrinant prisijungimą");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="font-bold mb-2">Klaida prisijungiant</h2>
          <p>{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Bandyti dar kartą
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <MapProvider>
        <div className="h-screen flex flex-col md:flex-row overflow-hidden">
          {isMobile ? (
            // Mobilaus vaizdo komponentai
            <>
              <MobileNavigation />
              <div className="absolute inset-0 pt-14 pb-16">
                <Map />
              </div>
            </>
          ) : (
            // Įprasto vaizdo komponentai
            <>
              <div className="w-full md:w-auto md:h-full">
                <Sidebar />
              </div>
              <div className="flex-1 h-full">
                <Map />
              </div>
            </>
          )}
          <ContextMenu />
          <Modals />
        </div>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;