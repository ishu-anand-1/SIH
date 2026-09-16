import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('metrologyx_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated user after page refresh.
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('metrologyx_token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        setToken(storedToken);
        setUser(currentUser);
      } catch (error) {
        console.warn('Session restore failed. Clearing invalid token.');

        localStorage.removeItem('metrologyx_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await api.login(email, password);

      localStorage.setItem('metrologyx_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch (error) {
      // No demo fallback.
      localStorage.removeItem('metrologyx_token');
      setToken(null);
      setUser(null);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('metrologyx_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};