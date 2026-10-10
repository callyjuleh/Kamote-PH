'use strict';

require('dotenv').config();

const crypto = require('crypto');
const { pool } = require('../src/database/connection');

const DEMO = {
  name: 'Juan Dela Cruz',
  email: 'demo@kamote.ph',
  password: 'kamote123',
  track: 'new',
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

async function addColumn(table, column, definition) {
  if (await columnExists(table, column)) return;
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  console.log(`  + ${table}.${column}`);
}

async function main() {
  console.log('Adding user profile columns...');
  await addColumn('users', 'track', "track ENUM('new','licensed') NOT NULL DEFAULT 'new'");
  await addColumn('users', 'daily_goal', 'daily_goal INT NOT NULL DEFAULT 10');
  await addColumn('users', 'notifications_on', 'notifications_on TINYINT(1) NOT NULL DEFAULT 1');
  await addColumn('users', 'reminder_time', "reminder_time VARCHAR(5) NOT NULL DEFAULT '19:00'");
  await addColumn('users', 'sounds', 'sounds TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('users', 'license_number', 'license_number VARCHAR(32) NULL');
  await addColumn('users', 'license_file_name', 'license_file_name VARCHAR(255) NULL');
  await addColumn('users', 'license_thumb', 'license_thumb MEDIUMTEXT NULL');

  console.log('Creating tables...');
  await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    kind       ENUM('streak','reminder','lesson','quiz','tip','system') NOT NULL DEFAULT 'system',
    title      VARCHAR(180)    NOT NULL,
    body       TEXT            NOT NULL,
    target     VARCHAR(40)     NULL,
    is_read    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notifications_user (user_id, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS study_progress (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    study_set       VARCHAR(180)    NOT NULL,
    cards_completed INT             NOT NULL DEFAULT 0,
    cards_total     INT             NOT NULL DEFAULT 0,
    accuracy        INT             NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_study_user_set (user_id, study_set),
    CONSTRAINT fk_study_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    score      INT             NOT NULL DEFAULT 0,
    total      INT             NOT NULL DEFAULT 0,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_quiz_attempts_user (user_id, created_at),
    CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  console.log('Seeding demo user...');
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [DEMO.email]);
  let userId;
  if (existing.length) {
    userId = existing[0].id;
    await pool.query(
      'UPDATE users SET full_name = ?, password_hash = ?, track = ?, daily_goal = 10, notifications_on = 1 WHERE id = ?',
      [DEMO.name, hashPassword(DEMO.password), DEMO.track, userId]
    );
    console.log(`  updated demo user #${userId}`);
  } else {
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, track) VALUES (?, ?, ?, ?)',
      [DEMO.name, DEMO.email, hashPassword(DEMO.password), DEMO.track]
    );
    userId = result.insertId;
    console.log(`  created demo user #${userId}`);
  }

  const [notifCount] = await pool.query('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?', [userId]);
  if (notifCount[0].n === 0) {
    const now = Date.now();
    await pool.query(
      `INSERT INTO notifications (user_id, kind, title, body, target, is_read, created_at) VALUES ?`,
      [[
        [userId, 'streak', '6-day streak! Keep it going', 'Study one more card today to reach 7 days in a row.', 'flashcards', 0, new Date(now - 12 * 60000)],
        [userId, 'tip', 'Flashing red means stop', "Treat a flashing red light like a stop sign: stop fully, then go when it's clear.", 'ai', 0, new Date(now - 2 * 3600000)],
        [userId, 'lesson', 'New: Refresher for Licensed Drivers', '36 cards on rules and signs worth reviewing since you got your license.', 'library', 0, new Date(now - 5 * 3600000)],
        [userId, 'reminder', "Time for today's review", "You're 2 cards away from your daily goal.", 'set', 1, new Date(now - 27 * 3600000)],
      ]]
    );
    console.log('  seeded 4 notifications');
  }

  console.log('\n========================================');
  console.log('  DEMO LOGIN CREDENTIALS');
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log('========================================\n');

  await pool.end();
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
