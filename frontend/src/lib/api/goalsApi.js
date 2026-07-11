import { supabase } from '../../utils/supabase';

/**
 * Full CRUD for user goals.
 */

export async function getGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createGoal(userId, { goal, target, deadline }) {
  const { data, error } = await supabase
    .from('goals')
    .insert([{ user_id: userId, goal, target, deadline: deadline || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(goalId, updates) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(goalId) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
  return true;
}

export async function updateGoalProgress(goalId, progress) {
  const completed = progress >= 100;
  const { data, error } = await supabase
    .from('goals')
    .update({ progress, completed })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
