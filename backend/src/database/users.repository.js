'use strict';

const { pool } = require('./connection');

const COLUMNS = `id, full_name, email, track, daily_goal, notifications_on,
  reminder_time, sounds, license_number, license_file_name, license_thumb,
  license_status, license_review_note,
  consent_privacy_version, consent_privacy_at, consent_terms_version, consent_terms_at`;

function toApiUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.full_name,
    email: row.email,
    track: row.track,
    dailyGoal: Number(row.daily_goal),
    notificationsOn: Boolean(row.notifications_on),
    reminderTime: row.reminder_time,
    sounds: Boolean(row.sounds),
    licenseStatus: row.license_status || 'none',
    licenseReviewNote: row.license_review_note || null,
    consent: {
      privacy: { version: row.consent_privacy_version || null, acceptedAt: row.consent_privacy_at || null },
      terms: { version: row.consent_terms_version || null, acceptedAt: row.consent_terms_at || null },
    },
  };
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, track }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, track) VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, track]
  );
  return findById(result.insertId);
}

async function updateSettings(id, settings) {
  const map = {
    name: 'full_name',
    track: 'track',
    dailyGoal: 'daily_goal',
    notificationsOn: 'notifications_on',
    reminderTime: 'reminder_time',
    sounds: 'sounds',
  };
  const fields = [];
  const values = [];
  for (const [key, column] of Object.entries(map)) {
    if (settings[key] === undefined) continue;
    fields.push(`${column} = ?`);
    if (key === 'notificationsOn' || key === 'sounds') {
      values.push(settings[key] ? 1 : 0);
    } else {
      values.push(settings[key]);
    }
  }
  if (fields.length) {
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  return findById(id);
}

async function setLicense(id, { number, fileName, thumb }) {
  await pool.query(
    `UPDATE users
        SET license_number = ?, license_file_name = ?, license_thumb = ?,
            license_status = 'pending', license_review_note = NULL
      WHERE id = ?`,
    [number || null, fileName || null, thumb || null, id]
  );
}

async function clearLicense(id) {
  await pool.query(
    `UPDATE users
        SET license_number = NULL, license_file_name = NULL, license_thumb = NULL,
            license_status = 'none', license_review_note = NULL
      WHERE id = ?`,
    [id]
  );
}

async function setLicenseStatus(id, status, note) {
  await pool.query(
    `UPDATE users SET license_status = ?, license_review_note = ? WHERE id = ?`,
    [status, note || null, id]
  );
}

async function recordConsent(id, type, version) {
  const column = type === 'terms' ? 'consent_terms' : 'consent_privacy';
  await pool.query(
    `UPDATE users SET ${column}_version = ?, ${column}_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [version, id]
  );
}

module.exports = {
  toApiUser,
  findByEmail,
  findById,
  createUser,
  updateSettings,
  setLicense,
  clearLicense,
  setLicenseStatus,
  recordConsent,
};
