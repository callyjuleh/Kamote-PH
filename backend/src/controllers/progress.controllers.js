const { getProgressByUser, upsertProgress } = require('../database/queries');
const { pool } = require('../database/connection');
const { evaluateAchievements, maybeAward } = require('./features.controllers');

const STATUSES = ['not_started', 'in_progress', 'completed'];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listProgress(req, res, next) {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    const rows = await getProgressByUser(userId);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const userId = parseId(req.params.userId);
    const lessonId = parseId(req.params.lessonId);
    if (!userId || !lessonId) {
      return res.status(400).json({ error: 'Invalid userId or lessonId' });
    }

    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
    }

    const row = await upsertProgress({ userId, lessonId, status });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
}

async function saveQuizAttempt(req, res, next) {
  try {
    const { score, total } = req.body || {};
    if (!Number.isFinite(Number(score)) || !Number.isFinite(Number(total))) {
      return res.status(400).json({ error: 'score and total are required numbers' });
    }
    await pool.query(
      `INSERT INTO quiz_attempts (user_id, score, total) VALUES (?, ?, ?)`,
      [req.userId, Math.trunc(Number(score)), Math.trunc(Number(total))]
    );
    await maybeAward(req.userId, ['first_quiz']);
    if (Number(score) === Number(total) && Number(total) > 0) await maybeAward(req.userId, ['perfect_score']);
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

async function saveStudyProgress(req, res, next) {
  try {
    const body = req.body || {};
    const studySet = typeof body.studySet === 'string' ? body.studySet.trim() : '';
    if (!studySet) return res.status(400).json({ error: 'studySet is required' });

    await pool.query(
      `INSERT INTO study_progress (user_id, study_set, cards_completed, cards_total, accuracy)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         cards_completed = VALUES(cards_completed),
         cards_total = VALUES(cards_total),
         accuracy = VALUES(accuracy)`,
      [
        req.userId,
        studySet.slice(0, 180),
        Math.trunc(Number(body.cardsCompleted)) || 0,
        Math.trunc(Number(body.cardsTotal)) || 0,
        Math.trunc(Number(body.accuracy)) || 0,
      ]
    );
    const { cardsCompleted } = body;
    if (Math.trunc(Number(cardsCompleted)) >= 10) await maybeAward(req.userId, ['flashcard_10']);
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProgress, updateProgress, saveQuizAttempt, saveStudyProgress };
