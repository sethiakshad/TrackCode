import { supabase } from '../../utils/supabase';

/**
 * Update personal profile (name/display name).
 */
export async function updateProfile(userId, { name }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch connected platform profiles.
 */
export async function getConnectedHandles(userId) {
  const { data: github } = await supabase
    .from('github_profiles')
    .select('username')
    .eq('user_id', userId)
    .single();

  const { data: leetcode } = await supabase
    .from('leetcode_profiles')
    .select('username')
    .eq('user_id', userId)
    .single();

  const { data: codeforces } = await supabase
    .from('codeforces_profiles')
    .select('username')
    .eq('user_id', userId)
    .single();

  const { data: codechef } = await supabase
    .from('codechef_profiles')
    .select('username')
    .eq('user_id', userId)
    .single();

  return {
    github: github?.username || null,
    leetcode: leetcode?.username || null,
    codeforces: codeforces?.username || null,
    codechef: codechef?.username || null,
  };
}
