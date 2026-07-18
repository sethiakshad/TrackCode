const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const goalController = require('../controllers/goalController');

// All goal endpoints require authentication
router.use(authenticate);

router.post('/', goalController.createGoal);
router.get('/', goalController.getAllGoals);
router.put('/:goalId', goalController.updateGoal);
router.patch('/:goalId', goalController.updateGoal);          // alias for frontend
router.patch('/:goalId/progress', goalController.updateGoal); // progress update
router.delete('/:goalId', goalController.deleteGoal);
router.get('/daily', goalController.getDailyGoals);
router.get('/weekly', goalController.getWeeklyGoals);
router.get('/progress', goalController.getProgress);
router.get('/completion', goalController.getCompletionPercentage);


module.exports = router;
