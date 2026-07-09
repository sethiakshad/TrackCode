import apiClient from '../../lib/axios';
import { supabase } from '../../utils/supabase';

const PENDING_REGISTRATION_KEY = 'trackcode_pending_registration';

const buildAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const normalizeUsername = (value) => {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (base.length >= 3) {
    return base.slice(0, 30);
  }

  return `${base || 'user'}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 30);
};

const mapSupabaseUser = async (authUser) => {
  if (!authUser) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, email, avatar, is_verified')
    .eq('id', authUser.id)
    .maybeSingle();

  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || profile?.username || authUser.email?.split('@')[0] || 'Developer',
    username: profile?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
    email: authUser.email,
    avatar: profile?.avatar || authUser.user_metadata?.avatar || buildAvatarUrl(authUser.email || authUser.id),
    isVerified: Boolean(profile?.is_verified || authUser.email_confirmed_at),
  };
};

const savePendingRegistration = (registration) => {
  sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(registration));
};

const clearPendingRegistration = () => {
  sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
};

const getPendingRegistration = () => {
  const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const authService = {
  login: async (email, password) => {
    const { error } = await supabase.functions.invoke('send-register-otp', {
      body: {
        mode: 'login',
        email,
        password,
      },
    });

    if (error) throw error;

    await apiClient.post('/auth/login', { email, password }).catch(() => {});
    savePendingRegistration({ email, password, mode: 'login' });

    return {
      requiresOtpVerification: true,
    };
  },

  register: async (name, email, password) => {
    const username = normalizeUsername(name || email.split('@')[0]);
    const avatar = buildAvatarUrl(name || email);

    const { error } = await supabase.functions.invoke('send-register-otp', {
      body: {
        mode: 'register',
        name,
        email,
        password,
        username,
        avatar,
      },
    });

    if (error) {
      const message =
        error.message?.includes('Failed to send a request to the Edge Function')
          ? 'OTP service is not available yet. Start or deploy the Supabase Edge Functions first.'
          : error.message;
      throw new Error(message);
    }

    await apiClient.post('/auth/register', { name, email, password }).catch(() => {});
    savePendingRegistration({ name, email, password, mode: 'register' });

    return {
      requiresOtpVerification: true,
    };
  },

  verifyOTP: async (email, otp) => {
    const pendingRegistration = getPendingRegistration();
    const { error } = await supabase.functions.invoke('verify-register-otp', {
      body: {
        email,
        otp,
        mode: pendingRegistration?.mode || 'register',
      },
    });

    if (error) throw error;

    await apiClient.post('/auth/verify-otp', { email, otp }).catch(() => {});

    if (!pendingRegistration?.password) {
      clearPendingRegistration();
      return { user: null };
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: pendingRegistration.password,
    });

    if (loginError) {
      throw loginError;
    }

    clearPendingRegistration();
    return {
      user: await mapSupabaseUser(data.user),
      token: data.session?.access_token,
    };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    await apiClient.post('/auth/logout').catch(() => {});
    return true;
  },

  getSessionUser: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session?.user) return null;

    return mapSupabaseUser(session.user);
  },

  onAuthStateChange: (callback) =>
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ? await mapSupabaseUser(session.user) : null;
      callback(user);
    }),

  getPendingRegistration,
};

