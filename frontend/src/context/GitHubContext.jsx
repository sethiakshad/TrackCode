import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchGitHubProfile,
  saveGitHubProfile,
  getGitHubProfile,
  disconnectGitHub as disconnectGitHubDB,
} from '../services/githubService';

const GitHubContext = createContext(null);

const GH_STORAGE_KEY = 'trackcode_github_profile';

function isDemoUser(user) {
  return user?.id?.startsWith('demo') || user?.id === 'demo_001';
}

export const GitHubProvider = ({ children }) => {
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
          const stored = localStorage.getItem(GH_STORAGE_KEY);
          if (stored) {
            setProfile(JSON.parse(stored));
          }
        } else {
          const data = await getGitHubProfile(user.id);
          if (data) {
            setProfile(data);
            localStorage.setItem(GH_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('Failed to load GitHub profile:', err);
        const stored = localStorage.getItem(GH_STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectGitHub = useCallback(async (username) => {
    setError(null);

    const profileData = await fetchGitHubProfile(username);

    if (user && !isDemoUser(user)) {
      try {
        await saveGitHubProfile(user.id, profileData);
      } catch (err) {
        console.warn('Supabase write failed, falling back to localStorage:', err.message);
      }
    }

    localStorage.setItem(GH_STORAGE_KEY, JSON.stringify(profileData));
    setProfile(profileData);

    return profileData;
  }, [user]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      if (user && !isDemoUser(user)) {
        await disconnectGitHubDB(user.id);
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err.message);
    }
    localStorage.removeItem(GH_STORAGE_KEY);
    setProfile(null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!profile?.username) return;
    setIsLoading(true);
    setError(null);
    try {
      const freshData = await fetchGitHubProfile(profile.username);

      if (user && !isDemoUser(user)) {
        try {
          await saveGitHubProfile(user.id, freshData);
        } catch (err) {
          console.warn('Supabase refresh-write failed:', err.message);
        }
      }

      localStorage.setItem(GH_STORAGE_KEY, JSON.stringify(freshData));
      setProfile(freshData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.username, user]);

  return (
    <GitHubContext.Provider
      value={{
        profile,
        isLoading,
        isConnected,
        error,
        connectGitHub,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
};

export const useGitHub = () => {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
};
