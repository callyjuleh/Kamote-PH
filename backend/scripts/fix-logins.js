'use strict';

require('dotenv').config();

const { hashPassword } = require('../src/auth/password');
const { pool } = require('../src/database/connection');

const FIXED_PASSWORD = process.env.DEFAULT_PASSWORD || 'kamote123';

async function main() {
  const [rows] = await pool.query('SELECT id, email, full_name FROM users ORDER BY id');
  if (!rows.length) {
    console.log('No users found in the database.');
    await pool.end();
    return;
  }

  console.log(`Resetting ${rows.length} account(s) to password '${FIXED_PASSWORD}'...`);
  for (const row of rows) {
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(FIXED_PASSWORD), row.id]);
  }

  console.log('\nAll passwords reset. Login with any of these accounts:');
  for (const row of rows) {
    console.log(`  ${row.email}   / ${FIXED_PASSWORD}`);
  }
  console.log('\nSaved responses are kept per account and are not affected.');

  await pool.end();
}

main().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});