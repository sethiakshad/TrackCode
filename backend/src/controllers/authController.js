const prisma = require('../config/prisma');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
} = require('../services/authService');

/**
 * Cookie options for the refresh token.
 */
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email already exists.',
      });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    res.json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No refresh token provided.',
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(token);

    // Ensure user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({ userId: user.id });

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    res.json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return the same response to avoid email enumeration
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If that email exists, a password reset link has been sent.',
      });
    }

    // Generate a reset token
    const resetToken = generateResetToken({ userId: user.id });

    // Store the reset token and expiry in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link. For now, log to console.
    console.log(`[AUTH] Password reset token for ${email}: ${resetToken}`);

    res.json({
      status: 'success',
      message: 'If that email exists, a password reset link has been sent.',
      // Include resetToken in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the reset token
    const decoded = verifyResetToken(token);

    // Find user with matching reset token
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.resetToken !== token) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token.',
      });
    }

    // Check token expiry
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token has expired. Please request a new one.',
      });
    }

    // Hash new password and update
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({
      status: 'success',
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token.',
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};
