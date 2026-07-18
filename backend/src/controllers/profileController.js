const profileService = require('../services/profileService');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.userId);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }
    res.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.userId, req.body);
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'Username is already taken',
      });
    }
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await profileService.changePassword(req.userId, currentPassword, newPassword);
    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    // If using middleware like multer or simply receiving a URL
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({
        status: 'error',
        message: 'Avatar URL is required',
      });
    }

    const profile = await profileService.updateProfile(req.userId, { avatar });
    res.json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      data: {
        avatar: profile.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await profileService.deleteAccount(req.userId);
    // Clear the refresh token cookie upon deletion
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAccount,
};
