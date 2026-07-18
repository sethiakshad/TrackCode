const prisma = require('../config/prisma');

/**
 * Send a friend request from sender to receiver.
 */
const sendFriendRequest = async (senderId, receiverUsername) => {
  // Find receiver by username
  const receiver = await prisma.public_users.findUnique({
    where: { username: receiverUsername },
  });

  if (!receiver) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (senderId === receiver.id) {
    const error = new Error('You cannot send a friend request to yourself');
    error.statusCode = 400;
    throw error;
  }

  // Check if they are already friends
  const existingFriendship = await prisma.friends.findUnique({
    where: {
      user_id_friend_id: {
        user_id: senderId,
        friend_id: receiver.id,
      },
    },
  });

  if (existingFriendship) {
    const error = new Error('You are already friends with this user');
    error.statusCode = 400;
    throw error;
  }

  // Check if a request already exists
  const existingRequest = await prisma.friend_requests.findFirst({
    where: {
      OR: [
        { sender: senderId, receiver: receiver.id },
        { sender: receiver.id, receiver: senderId },
      ],
    },
  });

  if (existingRequest) {
    const error = new Error('A friend request is already pending or sent between you and this user');
    error.statusCode = 400;
    throw error;
  }

  return prisma.friend_requests.create({
    data: {
      sender: senderId,
      receiver: receiver.id,
      status: 'pending',
    },
  });
};

/**
 * Accept a pending friend request.
 */
const acceptFriendRequest = async (userId, requestId) => {
  const request = await prisma.friend_requests.findUnique({
    where: { id: requestId },
  });

  if (!request || request.receiver !== userId || request.status !== 'pending') {
    const error = new Error('Friend request not found or not authorized');
    error.statusCode = 404;
    throw error;
  }

  // Update request status
  await prisma.friend_requests.update({
    where: { id: requestId },
    data: { status: 'accepted' },
  });

  // Create mutual friendship records
  await prisma.$transaction([
    prisma.friends.upsert({
      where: {
        user_id_friend_id: {
          user_id: request.sender,
          friend_id: request.receiver,
        },
      },
      update: {},
      create: {
        user_id: request.sender,
        friend_id: request.receiver,
      },
    }),
    prisma.friends.upsert({
      where: {
        user_id_friend_id: {
          user_id: request.receiver,
          friend_id: request.sender,
        },
      },
      update: {},
      create: {
        user_id: request.receiver,
        friend_id: request.sender,
      },
    }),
  ]);
};

/**
 * Reject a pending friend request.
 */
const rejectFriendRequest = async (userId, requestId) => {
  const request = await prisma.friend_requests.findUnique({
    where: { id: requestId },
  });

  if (!request || request.receiver !== userId || request.status !== 'pending') {
    const error = new Error('Friend request not found or not authorized');
    error.statusCode = 404;
    throw error;
  }

  // Update request status to rejected
  return prisma.friend_requests.update({
    where: { id: requestId },
    data: { status: 'rejected' },
  });
};

/**
 * Remove a friend (removes bidirectional relation).
 */
const removeFriend = async (userId, friendId) => {
  await prisma.$transaction([
    prisma.friends.deleteMany({
      where: {
        OR: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
    }),
    prisma.friend_requests.deleteMany({
      where: {
        OR: [
          { sender: userId, receiver: friendId },
          { sender: friendId, receiver: userId },
        ],
      },
    }),
  ]);
};

/**
 * Fetch friend list for current user.
 */
const getFriendList = async (userId) => {
  const friendshipList = await prisma.friends.findMany({
    where: { user_id: userId },
    include: {
      users_friends_friend_idTousers: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
        },
      },
    },
  });

  return friendshipList.map(f => f.users_friends_friend_idTousers);
};

/**
 * Fetch incoming friend requests for current user.
 */
const getFriendRequests = async (userId) => {
  const requests = await prisma.friend_requests.findMany({
    where: { receiver: userId, status: 'pending' },
    include: {
      users_friend_requests_senderTousers: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return requests.map(r => ({
    requestId: r.id,
    senderId: r.sender,
    name: r.users_friend_requests_senderTousers?.username,
    avatar: r.users_friend_requests_senderTousers?.avatar,
  }));
};

/**
 * Search users by username (excluding current user and existing friends).
 */
const searchUsers = async (userId, query) => {
  return prisma.public_users.findMany({
    where: {
      username: {
        contains: query,
        mode: 'insensitive',
      },
      id: {
        not: userId,
      },
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
    },
    take: 10,
  });
};

/**
 * Fetch recent activity of user's friends.
 */
const getFriendsActivity = async (userId) => {
  const friends = await prisma.friends.findMany({
    where: { user_id: userId },
    select: { friend_id: true },
  });

  const friendIds = friends.map(f => f.friend_id);

  if (friendIds.length === 0) return [];

  // Fetch recent problem solved history of friends
  return prisma.user_problem_history.findMany({
    where: {
      user_id: { in: friendIds },
      status: 'solved',
    },
    include: {
      users: {
        select: {
          username: true,
          avatar: true,
        },
      },
      problems: {
        select: {
          title: true,
          platform: true,
          difficulty: true,
        },
      },
    },
    orderBy: { solved_at: 'desc' },
    take: 20,
  });
};

/**
 * Compare user solved counts against friends.
 */
const getLeaderboard = async (userId) => {
  const friends = await prisma.friends.findMany({
    where: { user_id: userId },
    select: { friend_id: true },
  });

  const competitorIds = [userId, ...friends.map(f => f.friend_id)];

  const stats = await prisma.public_users.findMany({
    where: { id: { in: competitorIds } },
    select: {
      id: true,
      username: true,
      avatar: true,
      leetcode_profiles: {
        select: {
          problems_solved: true,
        },
      },
      github_profiles: {
        select: {
          total_commits: true,
        },
      },
    },
  });

  return stats.map(s => ({
    userId: s.id,
    username: s.username,
    avatar: s.avatar,
    leetcodeSolved: s.leetcode_profiles?.problems_solved || 0,
    githubCommits: s.github_profiles?.total_commits || 0,
    totalPoints: (s.leetcode_profiles?.problems_solved || 0) * 10 + (s.github_profiles?.total_commits || 0),
  })).sort((a, b) => b.totalPoints - a.totalPoints);
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendList,
  getFriendRequests,
  searchUsers,
  getFriendsActivity,
  getLeaderboard,
};
