const {
  getLessons,
  getLessonById,
  getLessonSections,
} = require('../database/queries');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listLessons(req, res, next) {
  try {
    const lessons = await getLessons();
    res.json({ data: lessons });
  } catch (err) {
    next(err);
  }
}

async function getLesson(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid lesson id' });

    const lesson = await getLessonById(id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    lesson.sections = await getLessonSections(id);
    res.json({ data: lesson });
  } catch (err) {
    next(err);
  }
}

module.exports = { listLessons, getLesson };
