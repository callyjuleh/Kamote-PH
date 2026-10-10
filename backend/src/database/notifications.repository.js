'use strict';

const { pool } = require('./connection');

function toApiNotification(row) {
  return {
    id: String(row.id),
    kind: row.kind,
    title: row.title,
    body: row.body,
    target: row.target || undefined,
    time: new Date(row.created_at).getTime(),
    read: Boolean(row.is_read),
  };
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT id, kind, title, body, target, is_read, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(toApiNotification);
}

async function setRead(userId, id, read) {
  await pool.query(`UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?`, [
    read ? 1 : 0,
    id,
    userId,
  ]);
}

async function remove(userId, id) {
  await pool.query(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [id, userId]);
}

async function markAllRead(userId) {
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
}

async function create(userId, { kind, title, body, target }) {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, kind, title, body, target) VALUES (?, ?, ?, ?, ?)`,
    [userId, kind, title, body, target || null]
  );
  return result.insertId;
}

module.exports = { listByUser, setRead, remove, markAllRead, create };
