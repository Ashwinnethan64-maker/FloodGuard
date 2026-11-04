import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
  logout: () => void;
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

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

