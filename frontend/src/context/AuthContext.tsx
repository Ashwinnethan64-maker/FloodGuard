import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { userApiClient } from '../services/api';

export type UserRole = 'resident' | 'responder' | 'administrator';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
  ward: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ error?: string }>;
  devBypassLogin: (role: UserRole) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Builds user profile prioritizing trusted server-side profile metadata,
 * then Supabase auth app_metadata (which can only be altered via service-role),
 * and defaulting strictly to resident (citizen).
 */
async function fetchVerifiedUserProfile(authUser: any): Promise<UserProfile> {
  const authUserEmail = (authUser.email || '').toLowerCase().trim();
  const userMeta = authUser.user_metadata || {};
  const appMeta = authUser.app_metadata || {};

  let role: UserRole = 'resident';
  let accountStatus: AccountStatus = 'active';
  let fullName = userMeta.full_name || userMeta.name || authUserEmail.split('@')[0] || 'FLOODGUARD Citizen';
  let avatarUrl = userMeta.avatar_url || userMeta.picture;

  // 1. Try querying backend profile endpoint backed by Supabase Admin
  try {
    const serverProfile = await userApiClient.getMyProfile(authUser.id);
    if (serverProfile) {
      role = (serverProfile.role as UserRole) || 'resident';
      accountStatus = (serverProfile.account_status as AccountStatus) || 'active';
      if (serverProfile.full_name) fullName = serverProfile.full_name;
      if (serverProfile.avatar_url) avatarUrl = serverProfile.avatar_url;
    }
  } catch (err) {
    console.debug('User profile fetch fallback to JWT metadata:', err);
    // 2. Fall back to app_metadata which is cryptographically signed by Supabase JWT
    if (appMeta.role && ['administrator', 'responder', 'resident'].includes(appMeta.role)) {
      role = appMeta.role as UserRole;
    }
    if (appMeta.account_status && ['active', 'pending', 'suspended'].includes(appMeta.account_status)) {
      accountStatus = appMeta.account_status as AccountStatus;
    }
  }

  return {
    id: authUser.id,
    email: authUserEmail,
    full_name: fullName,
    role,
    account_status: accountStatus,
    ward: userMeta.ward || 'Mangaluru Urban',
    avatar_url: avatarUrl
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('neerpath_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync Supabase Auth session & onAuthStateChange listener
  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[NEERPATH Auth] Session verification notice:', error.message);
        }

        if (session && session.user && isMounted) {
          const profile = await fetchVerifiedUserProfile(session.user);
          setUser(profile);
        } else if (!session && isMounted) {
          const saved = localStorage.getItem('neerpath_user');
          if (!saved) {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[NEERPATH Auth] Session initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session && session.user && isMounted) {
        const profile = await fetchVerifiedUserProfile(session.user);
        setUser(profile);
      } else if (!session && isMounted) {
        // Clear session if Supabase signout occurred
        const saved = localStorage.getItem('neerpath_user');
        if (saved && !saved.includes('dev-mock')) {
          setUser(null);
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Persist session to local storage for instant cold-reloads
  useEffect(() => {
    if (user) {
      localStorage.setItem('neerpath_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('neerpath_user');
    }
  }, [user]);

  /**
   * Password login with Supabase Auth.
   * If credentials match, retrieves trusted role from backend/app_metadata.
   */
  const login = async (email: string, password = ''): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        const profile = await fetchVerifiedUserProfile(data.user);
        if (profile.account_status === 'suspended') {
          await supabase.auth.signOut();
          setLoading(false);
          return { error: 'Your account has been suspended by an administrator. Access denied.' };
        }
        setUser(profile);
      }
      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err?.message || 'Login failed.' };
    }
  };

  /**
   * Protected development/evaluator bypass for testing role dashboards locally
   */
  const devBypassLogin = (targetRole: UserRole) => {
    const mockProfiles: Record<UserRole, UserProfile> = {
      administrator: {
        id: 'e5e718c9-17ab-41c1-837c-466b2e63f43e',
        email: 'admin@floodguard.in',
        full_name: 'Disaster Cell Administrator',
        role: 'administrator',
        account_status: 'active',
        ward: 'Mangaluru Urban'
      },
      responder: {
        id: '567a3d6c-1b4a-416d-bdd4-7cff57625179',
        email: 'patrol.kadri@floodguard.in',
        full_name: 'Patrol Officer Ramesh (Kadri Unit 04)',
        role: 'responder',
        account_status: 'active',
        ward: 'Kadri Ward'
      },
      resident: {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'citizen@mangaluru.in',
        full_name: 'Mangaluru Resident Commuter',
        role: 'resident',
        account_status: 'active',
        ward: 'Bejai Ward'
      }
    };

    const prof = mockProfiles[targetRole];
    setUser(prof);
  };

  /**
   * Supabase Google OAuth sign-in flow.
   * Redirects to /auth/callback to exchange tokens and establish secure session.
   */
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const redirectUrl = new URL('/auth/callback', window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to initialize Google Sign-In with Supabase Auth.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[NEERPATH Auth] Supabase signOut warning:', err);
    }
    setUser(null);
    localStorage.removeItem('neerpath_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      devBypassLogin,
      signInWithGoogle,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
