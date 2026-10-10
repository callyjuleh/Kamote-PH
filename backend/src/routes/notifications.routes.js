'use strict';

const router = require('express').Router();
const {
  list,
  markRead,
  markUnread,
  remove,
  readAll,
} = require('../controllers/notifications.controllers');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, list);
router.patch('/read-all', requireAuth, readAll);
router.patch('/:id/read', requireAuth, markRead);
router.delete('/:id/read', requireAuth, markUnread);
router.delete('/:id', requireAuth, remove);

module.exports = router;
