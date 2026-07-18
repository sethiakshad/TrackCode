const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { hashPassword } = require('./authService');

/**
 * Get profile logic.
 * Note: Our public_users database table name is mapped to 'users' in Prisma via @@map("users").
 * It represents the public metadata (username, email, avatar, bio, etc.) for the logged-in user.
 */
const getProfile = async (userId) => {
  const profile = await prisma.public_users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      is_verified: true,
      created_at: true,
      updated_at: true,
    },
  });
  return profile;
};

/**
 * Update profile metadata (username, bio, avatar URL).
 */
const updateProfile = async (userId, data) => {
  const updateData = {};
  if (data.username !== undefined) updateData.username = data.username;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  const profile = await prisma.public_users.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      updated_at: true,
    },
  });
  return profile;
};

/**
 * Change account password (updating encrypted_password in auth_users).
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Retrieve the auth user details
  const authUser = await prisma.auth_users.findUnique({
    where: { id: userId },
  });

  if (!authUser) {
    throw new Error('User not found');
  }

  // If password exists, compare it
  if (authUser.encrypted_password) {
    const isPasswordValid = await bcrypt.compare(currentPassword, authUser.encrypted_password);
    if (!isPasswordValid) {
      const err = new Error('Incorrect current password');
      err.statusCode = 400;
      throw err;
    }
  }

  const newHash = await hashPassword(newPassword);

  await prisma.auth_users.update({
    where: { id: userId },
    data: {
      encrypted_password: newHash,
    },
  });
};

/**
 * Delete account (cascades or deletes both public_users and auth_users).
 */
const deleteAccount = async (userId) => {
  // Because of Cascade referential integrity, deleting auth_users will delete the associated public_users record.
  await prisma.auth_users.delete({
    where: { id: userId },
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
