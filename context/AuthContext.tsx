import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types/Order';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Usuario Demo',
    role: 'Admin' // Por defecto Admin para demo
  });

  const login = (role: UserRole, name: string) => {
    setUser({
      id: Date.now().toString(),
      name,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}