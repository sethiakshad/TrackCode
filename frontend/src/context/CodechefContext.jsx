import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCodechefProfile,
  saveCodechefProfile,
  getCodechefProfile,
  disconnectCodechef as disconnectCodechefDB,
} from '../services/codechefService';

const CodechefContext = createContext(null);

const CC_STORAGE_KEY = 'trackcode_codechef_profile';

function isDemoUser(user) {
  return user?.id?.startsWith('demo') || user?.id === 'demo_001';
}

export const CodechefProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isConnected = !!profile;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isDemoUser(user)) {
          const stored = localStorage.getItem(CC_STORAGE_KEY);
          if (stored) {
            setProfile(JSON.parse(stored));
          }
        } else {
          const data = await getCodechefProfile(user.id);
          if (data) {
            setProfile(data);
            localStorage.setItem(CC_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Failed to load Codechef profile:', err);
        const stored = localStorage.getItem(CC_STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectCodechef = useCallback(async (username) => {
    setError(null);
    const profileData = await fetchCodechefProfile(username);

    if (user && !isDemoUser(user)) {
      try {
        await saveCodechefProfile(user.id, profileData);
      } catch (err) {
        console.warn('Supabase write failed, falling back to localStorage:', err.message);
      }
    }

    localStorage.setItem(CC_STORAGE_KEY, JSON.stringify(profileData));
    setProfile(profileData);
    return profileData;
  }, [user]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user && !isDemoUser(user)) {
        await disconnectCodechefDB(user.id);
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err.message);
    }
    localStorage.removeItem(CC_STORAGE_KEY);
    setProfile(null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!profile?.username) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await fetchCodechefProfile(profile.username);

      if (user && !isDemoUser(user)) {
        try {
          await saveCodechefProfile(user.id, freshData);
        } catch (err) {
          console.warn('Supabase refresh-write failed:', err.message);
        }
      }

      localStorage.setItem(CC_STORAGE_KEY, JSON.stringify(freshData));
      setProfile(freshData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.username, user]);

  return (
    <CodechefContext.Provider
      value={{
        profile,
        isLoading,
        isConnected,
        error,
        connectCodechef,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </CodechefContext.Provider>
  );
};

export const useCodechef = () => {
  const context = useContext(CodechefContext);
  if (!context) {
    throw new Error('useCodechef must be used within a CodechefProvider');
  }
  return context;
};
