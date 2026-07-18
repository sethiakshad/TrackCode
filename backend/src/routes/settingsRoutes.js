const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

// All settings routes require authentication
router.use(authenticate);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.post('/accounts/:platform', settingsController.connectAccount);
router.delete('/accounts/:platform', settingsController.disconnectAccount);

module.exports = router;
