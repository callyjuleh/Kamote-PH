'use strict';

const {
  getQuizById,
  getQuizQuestions,
  getQuestionOptions,
  getQuestionAnswerKey,
  getQuestionPoints,
  upsertProgress,
} = require('../database/queries');
const features = require('../database/features.repository');
const { evaluateAchievements } = require('./features.controllers');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function groupOptionsByQuestion(options) {
  return options.reduce((acc, opt) => {
    (acc[opt.question_id] = acc[opt.question_id] || []).push(opt);
    return acc;
  }, {});
}

async function getQuiz(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid quiz id' });

    const quiz = await getQuizById(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await getQuizQuestions(id);
    const options = await getQuestionOptions(questions.map((q) => q.id));
    const byQuestion = groupOptionsByQuestion(options);

    quiz.questions = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      points: q.points,
      order_index: q.order_index,
      options: (byQuestion[q.id] || []).map((o) => ({
        id: o.id,
        body: o.body,
        order_index: o.order_index,
      })),
    }));

    res.json({
      data: {
        id: quiz.id,
        lessonId: quiz.lesson_id == null ? null : Number(quiz.lesson_id),
        title: quiz.title,
        kind: quiz.kind,
        timeLimit: quiz.time_limit,
        passScore: quiz.pass_score,
        questions: quiz.questions,
      },
    });
  } catch (err) {
    next(err);
  }
}

function resolveUserId(req) {
  return parseId(req.userId) || parseId(req.body && req.body.userId);
}

async function gradeAnswers(quizId, answers) {
  const questions = await getQuizQuestions(quizId);
  const questionIds = questions.map((q) => q.id);
  const [answerKey, points, optionRows] = await Promise.all([
    getQuestionAnswerKey(questionIds),
    getQuestionPoints(questionIds),
    getQuestionOptions(questionIds),
  ]);
  const correctByQuestion = new Map(answerKey.map((r) => [r.question_id, r.option_id]));
  const pointsByQuestion = new Map(points.map((r) => [r.id, r.points]));
  const byQuestion = groupOptionsByQuestion(optionRows);
  const infoById = new Map(questions.map((q) => [q.id, q]));

  const seen = new Set();
  const graded = [];
  let score = 0;
  let totalPoints = 0;
  for (const q of questions) totalPoints += q.points;

  for (const answer of answers) {
    const questionId = parseId(answer.questionId);
    const optionId = parseId(answer.optionId);
    if (!questionId || !pointsByQuestion.has(questionId)) return { error: `Unknown questionId: ${answer.questionId}` };
    if (seen.has(questionId)) return { error: `Duplicate answer for question ${questionId}` };
    seen.add(questionId);
    const correctOptionId = correctByQuestion.get(questionId) ?? null;
    const isCorrect = correctOptionId !== null && correctOptionId === optionId;
    if (isCorrect) score += pointsByQuestion.get(questionId) || 0;
    const info = infoById.get(questionId) || {};
    graded.push({
      questionId,
      optionId: optionId || null,
      isCorrect,
      correctOptionId,
      explanation: info.explanation || null,
      prompt: info.prompt || "",
      options: (byQuestion[questionId] || []).map((o) => ({ id: o.id, body: o.body })),
    });
  }
  return { graded, score, totalPoints };
}

// POST /api/quizzes/:id/start — create or resume an in-progress attempt.
async function startSession(req, res, next) {
  try {
    const quizId = parseId(req.params.id);
    const userId = resolveUserId(req);
    if (!quizId) return res.status(400).json({ error: 'Invalid quiz id' });
    if (!userId) return res.status(401).json({ error: 'Sign in to save your progress.' });

    const quiz = await getQuizById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let attempt = await features.findInProgressAttempt(userId, quizId);
    let resumed = Boolean(attempt);
    if (!attempt) {
      attempt = await features.createInProgressAttempt(userId, quizId);
      resumed = false;
    }
    const answers = resumed ? await features.getAttemptAnswers(attempt.id) : [];
    res.json({
      data: { attemptId: Number(attempt.id), currentIndex: Number(attempt.current_index) || 0, answers, resumed },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/quizzes/:id/attempt — current in-progress session (or null).
async function getSession(req, res, next) {
  try {
    const quizId = parseId(req.params.id);
    const userId = resolveUserId(req);
    if (!quizId) return res.status(400).json({ error: 'Invalid quiz id' });
    if (!userId) return res.status(401).json({ error: 'Sign in to load your progress.' });

    const attempt = await features.findInProgressAttempt(userId, quizId);
    if (!attempt) return res.json({ data: null });
    const answers = await features.getAttemptAnswers(attempt.id);
    res.json({ data: { attemptId: Number(attempt.id), currentIndex: Number(attempt.current_index) || 0, answers } });
  } catch (err) {
    next(err);
  }
}

// PUT /api/quizzes/:id/attempt — persist answers + position mid-quiz.
async function saveSession(req, res, next) {
  try {
    const quizId = parseId(req.params.id);
    const userId = resolveUserId(req);
    const attemptId = parseId(req.body && req.body.attemptId);
    if (!quizId || !attemptId) return res.status(400).json({ error: 'quiz id and attemptId are required' });
    if (!userId) return res.status(401).json({ error: 'Sign in to save your progress.' });

    const attempt = await features.getAttemptById(attemptId);
    if (!attempt || Number(attempt.user_id) !== userId || Number(attempt.quiz_id) !== quizId) {
      return res.status(403).json({ error: 'This attempt does not belong to you.' });
    }
    if (attempt.completed_at) return res.status(409).json({ error: 'This attempt is already finished.' });

    const incoming = Array.isArray(req.body.answers) ? req.body.answers : [];
    const { graded, error } = await gradeAnswers(quizId, incoming);
    if (error) return res.status(400).json({ error });

    const currentIndex = Number.isInteger(req.body.currentIndex) && req.body.currentIndex >= 0 ? req.body.currentIndex : 0;
    await features.saveAttemptProgress({ attemptId, answers: graded, currentIndex });
    res.json({ data: { attemptId, currentIndex, answers: graded } });
  } catch (err) {
    next(err);
  }
}

async function submitQuiz(req, res, next) {
  try {
    const quizId = parseId(req.params.id);
    if (!quizId) return res.status(400).json({ error: 'Invalid quiz id' });

    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in to record your result.' });

    const answers = Array.isArray(req.body.answers) ? req.body.answers : null;
    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'answers must be a non-empty array' });
    }

    const quiz = await getQuizById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { graded, score, totalPoints, error } = await gradeAnswers(quizId, answers);
    if (error) return res.status(400).json({ error });

    const percent = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percent >= quiz.pass_score;

    // Reuse an existing in-progress attempt if it belongs to the user (no duplicates).
    const existing = parseId(req.body.attemptId) || (await features.findInProgressAttempt(userId, quizId))?.id || null;
    let attemptId = null;
    if (existing) {
      const owned = await features.getAttemptById(existing);
      if (owned && Number(owned.user_id) === userId && !owned.completed_at) {
        attemptId = Number(owned.id);
        await features.finalizeAttempt({ attemptId, score, totalPoints, passed, answers: graded, currentIndex: graded.length });
      }
    }
    if (!attemptId) {
      const created = await features.createInProgressAttempt(userId, quizId);
      attemptId = Number(created.id);
      await features.finalizeAttempt({ attemptId, score, totalPoints, passed, answers: graded, currentIndex: graded.length });
    }

    if (quiz.lesson_id) {
      await upsertProgress({ userId, lessonId: quiz.lesson_id, status: passed ? 'completed' : 'in_progress' });
    }

    const earned = await evaluateAchievements(userId);

    res.status(201).json({
      data: {
        attemptId,
        quizId,
        lessonId: quiz.lesson_id == null ? null : Number(quiz.lesson_id),
        score,
        totalPoints,
        percent,
        passScore: quiz.pass_score,
        passed,
        answers: graded,
        earnedAchievements: earned,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getQuiz, startSession, getSession, saveSession, submitQuiz };
