'use strict';

const crypto = require('crypto');

const SECRET = process.env.AUTH_SECRET || 'kamote-ph-dev-secret-change-me';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function signToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ uid: Number(userId), exp: Date.now() + TTL_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.uid !== 'number') return null;
    if (typeof data.exp === 'number' && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken };
