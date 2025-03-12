import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using fallback values for development.');
}

// Global error handler for Supabase connection issues
const handleConnectionError = (error: any) => {
  console.error('Supabase connection error:', error);
  
  // You can implement additional error handling logic here
  // For example, show a notification to the user
};

// Create a Supabase client with proper error handling
export const supabase = createClient(
  supabaseUrl || 'https://fliivvucsnqvycajbpoe.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsaWl2dnVjc25xdnljYWpicG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NzQ2OTAsImV4cCI6MjA1NjI1MDY5MH0.-JORInJEW0ji2-DRDdHrw03xhOkXXEsePyhmK3uUY3E',
  {
    auth: {
      persistSession: true, // Default is true, but setting explicitly for clarity
      autoRefreshToken: true, // Default is true, but setting explicitly
      detectSessionInUrl: true, // Default is true, but setting explicitly
    },
    global: {
      fetch: (...args) => {
        return fetch(...args).catch(error => {
          handleConnectionError(error);
          throw error;
        });
      }
    }
  }
);

// Add a wrapper function to handle Supabase API calls with fallback
export const safeSupabaseCall = async <T>(
  apiCall: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T | null = null
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await apiCall();
    
    if (result.error) {
      console.warn('Supabase API call failed:', result.error);
      return { data: fallbackData, error: result.error };
    }
    
    return result;
  } catch (error) {
    console.error('Error in Supabase API call:', error);
    return { data: fallbackData, error };
  }
};

// Check if the session has expired
export const isSessionExpired = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !data.session;
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return true; // Assume expired on error
  }
};

// Force logout function that bypasses Supabase API
export const forceLogout = () => {
  console.log("Executing force logout");
  
  // Clear all Supabase-related items from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      console.log(`Removing localStorage item: ${key}`);
      localStorage.removeItem(key);
    }
  }
  
  // Clear specific known Supabase tokens
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('supabase.auth.refreshToken');
  localStorage.removeItem('supabase.auth.expires_at');
  
  // Clear all sessionStorage
  sessionStorage.clear();
  
  console.log("Force logout complete, redirecting to home page");
  
  // Reload the page to reset all app state
  window.location.href = '/';
};