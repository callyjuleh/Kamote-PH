const router = require('express').Router();
const { getQuiz, startSession, getSession, saveSession, submitQuiz } = require('../controllers/quiz.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/:id', getQuiz);
router.get('/:id/attempt', requireAuth, getSession);
router.post('/:id/start', requireAuth, startSession);
router.put('/:id/attempt', requireAuth, saveSession);
router.post('/:id/submit', requireAuth, submitQuiz);

module.exports = router;
