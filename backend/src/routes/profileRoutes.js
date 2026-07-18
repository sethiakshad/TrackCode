const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const {
  validateUpdateProfile,
  validateChangePassword,
} = require('../validators/profileValidator');

// All profile endpoints require authentication
router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/', validateUpdateProfile, profileController.updateProfile);
router.put('/change-password', validateChangePassword, profileController.changePassword);
router.post('/avatar', profileController.uploadAvatar);
router.delete('/', profileController.deleteAccount);

module.exports = router;
