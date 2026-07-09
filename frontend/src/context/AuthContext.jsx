import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../features/auth/AuthServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const sessionUser = await authService.getSessionUser();
        if (isMounted) {
          setUser(sessionUser);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((nextUser) => {
      if (!isMounted) return;
      setUser(nextUser);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const demoLogin = () => {
    const demoUser = {
      id: 'demo_001',
      name: 'Demo Developer',
      username: 'demo_developer',
      email: 'demo@trackcode.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    };
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, demoLogin }}>
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
