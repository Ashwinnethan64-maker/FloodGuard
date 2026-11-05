import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';

export type UserRole = 'resident' | 'responder' | 'administrator';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  ward: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, role: UserRole) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Default demo user for seamless evaluation
    return {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@neerpath.in',
      full_name: 'Ashwin Nethan',
      role: 'administrator',
      ward: 'Mangaluru Central',
    };
  });

  // Listen for Supabase OAuth redirect or session restoration
  useEffect(() => {
    const initSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const authUser = session.user;
          const userMeta = authUser.user_metadata || {};
          const profile: UserProfile = {
            id: authUser.id,
            email: authUser.email || 'user@neerpath.in',
            full_name: userMeta.full_name || userMeta.name || authUser.email?.split('@')[0] || 'NEERPATH Operator',
            role: (userMeta.role as UserRole) || 'resident',
            ward: userMeta.ward || 'Mangaluru Urban',
          };
          setUser(profile);
        }
      } catch (err) {
        console.warn('[NEERPATH Auth] Error reading Supabase session:', err);
      }
    };

    initSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        const authUser = session.user;
        const userMeta = authUser.user_metadata || {};
        setUser({
          id: authUser.id,
          email: authUser.email || 'user@neerpath.in',
          full_name: userMeta.full_name || userMeta.name || authUser.email?.split('@')[0] || 'NEERPATH Operator',
          role: (userMeta.role as UserRole) || 'resident',
          ward: userMeta.ward || 'Mangaluru Urban',
        });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('neerpath_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('neerpath_user');
    }
  }, [user]);

  const login = (email: string, role: UserRole) => {
    const nameMap: Record<UserRole, string> = {
      administrator: 'Ashwin Nethan (Disaster Control Admin)',
      responder: 'Officer Ramesh Rao (Patrol Unit)',
      resident: 'Kavitha Shenoy (Mangaluru Citizen)',
    };
    setUser({
      id: role === 'administrator' ? '11111111-1111-1111-1111-111111111111' : '33333333-3333-3333-3333-333333333333',
      email,
      full_name: nameMap[role],
      role,
      ward: 'Mangaluru',
    });
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
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
  };

  return (
    <AuthContext.Provider value={{ user, login, signInWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

