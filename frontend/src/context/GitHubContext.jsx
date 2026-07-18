import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchGitHubProfile,
  saveGitHubProfile,
  getGitHubProfile,
  disconnectGitHub as disconnectGitHubDB,
} from '../services/githubService';

const GitHubContext = createContext(null);

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
        const data = await getGitHubProfile(user.id);
        setProfile(data || null);
      } catch (err) {
        console.error('Failed to load GitHub profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const connectGitHub = useCallback(async (username) => {
    setError(null);

    const profileData = await fetchGitHubProfile(username);

    if (user) {
      try {
        await saveGitHubProfile(user.id, profileData);
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
        await disconnectGitHubDB(user.id);
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
      const freshData = await fetchGitHubProfile(profile.username);

      if (user) {
        try {
          await saveGitHubProfile(user.id, freshData);
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
