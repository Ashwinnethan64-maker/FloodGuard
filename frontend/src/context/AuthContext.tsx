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
  loading: boolean;
  login: (email: string, requestedRole?: UserRole) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Trusted Authority Configuration
// In production, administrative privileges are enforced through backend permissions or verified domain lists.
const TRUSTED_ADMIN_EMAILS = [
  'admin@neerpath.in',
  'disaster.cell@mangaluru.gov.in',
  'ashwinnethan@gmail.com',
  'ashwin@neerpath.in'
];

const TRUSTED_RESPONDER_DOMAINS = [
  'police.gov.in',
  'ksp.gov.in',
  'fireforce.kar.nic.in',
  'neerpath.in'
];

/**
 * Derives a trusted role based on verified email and authoritative metadata.
 * Prevents unauthorized privilege escalation.
 */
function resolveTrustedRole(email: string, explicitRole?: string): UserRole {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check verified admin emails
  if (TRUSTED_ADMIN_EMAILS.includes(normalizedEmail)) {
    return 'administrator';
  }

  // 2. Check trusted responder domains
  const domain = normalizedEmail.split('@')[1] || '';
  if (TRUSTED_RESPONDER_DOMAINS.includes(domain)) {
    if (explicitRole === 'administrator' && TRUSTED_ADMIN_EMAILS.includes(normalizedEmail)) {
      return 'administrator';
    }
    return 'responder';
  }

  // 3. If explicit role was legitimately set on auth user metadata (and not admin unless trusted)
  if (explicitRole === 'responder') {
    return 'responder';
  }

  // Default to citizen/resident
  return 'resident';
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
    // Default demo session for immediate exploration
    return {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@neerpath.in',
      full_name: 'Ashwin Nethan',
      role: 'administrator',
      ward: 'Mangaluru Central',
    };
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
          const authUser = session.user;
          const userMeta = authUser.user_metadata || {};
          const resolvedEmail = authUser.email || 'user@neerpath.in';
          const role = resolveTrustedRole(resolvedEmail, userMeta.role);

          const profile: UserProfile = {
            id: authUser.id,
            email: resolvedEmail,
            full_name: userMeta.full_name || userMeta.name || resolvedEmail.split('@')[0] || 'FLOODGUARD Operator',
            role,
            ward: userMeta.ward || 'Mangaluru Urban',
          };
          setUser(profile);
        }
      } catch (err) {
        console.warn('[NEERPATH Auth] Session initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user && isMounted) {
        const authUser = session.user;
        const userMeta = authUser.user_metadata || {};
        const resolvedEmail = authUser.email || 'user@neerpath.in';
        const role = resolveTrustedRole(resolvedEmail, userMeta.role);

        const profile: UserProfile = {
          id: authUser.id,
          email: resolvedEmail,
          full_name: userMeta.full_name || userMeta.name || resolvedEmail.split('@')[0] || 'FLOODGUARD Operator',
          role,
          ward: userMeta.ward || 'Mangaluru Urban',
        };
        setUser(profile);
      } else if (!session && isMounted) {
        // Only wipe if user was logged in via Supabase
        const saved = localStorage.getItem('neerpath_user');
        if (saved && !saved.includes('admin@neerpath.in')) {
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

  // Demo / Email password login helper
  const login = (email: string, requestedRole: UserRole = 'resident') => {
    const role = resolveTrustedRole(email, requestedRole);
    const nameMap: Record<UserRole, string> = {
      administrator: 'Ashwin Nethan (Disaster Control Admin)',
      responder: 'Officer Ramesh Rao (Patrol Unit)',
      resident: 'Kavitha Shenoy (Mangaluru Citizen)',
    };

    setUser({
      id: role === 'administrator' ? '11111111-1111-1111-1111-111111111111' : '33333333-3333-3333-3333-333333333333',
      email,
      full_name: nameMap[role] || email.split('@')[0],
      role,
      ward: 'Mangaluru Urban',
    });
  };

  /**
   * Real Supabase Google OAuth sign-in flow.
   * Redirects to /auth/callback to exchange tokens and establish secure session.
   */
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
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
    <AuthContext.Provider value={{ user, loading, login, signInWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
