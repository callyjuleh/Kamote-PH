'use strict';

const router = require('express').Router();
const { listDecks, listCards } = require('../controllers/features.controllers');

router.get('/decks', listDecks);
router.get('/', listCards);

module.exports = router;
