'use strict';

const users = require('../database/users.repository');
const { getStudyOverview } = require('../database/queries');

async function getMe(req, res, next) {
  try {
    const row = await users.findById(req.userId);
    if (!row) return res.status(404).json({ error: 'Account not found.' });
    res.json({ user: users.toApiUser(row) });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const body = req.body || {};
    const settings = {};

    if (typeof body.name === 'string' && body.name.trim().length >= 2) {
      settings.name = body.name.trim();
    }
    if (body.track === 'new' || body.track === 'licensed') settings.track = body.track;
    if (Number.isInteger(body.dailyGoal) && body.dailyGoal > 0 && body.dailyGoal <= 200) {
      settings.dailyGoal = body.dailyGoal;
    }
    if (typeof body.notificationsOn === 'boolean') settings.notificationsOn = body.notificationsOn;
    if (typeof body.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(body.reminderTime)) {
      settings.reminderTime = body.reminderTime;
    }
    if (typeof body.sounds === 'boolean') settings.sounds = body.sounds;

    const row = await users.updateSettings(req.userId, settings);
    res.json({ user: users.toApiUser(row) });
  } catch (err) {
    next(err);
  }
}

async function saveLicense(req, res, next) {
  try {
    const body = req.body || {};
    await users.setLicense(req.userId, {
      number: typeof body.number === 'string' ? body.number.slice(0, 32) : '',
      fileName: typeof body.fileName === 'string' ? body.fileName.slice(0, 255) : '',
      thumb: typeof body.thumb === 'string' ? body.thumb : null,
    });
    const row = await users.findById(req.userId);
    res.json({ user: users.toApiUser(row) });
  } catch (err) {
    next(err);
  }
}

async function deleteLicense(req, res, next) {
  try {
    await users.clearLicense(req.userId);
    const row = await users.findById(req.userId);
    res.json({ user: users.toApiUser(row) });
  } catch (err) {
    next(err);
  }
}

async function getStudy(req, res, next) {
  try {
    const data = await getStudyOverview(req.userId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateSettings, saveLicense, deleteLicense, getStudy };
