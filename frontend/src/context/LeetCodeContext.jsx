import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchLeetCodeProfile,
  saveLeetCodeProfile,
  getLeetCodeProfile,
  disconnectLeetCode as disconnectLeetCodeDB,
} from '../services/leetcodeService';

const LeetCodeContext = createContext(null);

export const LeetCodeProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isConnected = !!profile;

  // On mount (or when user changes), restore profile from Supabase or localStorage
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
        const data = await getLeetCodeProfile(user.id);
        setProfile(data || null);
      } catch (err) {
        console.error('Failed to load LeetCode profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  /**
   * Connect a LeetCode account: fetch from API + save.
   * @param {string} username
   * @returns {Promise<object>} The fetched profile data
   */
  const connectLeetCode = useCallback(async (username) => {
    setError(null);

    const profileData = await fetchLeetCodeProfile(username);

    if (user) {
      try {
        await saveLeetCodeProfile(user.id, profileData);
      } catch (err) {
        console.warn('Backend write failed:', err.message);
      }
    }

    setProfile(profileData);

    return profileData;
  }, [user]);

  /**
   * Disconnect the LeetCode account.
   */
  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user) {
        await disconnectLeetCodeDB(user.id);
      }
    } catch (err) {
      console.warn('Backend delete failed:', err.message);
    }
    setProfile(null);
  }, [user]);

  /**
   * Refresh: re-fetch from the API using the stored username.
   */
  const refreshProfile = useCallback(async () => {
    if (!profile?.username) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await fetchLeetCodeProfile(profile.username);

      if (user) {
        try {
          await saveLeetCodeProfile(user.id, freshData);
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
    <LeetCodeContext.Provider
      value={{
        profile,
        isLoading,
        isConnected,
        error,
        connectLeetCode,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </LeetCodeContext.Provider>
  );
};

export const useLeetCode = () => {
  const context = useContext(LeetCodeContext);
  if (!context) {
    throw new Error('useLeetCode must be used within a LeetCodeProvider');
  }
  return context;
};
