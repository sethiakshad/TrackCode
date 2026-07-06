import apiClient from '../../lib/axios';

export const authService = {
  login: async (email, password) => {
    // Simulate an API call
    await apiClient.post('/auth/login', { email, password }).catch(() => {});
    
    // Hardcoded mock response for demo purposes
    if (email === 'demo@trackcode.com' && password === 'password') {
      return {
        user: {
          id: 'u_123',
          name: 'Demo User',
          email: 'demo@trackcode.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        },
        token: 'mock-jwt-token-12345',
      };
    }
    throw new Error('Invalid email or password');
  },

  register: async (name, email, password) => {
    await apiClient.post('/auth/register', { name, email, password }).catch(() => {});
    return {
      user: {
        id: `u_${Math.floor(Math.random() * 1000)}`,
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      },
      token: 'mock-jwt-token-new',
    };
  },

  verifyOTP: async (email, otp) => {
    await apiClient.post('/auth/verify-otp', { email, otp }).catch(() => {});
    if (otp === '123456') {
      return true;
    }
    throw new Error('Invalid OTP code');
  },

  logout: async () => {
    // Optional backend logout call
    await apiClient.post('/auth/logout').catch(() => {});
    return true;
  }
};
