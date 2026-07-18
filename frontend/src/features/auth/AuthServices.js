import apiClient from '../../lib/axios';

const buildAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      
      return {
        user: {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          username: user.email.split('@')[0],
          email: user.email,
          avatar: user.avatar || buildAvatarUrl(user.email),
          isVerified: true,
        },
        token: accessToken,
      };
    } catch (error) {
      const data = error.response?.data;
      let msg = data?.message || 'Login failed. Please try again.';
      if (data?.errors?.length) {
        msg = data.errors.map(e => e.message).join('. ');
      }
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      const { accessToken, user } = response.data;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      
      return {
        user: {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          username: user.email.split('@')[0],
          email: user.email,
          avatar: user.avatar || buildAvatarUrl(user.email),
          isVerified: true,
        },
        message: response.message,
      };
    } catch (error) {
      // The interceptor does NOT unwrap error responses, so error.response.data is the raw body
      const body = error.response?.data;
      const msg = body?.message || 'Registration failed. Please try again.';
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
    }
    return true;
  },

  getSessionUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // Validate token by fetching the profile
      const response = await apiClient.get('/profile');
      const profile = response.data || response;
      
      return {
        id: profile.id,
        name: profile.name || profile.username || profile.email.split('@')[0],
        username: profile.username || profile.email.split('@')[0],
        email: profile.email,
        avatar: profile.avatar || buildAvatarUrl(profile.email),
        isVerified: true,
      };
    } catch (error) {
      localStorage.removeItem('accessToken');
      return null;
    }
  },

  // This is no longer needed since we are not using Supabase real-time auth state,
  // but we keep the method signature to avoid breaking AuthContext.
  onAuthStateChange: (callback) => {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};
