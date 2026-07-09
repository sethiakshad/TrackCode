import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchLeetCodeProfile,
  saveLeetCodeProfile,
  getLeetCodeProfile,
  disconnectLeetCode as disconnectLeetCodeDB,
} from '../services/leetcodeService';

const LeetCodeContext = createContext(null);

const LC_STORAGE_KEY = 'trackcode_leetcode_profile';

/**
 * Determine if the current user is a "demo" user (not a real Supabase user).
 */
function isDemoUser(user) {
  return user?.id?.startsWith('demo') || user?.id === 'demo_001';
}

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
        if (isDemoUser(user)) {
          // Demo mode: read from localStorage
          const stored = localStorage.getItem(LC_STORAGE_KEY);
          if (stored) {
            setProfile(JSON.parse(stored));
          }
        } else {
          // Real user: read from Supabase
          const data = await getLeetCodeProfile(user.id);
          if (data) {
            setProfile(data);
            // Also cache in localStorage as backup
            localStorage.setItem(LC_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Failed to load LeetCode profile:', err);
        // Try localStorage fallback
        const stored = localStorage.getItem(LC_STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
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

    // 1. Fetch from public LeetCode API
    const profileData = await fetchLeetCodeProfile(username);

    // 2. Save to Supabase (or localStorage for demo)
    if (user && !isDemoUser(user)) {
      try {
        await saveLeetCodeProfile(user.id, profileData);
      } catch (err) {
        console.warn('Supabase write failed, falling back to localStorage:', err.message);
      }
    }

    // 3. Always cache in localStorage
    localStorage.setItem(LC_STORAGE_KEY, JSON.stringify(profileData));

    // 4. Update state
    setProfile(profileData);

    return profileData;
  }, [user]);

  /**
   * Disconnect the LeetCode account.
   */
  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user && !isDemoUser(user)) {
        await disconnectLeetCodeDB(user.id);
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err.message);
    }
    localStorage.removeItem(LC_STORAGE_KEY);
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

      if (user && !isDemoUser(user)) {
        try {
          await saveLeetCodeProfile(user.id, freshData);
        } catch (err) {
          console.warn('Supabase refresh-write failed:', err.message);
        }
      }

      localStorage.setItem(LC_STORAGE_KEY, JSON.stringify(freshData));
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
