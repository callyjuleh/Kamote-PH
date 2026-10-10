const router = require('express').Router();
const { chat, models } = require('../controllers/ai.controllers');

router.post('/chat', chat);
router.get('/models', models);

module.exports = router;
