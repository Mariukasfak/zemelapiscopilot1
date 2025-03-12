import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

// Sign up with email and password
export const signUp = async (email: string, password: string, username?: string) => {
  try {
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
    
    // Create or update user profile with username
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          username: username || email.split('@')[0]
        });
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Get user role
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    // Get user role
    const { data: roleData, error } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Supabase request failed', error);
      return 'user';
    }
    
    if (roleData?.role_id) {
      // Get role name
      const { data: role } = await supabase
        .from('user_roles')
        .select('name')
        .eq('id', roleData.role_id)
        .single();
        
      if (role) {
        return role.name as UserRole;
      }
    }
    
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, data: { username?: string, role_id?: string }) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Search users by username
export const searchUsers = async (query: string) => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('username', `%${query}%`);
      
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
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};