'use strict';

const notifications = require('../database/notifications.repository');

async function list(req, res, next) {
  try {
    res.json({ notifications: await notifications.listByUser(req.userId) });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notifications.setRead(req.userId, req.params.id, true);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function markUnread(req, res, next) {
  try {
    await notifications.setRead(req.userId, req.params.id, false);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await notifications.remove(req.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function readAll(req, res, next) {
  try {
    await notifications.markAllRead(req.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markUnread, remove, readAll };
