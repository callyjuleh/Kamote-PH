'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { chunkText, estimateTokens } = require('../src/knowledge/chunker');
const { embed } = require('../src/knowledge/embedding.client');
const { MySqlVectorStore } = require('../src/knowledge/vector.store');
const {
  findDocumentByFilename,
  replacePassagesForPage,
  logIngest,
  getDocumentStats,
  setDocumentStatus,
} = require('../src/knowledge/knowledge.repository');
const { pool } = require('../src/database/connection');

function parseArgs(argv) {
  const args = { file: null, embed: true };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') args.file = argv[++i];
    else if (arg === '--no-embed') args.embed = false;
    else if (arg.startsWith('--file=')) args.file = arg.slice(7);
  }
  if (!args.file) {
    args.file = path.resolve(__dirname, '..', 'data', 'curated');
  }
  return args;
}

async function curateFile(filePath, runId, doEmbed) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const doc = await findDocumentByFilename(data.document);
  if (!doc) {
    throw new Error(`Document not found in kb_documents: ${data.document}`);
  }

  const saved = [];
  for (const pageEntry of data.pages || []) {
    const passages = chunkText(pageEntry.content, { size: 1100, overlap: 120 }).map(
      (chunk, i) => ({
        pageNumber: pageEntry.page,
        sectionRef: pageEntry.section_ref || null,
        chunkIndex: i,
        content: chunk,
        tokenCount: estimateTokens(chunk),
      })
    );
    const rows = await replacePassagesForPage(doc.id, pageEntry.page, passages);
    for (let i = 0; i < rows.length; i += 1) {
      saved.push({ id: rows[i].id, content: passages[i].content });
    }
    await logIngest(runId, doc.id, 'info', `Curated page ${pageEntry.page}: ${rows.length} passage(s)`, pageEntry.page);
  }

  let embeddings = 0;
  if (doEmbed && saved.length > 0) {
    const { embeddings: vectors, model, dimensions } = await embed(saved.map((s) => s.content));
    const store = new MySqlVectorStore();
    await store.upsertMany(
      saved.map((s, i) => ({
        passageId: s.id,
        vector: vectors[i],
        model,
        dimensions,
      }))
    );
    embeddings = saved.length;
  }

  if (data.source_note) {
    await logIngest(runId, doc.id, 'info', `Source note: ${data.source_note}`);
  }

  const stats = await getDocumentStats(doc.id);
  return { file: path.basename(filePath), pages: (data.pages || []).length, passages: saved.length, embeddings, tokens: stats.tokens };
}

async function main() {
  const args = parseArgs(process.argv);
  const runId = crypto.randomBytes(6).toString('hex');

  if (fs.statSync(args.file).isFile()) {
    const files = [args.file];
    const results = [];
    for (const f of files) results.push(await curateFile(f, runId, args.embed));
    for (const r of results) {
      console.log(`- ${r.file}: ${r.pages} page(s), ${r.passages} passage(s), ${r.embeddings} embedding(s), ${r.tokens} tokens`);
    }
  } else {
    const results = [];
    for (const f of fs.readdirSync(args.file).filter((x) => /\.json$/i.test(x)).sort()) {
      results.push(await curateFile(path.join(args.file, f), runId, args.embed));
    }
    if (results.length === 0) {
      console.error(`No curated JSON files found in ${args.file}`);
      process.exit(1);
    }
    for (const r of results) {
      console.log(`- ${r.file}: ${r.pages} page(s), ${r.passages} passage(s), ${r.embeddings} embedding(s), ${r.tokens} tokens`);
    }
  }

  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Curation failed:', err);
  await pool.end().catch(() => {});
  process.exit(1);
});