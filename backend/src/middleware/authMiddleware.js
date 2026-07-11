const { verifyAccessToken } = require('../services/authService');

/**
 * Middleware that protects routes by verifying the JWT access token.
 * Expects: Authorization: Bearer <token>
 * On success: attaches req.userId to the request object.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please refresh your token.',
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token.',
    });
  }
};

module.exports = authenticate;
