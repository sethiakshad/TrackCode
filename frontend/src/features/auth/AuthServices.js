import apiClient from '../../lib/axios';
import { supabase } from '../../utils/supabase';

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

export const authService = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await apiClient.post('/auth/login', { email, password }).catch(() => {});

    return {
      user: await mapSupabaseUser(data.user),
      token: data.session?.access_token,
    };
  },

  register: async (name, email, password) => {
    const username = normalizeUsername(name || email.split('@')[0]);
    const avatar = buildAvatarUrl(name || email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username,
          avatar,
        }
      }
    });

    if (error) throw error;

    await apiClient.post('/auth/register', { name, email, password }).catch(() => {});

    return {
      user: data.user ? await mapSupabaseUser(data.user) : null,
      message: 'Please check your email for a verification link.',
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
};

