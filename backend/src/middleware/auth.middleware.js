'use strict';

const { verifyToken } = require('../auth/tokens');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  req.userId = payload.uid;
  next();
}

module.exports = { requireAuth };
