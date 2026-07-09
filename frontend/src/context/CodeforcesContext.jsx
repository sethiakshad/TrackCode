import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCodeforcesProfile,
  saveCodeforcesProfile,
  getCodeforcesProfile,
  disconnectCodeforces as disconnectCodeforcesDB,
} from '../services/codeforcesService';

const CodeforcesContext = createContext(null);

const CF_STORAGE_KEY = 'trackcode_codeforces_profile';

function isDemoUser(user) {
  return user?.id?.startsWith('demo') || user?.id === 'demo_001';
}

export const CodeforcesProvider = ({ children }) => {
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
          const stored = localStorage.getItem(CF_STORAGE_KEY);
          if (stored) {
            setProfile(JSON.parse(stored));
          }
        } else {
          const data = await getCodeforcesProfile(user.id);
          if (data) {
            setProfile(data);
            localStorage.setItem(CF_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Failed to load Codeforces profile:', err);
        const stored = localStorage.getItem(CF_STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectCodeforces = useCallback(async (username) => {
    setError(null);
    const profileData = await fetchCodeforcesProfile(username);

    if (user && !isDemoUser(user)) {
      try {
        await saveCodeforcesProfile(user.id, profileData);
      } catch (err) {
        console.warn('Supabase write failed, falling back to localStorage:', err.message);
      }
    }

    localStorage.setItem(CF_STORAGE_KEY, JSON.stringify(profileData));
    setProfile(profileData);
    return profileData;
  }, [user]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user && !isDemoUser(user)) {
        await disconnectCodeforcesDB(user.id);
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err.message);
    }
    localStorage.removeItem(CF_STORAGE_KEY);
    setProfile(null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!profile?.username) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await fetchCodeforcesProfile(profile.username);

      if (user && !isDemoUser(user)) {
        try {
          await saveCodeforcesProfile(user.id, freshData);
        } catch (err) {
          console.warn('Supabase refresh-write failed:', err.message);
        }
      }

      localStorage.setItem(CF_STORAGE_KEY, JSON.stringify(freshData));
      setProfile(freshData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.username, user]);

  return (
    <CodeforcesContext.Provider
      value={{
        profile,
        isLoading,
        isConnected,
        error,
        connectCodeforces,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </CodeforcesContext.Provider>
  );
};

export const useCodeforces = () => {
  const context = useContext(CodeforcesContext);
  if (!context) {
    throw new Error('useCodeforces must be used within a CodeforcesProvider');
  }
  return context;
};
