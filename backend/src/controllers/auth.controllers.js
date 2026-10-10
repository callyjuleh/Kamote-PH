'use strict';

const { hashPassword, verifyPassword } = require('../auth/password');
const { signToken } = require('../auth/tokens');
const users = require('../database/users.repository');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function register(req, res, next) {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const track = body.track === 'licensed' ? 'licensed' : 'new';

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const row = await users.createUser({
      name,
      email,
      passwordHash: hashPassword(password),
      track,
    });
    const user = users.toApiUser(row);
    return res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }

    const row = await users.findByEmail(email);
    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const user = users.toApiUser(row);
    return res.json({ token: signToken(user.id), user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
