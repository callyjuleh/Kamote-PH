'use strict';

const { pool } = require('./connection');

// ---------------------------------------------------------------------------
// Quiz attempts / resume
// ---------------------------------------------------------------------------

async function findInProgressAttempt(userId, quizId) {
  const [rows] = await pool.query(
    `SELECT id, current_index FROM attempts
      WHERE user_id = ? AND quiz_id = ? AND completed_at IS NULL
      ORDER BY started_at DESC LIMIT 1`,
    [userId, quizId]
  );
  return rows[0] || null;
}

async function createInProgressAttempt(userId, quizId) {
  const [result] = await pool.query(
    `INSERT INTO attempts (user_id, quiz_id) VALUES (?, ?)`,
    [userId, quizId]
  );
  return { id: result.insertId, current_index: 0 };
}

async function getAttemptAnswers(attemptId) {
  const [rows] = await pool.query(
    `SELECT question_id, option_id, is_correct FROM attempt_answers WHERE attempt_id = ?`,
    [attemptId]
  );
  return rows.map((r) => ({
    questionId: Number(r.question_id),
    optionId: r.option_id === null ? null : Number(r.option_id),
    isCorrect: Boolean(r.is_correct),
  }));
}

async function getAttemptById(attemptId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, quiz_id, score, total_points, passed, current_index, started_at, completed_at
       FROM attempts WHERE id = ? LIMIT 1`,
    [attemptId]
  );
  return rows[0] || null;
}

async function saveAttemptProgress({ attemptId, answers, currentIndex }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM attempt_answers WHERE attempt_id = ?`, [attemptId]);
    if (answers.length) {
      await conn.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct) VALUES ?`,
        [answers.map((a) => [attemptId, a.questionId, a.optionId, a.isCorrect ? 1 : 0])]
      );
    }
    await conn.query(`UPDATE attempts SET current_index = ? WHERE id = ?`, [currentIndex, attemptId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

async function finalizeAttempt({ attemptId, score, totalPoints, passed, answers, currentIndex }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM attempt_answers WHERE attempt_id = ?`, [attemptId]);
    if (answers.length) {
      await conn.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct) VALUES ?`,
        [answers.map((a) => [attemptId, a.questionId, a.optionId, a.isCorrect ? 1 : 0])]
      );
    }
    await conn.query(
      `UPDATE attempts SET score = ?, total_points = ?, passed = ?, current_index = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [score, totalPoints, passed ? 1 : 0, currentIndex, attemptId]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

async function getAttemptHistory(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT a.id, a.quiz_id, q.title, q.kind, a.score, a.total_points, a.passed, a.completed_at
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      ORDER BY a.completed_at DESC
      LIMIT ?`,
    [userId, Math.min(Math.max(Number(limit) || 50, 1), 200)]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    quizId: Number(r.quiz_id),
    title: r.title,
    kind: r.kind,
    score: Number(r.score),
    total: Number(r.total_points),
    percent: Number(r.total_points) > 0 ? Math.round((r.score / r.total_points) * 100) : 0,
    passed: Boolean(r.passed),
    completedAt: r.completed_at,
  }));
}

async function countCompletedAttempts(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM attempts WHERE user_id = ? AND completed_at IS NOT NULL`,
    [userId]
  );
  return Number(rows[0].n);
}

async function countPassedAttempts(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM attempts WHERE user_id = ? AND completed_at IS NOT NULL AND passed = 1`,
    [userId]
  );
  return Number(rows[0].n);
}

// ---------------------------------------------------------------------------
// Flashcards + progress
// ---------------------------------------------------------------------------

async function getDecks() {
  const [rows] = await pool.query(
    `SELECT deck, MAX(category) AS category, MAX(icon) AS icon, COUNT(*) AS total
       FROM flashcards GROUP BY deck ORDER BY MIN(order_index) ASC`
  );
  return rows.map((r) => ({
    deck: r.deck,
    category: r.category,
    icon: r.icon,
    total: Number(r.total),
  }));
}

async function getCards(deck) {
  const params = [];
  let where = '';
  if (deck) {
    where = 'WHERE deck = ?';
    params.push(deck);
  }
  const [rows] = await pool.query(
    `SELECT id, deck, category, icon, front, back, order_index
       FROM flashcards ${where} ORDER BY order_index ASC, id ASC`,
    params
  );
  return rows.map((r) => ({
    id: Number(r.id),
    deck: r.deck,
    category: r.category,
    icon: r.icon,
    front: r.front,
    back: r.back,
  }));
}

async function saveFlashcardProgress({ userId, deck, currentIndex, cardsTotal }) {
  await pool.query(
    `INSERT INTO user_flashcard_progress (user_id, deck, current_index, cards_total)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE current_index = VALUES(current_index), cards_total = VALUES(cards_total)`,
    [userId, deck, currentIndex, cardsTotal]
  );
}

async function getFlashcardProgress(userId) {
  const [rows] = await pool.query(
    `SELECT deck, current_index, cards_total, updated_at FROM user_flashcard_progress WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => ({
    deck: r.deck,
    currentIndex: Number(r.current_index),
    cardsTotal: Number(r.cards_total),
    updatedAt: r.updated_at,
  }));
}

async function totalCardsSeen(userId) {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(cards_total), 0) AS n FROM user_flashcard_progress WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0].n);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

async function listAchievementDefinitions() {
  const [rows] = await pool.query(`SELECT id, code, title, description, icon FROM achievements ORDER BY id ASC`);
  return rows.map((r) => ({
    id: Number(r.id),
    code: r.code,
    title: r.title,
    description: r.description,
    icon: r.icon,
  }));
}

async function getEarnedAchievementCodes(userId) {
  const [rows] = await pool.query(
    `SELECT a.code, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ?`,
    [userId]
  );
  return new Map(rows.map((r) => [r.code, r.earned_at]));
}

async function awardAchievement(userId, code) {
  const [rows] = await pool.query(`SELECT id FROM achievements WHERE code = ? LIMIT 1`, [code]);
  if (!rows.length) return false;
  const [result] = await pool.query(
    `INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
    [userId, rows[0].id]
  );
  return result.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Goals / activity stats
// ---------------------------------------------------------------------------

async function getActivityStats(userId) {
  const [study] = await pool.query(
    `SELECT COALESCE(SUM(LEAST(current_index + 1, cards_total)), 0) AS cards, COUNT(*) AS decks
       FROM user_flashcard_progress WHERE user_id = ?`,
    [userId]
  );
  const [legacyStudy] = await pool.query(
    `SELECT COALESCE(SUM(cards_completed), 0) AS cards FROM study_progress WHERE user_id = ?`,
    [userId]
  );
  const [quizzes] = await pool.query(
    `SELECT COUNT(*) AS taken, COALESCE(SUM(passed), 0) AS passed
       FROM attempts WHERE user_id = ? AND completed_at IS NOT NULL`,
    [userId]
  );
  const [lessons] = await pool.query(
    `SELECT COUNT(*) AS completed FROM progress WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );

  // Streak: consecutive days (ending today or yesterday) with any study/quiz activity.
  const [days] = await pool.query(
    `SELECT DISTINCT d FROM (
        SELECT DATE(updated_at) AS d FROM user_flashcard_progress WHERE user_id = ?
        UNION
        SELECT DATE(updated_at) AS d FROM study_progress WHERE user_id = ?
        UNION
        SELECT DATE(completed_at) AS d FROM attempts WHERE user_id = ? AND completed_at IS NOT NULL
        UNION
        SELECT DATE(completed_at) AS d FROM progress WHERE user_id = ? AND completed_at IS NOT NULL
     ) x ORDER BY d DESC`,
    [userId, userId, userId, userId]
  );

  return {
    cardsReviewed: Number(study[0].cards) + Number(legacyStudy[0].cards),
    decksTouched: Number(study[0].decks),
    quizzesTaken: Number(quizzes[0].taken),
    quizzesPassed: Number(quizzes[0].passed),
    lessonsCompleted: Number(lessons[0].completed),
    streak: computeStreak(days.map((r) => toDateOnly(r.d))),
  };
}

async function getWeeklyCardProgress(userId) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(activity_date, '%Y-%m-%d') AS date, SUM(cards) AS cardsReviewed
       FROM (
         SELECT DATE(updated_at) AS activity_date,
                SUM(LEAST(current_index + 1, cards_total)) AS cards
           FROM user_flashcard_progress
          WHERE user_id = ? AND updated_at >= CURRENT_DATE - INTERVAL 6 DAY
          GROUP BY DATE(updated_at)
         UNION ALL
         SELECT DATE(updated_at) AS activity_date, SUM(cards_completed) AS cards
           FROM study_progress
          WHERE user_id = ? AND updated_at >= CURRENT_DATE - INTERVAL 6 DAY
          GROUP BY DATE(updated_at)
       ) daily_progress
      GROUP BY activity_date
      ORDER BY activity_date ASC`,
    [userId, userId]
  );
  return rows.map((row) => ({ date: row.date, cardsReviewed: Number(row.cardsReviewed) }));
}

function toDateOnly(value) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(daysDesc) {
  if (!daysDesc.length) return 0;
  const today = toDateOnly(new Date());
  const oneDay = 24 * 60 * 60 * 1000;
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  let cursor = new Date(`${daysDesc[0]}T00:00:00`).getTime();
  // Streak must include today or yesterday to be "active".
  if (todayMs - cursor > oneDay) return 0;
  let streak = 1;
  for (let i = 1; i < daysDesc.length; i += 1) {
    const prev = new Date(`${daysDesc[i]}T00:00:00`).getTime();
    if (cursor - prev === oneDay) {
      streak += 1;
      cursor = prev;
    } else if (cursor - prev === 0) {
      // duplicate day, skip
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Suggestions (from wrong answers)
// ---------------------------------------------------------------------------

async function getWeakCategories(userId) {
  const [rows] = await pool.query(
    `SELECT l.title AS lesson_title, l.category,
            SUM(CASE WHEN aa.is_correct = 0 THEN 1 ELSE 0 END) AS wrong,
            COUNT(*) AS answered
       FROM attempt_answers aa
       JOIN attempts att ON att.id = aa.attempt_id
       JOIN questions q ON q.id = aa.question_id
       JOIN quizzes qz ON qz.id = q.quiz_id
       LEFT JOIN lessons l ON l.id = qz.lesson_id
      WHERE att.user_id = ? AND att.completed_at IS NOT NULL
      GROUP BY l.id, l.title, l.category
      HAVING wrong > 0
      ORDER BY wrong DESC
      LIMIT 5`,
    [userId]
  );
  return rows.map((r) => ({
    lessonTitle: r.lesson_title || 'General',
    category: r.category || 'General',
    wrong: Number(r.wrong),
    answered: Number(r.answered),
  }));
}

async function getWrongPrompts(userId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT q.prompt, q.id, qz.lesson_id
       FROM attempt_answers aa
       JOIN attempts att ON att.id = aa.attempt_id
       JOIN questions q ON q.id = aa.question_id
       JOIN quizzes qz ON qz.id = q.quiz_id
      WHERE att.user_id = ? AND att.completed_at IS NOT NULL AND aa.is_correct = 0
      GROUP BY q.id, q.prompt, qz.lesson_id
      ORDER BY MAX(att.completed_at) DESC
      LIMIT ?`,
    [userId, Math.min(Math.max(Number(limit) || 5, 1), 20)]
  );
  return rows.map((r) => ({ questionId: Number(r.id), prompt: r.prompt, lessonId: r.lesson_id ? Number(r.lesson_id) : null }));
}

async function getFeaturedLessons(limit = 4) {
  const [rows] = await pool.query(
    `SELECT id, title, category, description FROM lessons
      WHERE is_published = 1 ORDER BY order_index ASC, id ASC LIMIT ?`,
    [Math.min(Math.max(Number(limit) || 4, 1), 20)]
  );
  return rows.map((r) => ({ id: Number(r.id), title: r.title, category: r.category, description: r.description }));
}

module.exports = {
  findInProgressAttempt,
  createInProgressAttempt,
  getAttemptAnswers,
  getAttemptById,
  saveAttemptProgress,
  finalizeAttempt,
  getAttemptHistory,
  countCompletedAttempts,
  countPassedAttempts,
  getDecks,
  getCards,
  saveFlashcardProgress,
  getFlashcardProgress,
  totalCardsSeen,
  listAchievementDefinitions,
  getEarnedAchievementCodes,
  awardAchievement,
  getActivityStats,
  getWeeklyCardProgress,
  getWeakCategories,
  getWrongPrompts,
  getFeaturedLessons,
};
