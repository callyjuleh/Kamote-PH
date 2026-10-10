'use strict';

const repo = require('../database/features.repository');
const users = require('../database/users.repository');

const POLICY_VERSION = '1.0';
const POLICY_TYPES = { privacy: 'privacy', terms: 'terms' };

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

async function listDecks(req, res, next) {
  try {
    res.json({ decks: await repo.getDecks() });
  } catch (err) {
    next(err);
  }
}

async function listCards(req, res, next) {
  try {
    const deck = typeof req.query.deck === 'string' ? req.query.deck.trim() : '';
    res.json({ cards: await repo.getCards(deck || null) });
  } catch (err) {
    next(err);
  }
}

async function getFlashcardProgress(req, res, next) {
  try {
    res.json({ progress: await repo.getFlashcardProgress(req.userId) });
  } catch (err) {
    next(err);
  }
}

async function saveFlashcardProgress(req, res, next) {
  try {
    const body = req.body || {};
    const deck = typeof body.deck === 'string' ? body.deck.trim() : '';
    if (!deck) return res.status(400).json({ error: 'deck is required' });
    const currentIndex = Number.isInteger(body.currentIndex) && body.currentIndex >= 0 ? body.currentIndex : 0;
    const cardsTotal = Number.isInteger(body.cardsTotal) && body.cardsTotal >= 0 ? body.cardsTotal : 0;
    await repo.saveFlashcardProgress({ userId: req.userId, deck, currentIndex, cardsTotal });
    await maybeAward(req.userId, ['flashcard_10']);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Achievements / goals / suggestions / history
// ---------------------------------------------------------------------------

async function getAchievements(req, res, next) {
  try {
    const [defs, earned] = await Promise.all([
      repo.listAchievementDefinitions(),
      repo.getEarnedAchievementCodes(req.userId),
    ]);
    res.json({
      achievements: defs.map((a) => ({ ...a, earned: earned.has(a.code), earnedAt: earned.get(a.code) || null })),
    });
  } catch (err) {
    next(err);
  }
}

async function getGoals(req, res, next) {
  try {
    const user = await users.findById(req.userId);
    const [stats, weekly] = await Promise.all([
      repo.getActivityStats(req.userId),
      repo.getWeeklyCardProgress(req.userId),
    ]);
    res.json({
      dailyGoal: Number(user.daily_goal),
      stats,
      weekly,
      goals: [
        { key: 'daily_cards', label: `Review ${user.daily_goal} cards today`, target: Number(user.daily_goal), done: false },
        { key: 'streak', label: 'Keep a 7-day streak', target: 7, current: stats.streak, done: stats.streak >= 7 },
        { key: 'first_quiz', label: 'Take your first quiz', target: 1, current: stats.quizzesTaken, done: stats.quizzesTaken >= 1 },
        { key: 'pass_five', label: 'Pass five quizzes', target: 5, current: stats.quizzesPassed, done: stats.quizzesPassed >= 5 },
        { key: 'lessons', label: 'Complete three lessons', target: 3, current: stats.lessonsCompleted, done: stats.lessonsCompleted >= 3 },
      ],
    });
  } catch (err) {
    next(err);
  }
}

async function getSuggestions(req, res, next) {
  try {
    const [weak, wrong, featured, history] = await Promise.all([
      repo.getWeakCategories(req.userId),
      repo.getWrongPrompts(req.userId, 5),
      repo.getFeaturedLessons(4),
      repo.getAttemptHistory(req.userId, 5),
    ]);
    const personalized = history.length > 0;
    res.json({
      personalized,
      weakCategories: weak,
      wrongQuestions: wrong,
      recentAttempts: history,
      general: featured.map((l) => ({
        lessonId: l.id,
        title: l.title,
        category: l.category,
        question: `Explain the key points of "${l.title}" in simple terms.`,
      })),
      personalizedPrompts: weak.map((w) => `Give me a quick refresher on ${w.lessonTitle} — I missed ${w.wrong} question(s).`),
    });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    res.json({ attempts: await repo.getAttemptHistory(req.userId, 50) });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Consent (privacy policy / terms of use)
// ---------------------------------------------------------------------------

async function getConsent(req, res, next) {
  try {
    const row = await users.findById(req.userId);
    res.json({
      version: POLICY_VERSION,
      privacy: { version: row.consent_privacy_version, acceptedAt: row.consent_privacy_at },
      terms: { version: row.consent_terms_version, acceptedAt: row.consent_terms_at },
    });
  } catch (err) {
    next(err);
  }
}

async function saveConsent(req, res, next) {
  try {
    const type = req.body && req.body.type;
    if (!POLICY_TYPES[type]) return res.status(400).json({ error: "type must be 'privacy' or 'terms'" });
    await users.recordConsent(req.userId, type, POLICY_VERSION);
    const row = await users.findById(req.userId);
    res.json({ user: users.toApiUser(row) });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// License review (admin only)
// ---------------------------------------------------------------------------

async function reviewLicense(req, res, next) {
  try {
    const token = req.headers['x-admin-token'] || '';
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Admin authorization required.' });
    }
    const status = req.body && req.body.status;
    if (!['verified', 'rejected', 'pending', 'none'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const note = typeof req.body.note === 'string' ? req.body.note.slice(0, 255) : null;
    await users.setLicenseStatus(req.params.id, status, note);
    await evaluateAchievements(req.params.id);
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Shared achievement awarding (called from quiz submit / study save)
// ---------------------------------------------------------------------------

async function maybeAward(userId, codes) {
  const awarded = [];
  for (const code of codes) {
    // eslint-disable-next-line no-await-in-loop
    if (await repo.awardAchievement(userId, code)) awarded.push(code);
  }
  return awarded;
}

async function evaluateAchievements(userId) {
  const stats = await repo.getActivityStats(userId);
  const codes = [];
  if (stats.quizzesTaken >= 1) codes.push('first_quiz');
  if (stats.quizzesPassed >= 1) codes.push('first_quiz');
  if (stats.quizzesPassed >= 5) codes.push('quiz_ace');
  if (stats.lessonsCompleted >= 1) codes.push('first_lesson');
  if (stats.cardsReviewed >= 10) codes.push('flashcard_10');
  if (stats.streak >= 7) codes.push('seven_day_streak');
  const user = await users.findById(userId);
  if (user && (user.license_status === 'verified' || user.track === 'licensed')) codes.push('verified_driver');
  return maybeAward(userId, [...new Set(codes)]);
}

module.exports = {
  POLICY_VERSION,
  listDecks,
  listCards,
  getFlashcardProgress,
  saveFlashcardProgress,
  getAchievements,
  getGoals,
  getSuggestions,
  getHistory,
  getConsent,
  saveConsent,
  reviewLicense,
  maybeAward,
  evaluateAchievements,
};
