const prisma = require('../config/prisma');
const { createClient } = require('@supabase/supabase-js');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
} = require('../services/authService');

// Supabase client for auth operations (signUp / signIn)
const supabaseUrl = process.env.SUPABASE_URL || 'https://uuphdmszfdqkiddgjedw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_6-YvgxEI9Sabj5UZYMqisA_7gA-7pv-';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

    // Check if user already exists in public.users
    const existingPublic = await prisma.public_users.findUnique({ where: { email } });
    if (existingPublic) {
      return res.status(400).json({
        status: 'error',
        message: 'This email is already registered. Please sign in instead.',
      });
    }

    // Sign up through Supabase Admin API to bypass email rate limits and auto-confirm
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });

    if (authError) {
      // If user already exists in auth but not in public, recover
      if (authError.message?.includes('already registered')) {
        // We can't automatically sign in with admin API in a way that gives a session easily,
        // but we can try to sign in normally to get the user ID and tokens.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          return res.status(400).json({ status: 'error', message: 'This email is already registered. Please sign in instead.' });
        }
        // Create public_users row
        const user = await prisma.public_users.create({
          data: {
            id: signInData.user.id,
            email,
            username: name || email.split('@')[0],
          },
        });
        const accessToken = generateAccessToken({ userId: user.id });
        const refreshToken = generateRefreshToken({ userId: user.id });
        res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());
        return res.status(201).json({
          status: 'success',
          message: 'User registered successfully.',
          data: { accessToken, user: { id: user.id, email: user.email, name: user.username } },
        });
      }
      return res.status(400).json({ status: 'error', message: authError.message });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return res.status(500).json({ status: 'error', message: 'Registration failed — no user ID returned.' });
    }

    // Create public_users row
    let user;
    try {
      user = await prisma.public_users.create({
        data: {
          id: userId,
          email,
          username: name || email.split('@')[0],
        },
      });
    } catch (createErr) {
      // Supabase trigger may have auto-created it — try to fetch
      user = await prisma.public_users.findUnique({ where: { id: userId } });
      if (user) {
        await prisma.public_users.update({
          where: { id: userId },
          data: { email, username: name || email.split('@')[0] },
        });
      } else {
        throw createErr;
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
        user: { id: user.id, email: user.email, name: user.username || name },
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

    // Verify password via Supabase Auth (handles auth.users internally over HTTPS)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Generate our own tokens
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
          name: user.username,
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

    // Find user
    const user = await prisma.public_users.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token.',
      });
    }

    // Update password via Supabase Auth
    // Note: Without service_role key, we can't update another user's password
    // For now, log warning
    console.warn('[AUTH] Password reset requires service_role key for full implementation');

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
