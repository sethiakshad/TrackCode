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

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const passwordHash = await hashPassword(password);

    // IMPORTANT: auth.users has a PARTIAL unique index on email WHERE is_sso_user = false.
    // Prisma findUnique cannot reliably use partial indexes — use findFirst with explicit filter.
    const existingAuth = await prisma.auth_users.findFirst({
      where: { email, is_sso_user: false },
    });

    let user;

    if (existingAuth) {
      // auth row found for this email — check if public_users also exists
      const existingPublic = await prisma.public_users.findUnique({
        where: { id: existingAuth.id },
      });

      if (existingPublic && existingAuth.encrypted_password) {
        // Both tables have this user — fully registered, reject cleanly
        return res.status(400).json({
          status: 'error',
          message: 'This email is already registered. Please sign in instead.',
        });
      }

      // Partial / orphaned registration — recover it.
      // ALWAYS update the password to the one the user just provided (the stored one may be stale).
      await prisma.auth_users.update({
        where: { id: existingAuth.id },
        data: { encrypted_password: passwordHash },
      });

      // Create public_users row if it doesn't exist
      if (!existingPublic) {
        user = await prisma.public_users.create({
          data: {
            id: existingAuth.id,
            email,
            username: name || email.split('@')[0],
          },
        });
      } else {
        user = existingPublic;
      }
    } else {
      // Brand new user — create auth_users row, then public_users
      const userId = require('crypto').randomUUID();

      await prisma.auth_users.create({
        data: {
          id: userId,
          email,
          encrypted_password: passwordHash,
          is_sso_user: false,
          is_anonymous: false,
        },
      });

      // Supabase trigger may auto-create public_users — try update first, fallback to create
      try {
        user = await prisma.public_users.update({
          where: { id: userId },
          data: { email, username: name || email.split('@')[0] },
        });
      } catch {
        user = await prisma.public_users.create({
          data: {
            id: userId,
            email,
            username: name || email.split('@')[0],
          },
        });
      }
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.username || name,
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

    // Find user in public_users
    const user = await prisma.public_users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Get password from auth_users
    const authUser = await prisma.auth_users.findUnique({ where: { id: user.id } });
    if (!authUser || !authUser.encrypted_password) {
      return res.status(401).json({
        status: 'error',
        message: 'No password set. Please sign up first to set a password.',
      });
    }
    const isPasswordValid = await comparePassword(password, authUser.encrypted_password);
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
    const user = await prisma.public_users.findUnique({ where: { id: decoded.userId } });
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

    const user = await prisma.public_users.findUnique({ where: { email } });

    // Always return the same response to avoid email enumeration
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If that email exists, a password reset link has been sent.',
      });
    }

    // Generate a reset token
    const resetToken = generateResetToken({ userId: user.id });

    // Supabase usually stores reset tokens in auth.users, but if using public_users we don't have resetToken field.
    // We can just log it for now since we aren't using Supabase auth directly for reset anymore.

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
    const user = await prisma.public_users.findUnique({ where: { id: decoded.userId } });
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
    await prisma.public_users.update({
      where: { id: user.id },
      data: {
        encrypted_password: passwordHash,
        // Assuming you need to reset the token fields if you had them
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
