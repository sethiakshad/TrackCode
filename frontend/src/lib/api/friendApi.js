import { supabase } from '../../utils/supabase';

/**
 * Get user's friends list (accepted relationships) with profiles.
 */
export async function getFriends(userId) {
  // Get friendships where status = 'accepted' and user_id_1 or user_id_2 is the current user
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id_1,
      user_id_2,
      status,
      profiles_1:user_id_1 ( id, name, email, level, xp ),
      profiles_2:user_id_2 ( id, name, email, level, xp )
    `)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) throw error;

  return (data ?? []).map(f => {
    const friendProfile = f.user_id_1 === userId ? f.profiles_2 : f.profiles_1;
    return {
      friendshipId: f.id,
      id: friendProfile.id,
      name: friendProfile.name ?? friendProfile.email.split('@')[0],
      level: friendProfile.level ?? 1,
      xp: friendProfile.xp ?? 0,
    };
  });
}

/**
 * Get incoming / outgoing friend requests.
 */
export async function getFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id_1,
      user_id_2,
      status,
      profiles_1:user_id_1 ( id, name, email )
    `)
    .eq('user_id_2', userId)
    .eq('status', 'pending');

  if (error) throw error;

  return (data ?? []).map(f => ({
    requestId: f.id,
    senderId: f.user_id_1,
    name: f.profiles_1?.name ?? f.profiles_1?.email?.split('@')[0] ?? 'Coding Friend',
  }));
}

/**
 * Send a friend request by email.
 */
export async function sendFriendRequest(userId, friendEmail) {
  // 1. Find profile by email
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', friendEmail)
    .single();

  if (profError) {
    throw new Error('User not found with this email address.');
  }

  if (profile.id === userId) {
    throw new Error("You cannot add yourself as a friend.");
  }

  // 2. Check existing friendship
  const { data: existing, error: existError } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_id_1.eq.${userId},user_id_2.eq.${profile.id}),and(user_id_1.eq.${profile.id},user_id_2.eq.${userId})`);

  if (existing && existing.length > 0) {
    throw new Error(`Friend request or friendship already exists (Status: ${existing[0].status})`);
  }

  // 3. Insert friendship row
  const { data, error } = await supabase
    .from('friendships')
    .insert([
      { user_id_1: userId, user_id_2: profile.id, status: 'pending' }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(requestId) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject / Cancel / Remove friendship.
 */
export async function removeFriendship(requestId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
  return true;
}

/**
 * Get Leaderboard data (Friends + User ranked by XP).
 */
export async function getFriendsLeaderboard(userId) {
  const friends = await getFriends(userId);
  
  // Get current user's profile
  const { data: myProfile, error: myError } = await supabase
    .from('profiles')
    .select('id, name, email, level, xp')
    .eq('id', userId)
    .single();

  if (myError) throw myError;

  const allParticipants = [
    {
      id: myProfile.id,
      name: (myProfile.name ?? myProfile.email.split('@')[0]) + ' (You)',
      level: myProfile.level ?? 1,
      xp: myProfile.xp ?? 0,
      isCurrentUser: true,
    },
    ...friends.map(f => ({ ...f, isCurrentUser: false }))
  ];

  // Sort descending by XP
  return allParticipants.sort((a, b) => b.xp - a.xp);
}
