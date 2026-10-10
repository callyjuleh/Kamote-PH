'use strict';

require('dotenv').config();

const { retrieve } = require('../src/knowledge/retrieval');
const { pool } = require('../src/database/connection');

function parseArgs(argv) {
  const args = { query: '', topK: 5, embedQuery: true };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--top') {
      args.topK = Number(argv[++i]);
    } else if (arg === '--no-embed') {
      args.embedQuery = false;
    } else {
      args.query = arg;
    }
  }
  return args;
}

function snippet(text, max = 300) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.query) {
    console.error('Usage: npm run kb:search -- "your question" [--top 5] [--no-embed]');
    process.exit(1);
  }

  console.log(`Query: ${args.query}`);
  const result = await retrieve({
    query: args.query,
    topK: args.topK,
    embedQuery: args.embedQuery,
  });

  console.log(`Mode: ${result.mode}${result.model ? ` (${result.model})` : ''}`);
  if (result.warning) console.log(`NOTE: ${result.warning}`);

  if (!result.results || result.results.length === 0) {
    console.log('No passages matched.');
    await pool.end();
    process.exit(0);
  }

  console.log('\n=== Top passages ===');
  result.results.forEach((r, i) => {
    const score = r.score !== undefined ? ` [score ${r.score}]` : '';
    console.log(`\n${i + 1}. ${r.filename || r.document_title || 'doc'} - page ${r.page_number}${r.section_ref ? ` (${r.section_ref})` : ''}${score}`);
    console.log(snippet(r.content));
  });

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Search failed:', err);
  process.exit(1);
});