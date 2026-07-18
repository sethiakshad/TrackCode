import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCodeforcesProfile,
  saveCodeforcesProfile,
  getCodeforcesProfile,
  disconnectCodeforces as disconnectCodeforcesDB,
} from '../services/codeforcesService';

const CodeforcesContext = createContext(null);

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
        const data = await getCodeforcesProfile(user.id);
        setProfile(data || null);
      } catch (err) {
        console.error('Failed to load Codeforces profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectCodeforces = useCallback(async (username) => {
    setError(null);

    const profileData = await fetchCodeforcesProfile(username);

    if (user) {
      try {
        await saveCodeforcesProfile(user.id, profileData);
      } catch (err) {
        console.warn('Backend write failed:', err.message);
      }
    }

    setProfile(profileData);
    return profileData;
  }, [user]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user) {
        await disconnectCodeforcesDB(user.id);
      }
    } catch (err) {
      console.warn('Backend delete failed:', err.message);
    }
    setProfile(null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!profile?.username) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await fetchCodeforcesProfile(profile.username);

      if (user) {
        try {
          await saveCodeforcesProfile(user.id, freshData);
        } catch (err) {
          console.warn('Backend refresh-write failed:', err.message);
        }
      }

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
