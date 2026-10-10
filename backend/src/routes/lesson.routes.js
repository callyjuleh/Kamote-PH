const router = require('express').Router();
const { listLessons, getLesson } = require('../controllers/lesson.controllers');

router.get('/', listLessons);
router.get('/:id', getLesson);

module.exports = router;
