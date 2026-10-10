'use strict';

const router = require('express').Router();
const { getMe, updateSettings, saveLicense, deleteLicense, getStudy } = require('../controllers/me.controllers');
const {
  getAchievements,
  getGoals,
  getSuggestions,
  getHistory,
  getConsent,
  saveConsent,
  getFlashcardProgress,
  saveFlashcardProgress,
} = require('../controllers/features.controllers');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getMe);
router.get('/study', requireAuth, getStudy);
router.patch('/settings', requireAuth, updateSettings);
router.put('/license', requireAuth, saveLicense);
router.delete('/license', requireAuth, deleteLicense);
router.get('/flashcards', requireAuth, getFlashcardProgress);
router.put('/flashcards', requireAuth, saveFlashcardProgress);
router.get('/achievements', requireAuth, getAchievements);
router.get('/goals', requireAuth, getGoals);
router.get('/suggestions', requireAuth, getSuggestions);
router.get('/attempts', requireAuth, getHistory);
router.get('/consent', requireAuth, getConsent);
router.post('/consent', requireAuth, saveConsent);

module.exports = router;
