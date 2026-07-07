import apiClient from '../../lib/axios';
import { supabase } from '../../utils/supabase';

export const authService = {
  login: async (email, password) => {
    // Attempt standard login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Call backend API if needed (simulate/logging)
    await apiClient.post('/auth/login', { email, password }).catch(() => {});
    
    return {
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
        email: data.user.email,
        avatar: data.user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
      },
      token: data.session?.access_token,
    };
  },

  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        }
      }
    });

    if (error) throw error;

    await apiClient.post('/auth/register', { name, email, password }).catch(() => {});
    
    return {
      user: {
        id: data.user?.id || `u_${Math.floor(Math.random() * 1000)}`,
        name: data.user?.user_metadata?.name || name,
        email: data.user?.email || email,
        avatar: data.user?.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      },
      token: data.session?.access_token || 'pending-verification',
    };
  },

  verifyOTP: async (email, otp) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });

    if (error) throw error;

    await apiClient.post('/auth/verify-otp', { email, otp }).catch(() => {});
    return true;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    await apiClient.post('/auth/logout').catch(() => {});
    return true;
  }
};

