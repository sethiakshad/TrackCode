import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCodechefProfile,
  saveCodechefProfile,
  getCodechefProfile,
  disconnectCodechef as disconnectCodechefDB,
} from '../services/codechefService';

const CodechefContext = createContext(null);

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
        const data = await getCodechefProfile(user.id);
        setProfile(data || null);
      } catch (err) {
        console.error('Failed to load Codechef profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectCodechef = useCallback(async (username) => {
    setError(null);

    const profileData = await fetchCodechefProfile(username);

    if (user) {
      try {
        await saveCodechefProfile(user.id, profileData);
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
        await disconnectCodechefDB(user.id);
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
      const freshData = await fetchCodechefProfile(profile.username);

      if (user) {
        try {
          await saveCodechefProfile(user.id, freshData);
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
