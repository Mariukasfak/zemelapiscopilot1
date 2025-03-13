/**
 * User roles in the system
 */
export type UserRole = 'user' | 'renter' | 'moderator' | 'admin';

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  email?: string;
  role_id?: string;
  role?: UserRole;
  created_at: string;
  is_blocked?: boolean;
}

/**
 * Auth context state
 */
export interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  user: any | null; // Using any because Supabase type might be complex
  login: () => void;
  logout: () => void;
  loading: boolean;
}
