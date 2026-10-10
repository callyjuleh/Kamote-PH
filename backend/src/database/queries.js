const { pool } = require('./connection');

async function getLessons() {
  const [rows] = await pool.query(
    `SELECT l.id, l.title, l.description, l.category, l.icon,
            l.order_index, l.duration_min,
            (SELECT COUNT(*) FROM lesson_sections s WHERE s.lesson_id = l.id) AS section_count,
            (SELECT MIN(q.id) FROM quizzes q WHERE q.lesson_id = l.id) AS quiz_id
       FROM lessons l
      WHERE l.is_published = 1
      ORDER BY l.order_index ASC, l.id ASC`
  );
  return rows;
}

async function getStudyOverview(userId) {
  const [rows] = await pool.query(
    `SELECT l.id, l.title, l.description, l.category, l.icon,
            l.order_index, l.duration_min,
            (SELECT COUNT(*) FROM lesson_sections s WHERE s.lesson_id = l.id) AS section_count,
            (SELECT MIN(q.id) FROM quizzes q WHERE q.lesson_id = l.id) AS quiz_id,
            COALESCE(lp.status, 'not_started') AS status,
            lp.completed_at, lp.updated_at
       FROM lessons l
       LEFT JOIN progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
      WHERE l.is_published = 1
      ORDER BY l.order_index ASC, l.id ASC`,
    [userId]
  );
  return rows;
}

async function getLessonById(id) {
  const [rows] = await pool.query(
    `SELECT id, title, description, category, icon, order_index, duration_min,
            (SELECT COUNT(*) FROM lesson_sections s WHERE s.lesson_id = lessons.id) AS section_count,
            (SELECT MIN(q.id) FROM quizzes q WHERE q.lesson_id = lessons.id) AS quiz_id
       FROM lessons
      WHERE id = ? AND is_published = 1`,
    [id]
  );
  return rows[0] || null;
}

async function getLessonSections(lessonId) {
  const [rows] = await pool.query(
    `SELECT id, heading, body, media_url, source_document, source_page, source_ref, order_index
       FROM lesson_sections
      WHERE lesson_id = ?
      ORDER BY order_index ASC, id ASC`,
    [lessonId]
  );
  return rows;
}

async function getQuizById(id) {
  const [rows] = await pool.query(
    `SELECT id, lesson_id, title, kind, pass_score, time_limit
       FROM quizzes
      WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getQuizQuestions(quizId) {
  const [rows] = await pool.query(
    `SELECT id, prompt, explanation, points, order_index
       FROM questions
      WHERE quiz_id = ?
      ORDER BY order_index ASC, id ASC`,
    [quizId]
  );
  return rows;
}

async function getQuestionOptions(questionIds) {
  if (!questionIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id, question_id, body, is_correct, order_index
       FROM options
      WHERE question_id IN (?)
      ORDER BY question_id ASC, order_index ASC, id ASC`,
    [questionIds]
  );
  return rows;
}

async function getQuestionAnswerKey(questionIds) {
  if (!questionIds.length) return [];
  const [rows] = await pool.query(
    `SELECT question_id, id AS option_id
       FROM options
      WHERE is_correct = 1 AND question_id IN (?)`,
    [questionIds]
  );
  return rows;
}

async function getQuestionPoints(questionIds) {
  if (!questionIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id, points FROM questions WHERE id IN (?)`,
    [questionIds]
  );
  return rows;
}

async function createAttempt(conn, { userId, quizId }) {
  const [result] = await conn.query(
    `INSERT INTO attempts (user_id, quiz_id) VALUES (?, ?)`,
    [userId, quizId]
  );
  return result.insertId;
}

async function insertAttemptAnswer(conn, answers) {
  if (!answers.length) return;
  await conn.query(
    `INSERT INTO attempt_answers (attempt_id, question_id, option_id, is_correct)
     VALUES ?`,
    [answers.map((a) => [a.attemptId, a.questionId, a.optionId, a.isCorrect ? 1 : 0])]
  );
}

async function completeAttempt(conn, { attemptId, score, totalPoints, passed }) {
  await conn.query(
    `UPDATE attempts
        SET score = ?, total_points = ?, passed = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [score, totalPoints, passed ? 1 : 0, attemptId]
  );
}

async function getProgressByUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.lesson_id, l.title, l.category, l.duration_min,
            p.status, p.completed_at, p.updated_at
       FROM progress p
       JOIN lessons l ON l.id = p.lesson_id
      WHERE p.user_id = ?
      ORDER BY l.order_index ASC, l.id ASC`,
    [userId]
  );
  return rows;
}

async function upsertProgress({ userId, lessonId, status }) {
  // Ensure a row exists without clobbering an existing (possibly completed) one.
  await pool.query(
    `INSERT IGNORE INTO progress (user_id, lesson_id, status, completed_at)
     VALUES (?, ?, 'not_started', NULL)`,
    [userId, lessonId]
  );
  if (status === 'completed') {
    await pool.query(
      `UPDATE progress SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND lesson_id = ?`,
      [userId, lessonId]
    );
  } else if (status === 'in_progress') {
    await pool.query(
      `UPDATE progress SET status = 'in_progress'
        WHERE user_id = ? AND lesson_id = ? AND status <> 'completed'`,
      [userId, lessonId]
    );
  }
  const [rows] = await pool.query(
    `SELECT user_id, lesson_id, status, completed_at, updated_at
       FROM progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );
  return rows[0];
}

module.exports = {
  getLessons,
  getStudyOverview,
  getLessonById,
  getLessonSections,
  getQuizById,
  getQuizQuestions,
  getQuestionOptions,
  getQuestionAnswerKey,
  getQuestionPoints,
  createAttempt,
  insertAttemptAnswer,
  completeAttempt,
  getProgressByUser,
  upsertProgress,
};
