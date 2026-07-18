const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const bookmarkController = require('../controllers/bookmarkController');

// All bookmark endpoints require authentication
router.use(authenticate);

router.post('/', bookmarkController.addBookmark);
router.get('/', bookmarkController.listBookmarks);
router.get('/filter', bookmarkController.filterBookmarks);
router.delete('/:problemId', bookmarkController.removeBookmark);

module.exports = router;
