const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const prisma = require('../config/prisma');

router.use(authenticate);

/**
 * GET /codeforces/profile
 * Returns the stored Codeforces profile from the database.
 */
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await prisma.codeforces_profiles.findUnique({
      where: { user_id: req.userId },
    });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Codeforces profile not connected' });
    }
    res.json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
