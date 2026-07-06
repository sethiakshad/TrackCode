import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../features/auth/AuthServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for an existing session on mount
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('trackcode_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to restore session", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    localStorage.setItem('trackcode_user', JSON.stringify(data.user));
    localStorage.setItem('trackcode_token', data.token);
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    localStorage.setItem('trackcode_user', JSON.stringify(data.user));
    localStorage.setItem('trackcode_token', data.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('trackcode_user');
    localStorage.removeItem('trackcode_token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
