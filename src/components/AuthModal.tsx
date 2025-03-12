import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up flow
        console.log("Starting sign up process with username:", username);
        
        // First, create the auth user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || undefined
            }
          }
        });
        
        if (error) throw error;
        
        // Check if user was created successfully
        if (!data.user) {
          throw new Error('User creation failed');
        }
        
        console.log("User created:", data.user.id);
        
        // Now, explicitly create or update the user profile
        // This is a failsafe in case the database trigger doesn't work
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            username: username || email.split('@')[0],
            // Set default role_id for "user" role - you may need to get this from your database
            role_id: await getDefaultRoleId()
          });
            
        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Continue anyway, as the user was created successfully
        } else {
          console.log("User profile created successfully");
        }
        
        // On successful sign up
        onSuccess();
        onClose();
        
        // Force page reload to ensure all components update with new auth state
        window.location.reload();
      } else {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // On successful login
        onSuccess();
        onClose();
        
        // Force page reload to ensure all components update with new auth state
        window.location.reload();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the default role ID for new users
  const getDefaultRoleId = async (): Promise<string> => {
    try {
      // Try to get the "user" role ID from the database
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'user')
        .single();
        
      if (error || !data) {
        console.error("Error fetching default role ID:", error);
        return ""; // Return empty string if role not found
      }
      
      return data.id;
    } catch (error) {
      console.error("Error in getDefaultRoleId:", error);
      return ""; // Return empty string on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isSignUp ? 'Registracija' : 'Prisijungimas'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              El. paštas
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vartotojo vardas
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Neprivalomas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Jei neįvesite, bus naudojamas el. pašto adresas
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slaptažodis
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Palaukite...' : isSignUp ? 'Registruotis' : 'Prisijungti'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-blue-500 hover:text-blue-700 text-sm"
            >
              {isSignUp ? 'Jau turite paskyrą? Prisijunkite' : 'Neturite paskyros? Registruokitės'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              Grįžti į žemėlapį
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;