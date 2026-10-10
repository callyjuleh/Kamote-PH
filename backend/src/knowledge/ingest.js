'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { extractPdf, MIN_TEXT_CHARS } = require('./pdf.loader');
const { chunkText, estimateTokens } = require('./chunker');
const { firstSectionReference } = require('./section.reference');
const { embed } = require('./embedding.client');
const { MySqlVectorStore } = require('./vector.store');
const {
  findDocumentByHash,
  insertDocument,
  setDocumentStatus,
  replacePassagesForDocument,
  logIngest,
  getDocumentStats,
} = require('./knowledge.repository');

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function titleFromFilename(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[_]+/g, ' ');
}

async function ingestFile({ filePath, runId, embed: doEmbed = true, force = false }) {
  const filename = path.basename(filePath);
  const hash = sha256(filePath);

  let doc = await findDocumentByHash(hash);
  if (doc && doc.status === 'ingested' && !force) {
    return { filename, skipped: true, reason: 'already ingested (use --force to re-ingest)' };
  }
  if (doc && doc.status === 'failed' && !force) {
    return { filename, skipped: true, reason: 'previous run failed; use --force to retry' };
  }

  const stats = { filename, skipped: false, pages: 0, passages: 0, embeddings: 0 };
  const docId = doc ? doc.id : await insertDocument({
    filename,
    title: titleFromFilename(filename),
    sourcePath: filePath,
    fileHash: hash,
  });

  try {
    const extracted = await extractPdf(filePath);
    const ocrNeeded = extracted.pagesNeedingOcr.length > 0;

    await setDocumentStatus(docId, {
      status: 'processing',
      pageCount: extracted.numPages,
      hasTextLayer: extracted.hasTextLayer,
      ocrNeeded,
    });

    stats.pages = extracted.numPages;
    for (const pageNumber of extracted.pagesNeedingOcr) {
      await logIngest(
        runId,
        docId,
        'warn',
        `Page ${pageNumber}: only ${extracted.pages.find((p) => p.number === pageNumber)?.charCount ?? 0} text chars - needs OCR`,
        pageNumber
      );
    }

    const passages = [];
    for (const page of extracted.pages) {
      const chunks = chunkText(page.text);
      chunks.forEach((chunk, chunkIndex) => {
        passages.push({
          pageNumber: page.number,
          sectionRef: firstSectionReference(chunk),
          chunkIndex: passages.length,
          content: chunk,
          tokenCount: estimateTokens(chunk),
        });
      });
    }

    const savedRows = await replacePassagesForDocument(docId, passages);
    stats.passages = savedRows.length;

    if (doEmbed && savedRows.length > 0) {
      await logIngest(runId, docId, 'info', `Embedding ${savedRows.length} passages...`);
      const { embeddings, model, dimensions } = await embed(passages.map((p) => p.content));
      const store = new MySqlVectorStore();
      await store.upsertMany(
        savedRows.map((row, i) => ({
          passageId: row.id,
          vector: embeddings[i],
          model: model || store.model,
          dimensions: dimensions,
        }))
      );
      stats.embeddings = savedRows.length;
    } else if (!doEmbed) {
      await logIngest(runId, docId, 'info', 'Skipped embedding (--no-embed).');
    }

    await setDocumentStatus(docId, {
      status: 'ingested',
      error: null,
      pageCount: extracted.numPages,
      hasTextLayer: extracted.hasTextLayer,
      ocrNeeded,
    });

    const docStats = await getDocumentStats(docId);
    await logIngest(
      runId,
      docId,
      'info',
      `Ingested ${filename}: ${extracted.numPages} pages, ${savedRows.length} passages, ${docStats.tokens} tokens${ocrNeeded ? `, OCR needed on pages: ${extracted.pagesNeedingOcr.join(', ')}` : ''}`
    );

    return { ...stats, documentId: docId, tokens: docStats.tokens, ocrPages: extracted.pagesNeedingOcr };
  } catch (err) {
    await setDocumentStatus(docId, { status: 'failed', error: err.message });
    await logIngest(runId, docId, 'error', `Failed: ${err.message}`);
    return { ...stats, failed: true, error: err.message };
  }
}

async function ingestDirectory({ dir, runId, embed: doEmbed = true, force = false }) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.pdf$/i.test(f))
    .sort()
    .map((f) => path.join(dir, f));

  if (files.length === 0) {
    await logIngest(runId, null, 'error', `No PDFs found in ${dir}`);
  }

  const results = [];
  for (const file of files) {
    const result = await ingestFile({ filePath: file, runId, embed: doEmbed, force });
    results.push(result);
  }
  return results;
}

module.exports = { ingestFile, ingestDirectory, sha256, MIN_TEXT_CHARS };