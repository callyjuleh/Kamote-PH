'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { ingestDirectory } = require('../src/knowledge/ingest');
const { listDocuments } = require('../src/knowledge/knowledge.repository');
const { pool } = require('../src/database/connection');

function parseArgs(argv) {
  const args = { dir: process.env.KB_PDF_DIR, embed: true, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir') {
      args.dir = argv[++i];
    } else if (arg === '--no-embed') {
      args.embed = false;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg.startsWith('--dir=')) {
      args.dir = arg.slice('--dir='.length);
    }
  }
  if (!args.dir) {
    args.dir = path.resolve(__dirname, '..', 'data', 'traffic_pdfs');
  }
  return args;
}

function printDocumentTable() {
  return listDocuments().then((docs) => {
    if (docs.length === 0) return;
    console.log('\n=== Knowledge base documents ===');
    for (const d of docs) {
      const flags = [d.ocr_needed ? 'OCR' : null, `${d.passage_count} passages`]
        .filter(Boolean)
        .join(', ');
      console.log(
        `- ${d.filename}  [${d.status}]  ${d.page_count} pages, ${flags}${d.error ? `, error: ${d.error}` : ''}`
      );
    }
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.dir)) {
    console.error(`Directory not found: ${args.dir}`);
    process.exit(1);
  }

  const runId = crypto.randomBytes(6).toString('hex');
  console.log(`Ingest run: ${runId}`);
  console.log(`Directory: ${args.dir}`);
  console.log(`Embeddings: ${args.embed ? 'yes' : 'NO (--no-embed)'}\n`);

  const results = await ingestDirectory({
    dir: args.dir,
    runId,
    embed: args.embed,
    force: args.force,
  });

  console.log('=== Per-file results ===');
  let failed = false;
  for (const r of results) {
    if (r.skipped) {
      console.log(`- ${r.filename}  skipped (${r.reason})`);
      continue;
    }
    if (r.failed) {
      failed = true;
      console.log(`- ${r.filename}  FAILED: ${r.error}`);
      continue;
    }
    const ocr = r.ocrPages && r.ocrPages.length ? `, NEEDS OCR pages: ${r.ocrPages.join(', ')}` : '';
    console.log(
      `- ${r.filename}  ${r.pages} pages, ${r.passages} passages, ${r.embeddings} embeddings, ${r.tokens} tokens${ocr}`
    );
  }

  await printDocumentTable();

  console.log('\nTest retrieval with: npm run kb:search -- "your question"');
  await pool.end();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Ingest failed:', err);
  process.exit(1);
});