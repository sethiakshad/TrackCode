const prisma = require('../config/prisma');

/**
 * Retrieve user settings and connected accounts status.
 */
const getSettings = async (userId) => {
  let settings = await prisma.user_settings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    settings = await prisma.user_settings.create({
      data: {
        user_id: userId,
        theme: 'system',
        email_notifications: true,
        profile_visibility: 'public',
        language: 'en',
        timezone: 'UTC',
      },
    });
  }

  // Fetch connected profiles
  const [github, leetcode, codeforces] = await Promise.all([
    prisma.github_profiles.findUnique({ where: { user_id: userId } }),
    prisma.leetcode_profiles.findUnique({ where: { user_id: userId } }),
    prisma.codeforces_profiles.findUnique({ where: { user_id: userId } }),
  ]);

  return {
    settings: {
      theme: settings.theme,
      emailNotifications: settings.email_notifications,
      profileVisibility: settings.profile_visibility,
      language: settings.language,
      timezone: settings.timezone,
      updatedAt: settings.updated_at,
    },
    connectedAccounts: {
      github: github ? { username: github.username, syncedAt: github.synced_at } : null,
      leetcode: leetcode ? { username: leetcode.username, syncedAt: leetcode.synced_at } : null,
      codeforces: codeforces ? { username: codeforces.username, syncedAt: codeforces.synced_at } : null,
    },
  };
};

/**
 * Update general user settings (theme, profile_visibility, email_notifications, language, timezone).
 */
const updateSettings = async (userId, data) => {
  const updateData = {};

  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.emailNotifications !== undefined) updateData.email_notifications = data.emailNotifications;
  if (data.profileVisibility !== undefined) updateData.profile_visibility = data.profileVisibility;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;

  const settings = await prisma.user_settings.upsert({
    where: { user_id: userId },
    update: {
      ...updateData,
      updated_at: new Date(),
    },
    create: {
      user_id: userId,
      theme: data.theme || 'system',
      email_notifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
      profile_visibility: data.profileVisibility || 'public',
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
    },
  });

  return settings;
};

/**
 * Disconnect a profile (delete connection row).
 */
const disconnectAccount = async (userId, platform) => {
  if (platform === 'github') {
    await prisma.github_profiles.deleteMany({ where: { user_id: userId } });
  } else if (platform === 'leetcode') {
    await prisma.leetcode_profiles.deleteMany({ where: { user_id: userId } });
  } else if (platform === 'codeforces') {
    await prisma.codeforces_profiles.deleteMany({ where: { user_id: userId } });
  } else {
    const error = new Error('Invalid platform specified');
    error.statusCode = 400;
    throw error;
  }
  return { platform, disconnected: true };
};

module.exports = {
  getSettings,
  updateSettings,
  disconnectAccount,
};
