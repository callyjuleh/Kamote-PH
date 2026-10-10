'use strict';

const router = require('express').Router();
const {
  listProgress,
  updateProgress,
  saveQuizAttempt,
  saveStudyProgress,
} = require('../controllers/progress.controllers');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/quiz', requireAuth, saveQuizAttempt);
router.put('/study', requireAuth, saveStudyProgress);
router.get('/:userId', listProgress);
router.put('/:userId/:lessonId', updateProgress);

module.exports = router;
