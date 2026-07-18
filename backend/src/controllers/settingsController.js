const settingsService = require('../services/settingsService');

const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { theme, emailNotifications, profileVisibility, language, timezone } = req.body;
    
    // Validate enums if present
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid theme preference. Must be light, dark, or system.',
      });
    }

    if (profileVisibility && !['public', 'friends', 'private'].includes(profileVisibility)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid profile visibility preference. Must be public, friends, or private.',
      });
    }

    const settings = await settingsService.updateSettings(req.userId, {
      theme,
      emailNotifications,
      profileVisibility,
      language,
      timezone,
    });

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const disconnectAccount = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await settingsService.disconnectAccount(req.userId, platform);
    res.json({
      status: 'success',
      message: `${platform} account disconnected successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  disconnectAccount,
};
