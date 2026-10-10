'use strict';

const { pool } = require('../database/connection');

async function findDocumentByHash(hash) {
  const [rows] = await pool.query(
    `SELECT id, filename, status, ocr_needed, page_count
       FROM kb_documents
      WHERE file_hash = ?`,
    [hash]
  );
  return rows[0] || null;
}

async function findDocumentByFilename(filename) {
  const [rows] = await pool.query(
    `SELECT id, filename, status, ocr_needed, page_count
       FROM kb_documents
      WHERE filename = ?`,
    [filename]
  );
  return rows[0] || null;
}

async function insertDocument({
  filename,
  title,
  sourcePath,
  fileHash,
  pageCount,
  hasTextLayer,
  ocrNeeded,
}) {
  const [result] = await pool.query(
    `INSERT INTO kb_documents
       (filename, title, source_path, file_hash, page_count, has_text_layer, ocr_needed, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`,
    [
      filename,
      title || null,
      sourcePath || null,
      fileHash,
      pageCount || 0,
      hasTextLayer ? 1 : 0,
      ocrNeeded ? 1 : 0,
    ]
  );
  return result.insertId;
}

async function setDocumentStatus(id, { status, error = null, pageCount, hasTextLayer, ocrNeeded }) {
  const sets = [];
  const params = [];
  if (status) {
    sets.push('status = ?');
    params.push(status);
  }
  if (typeof pageCount === 'number') {
    sets.push('page_count = ?');
    params.push(pageCount);
  }
  if (typeof hasTextLayer === 'boolean') {
    sets.push('has_text_layer = ?');
    params.push(hasTextLayer ? 1 : 0);
  }
  if (typeof ocrNeeded === 'boolean') {
    sets.push('ocr_needed = ?');
    params.push(ocrNeeded ? 1 : 0);
  }
  if (error !== undefined) {
    sets.push('error = ?');
    params.push(error);
  }
  if (sets.length === 0) return;
  params.push(id);
  await pool.query(`UPDATE kb_documents SET ${sets.join(', ')} WHERE id = ?`, params);
}

async function replacePassagesForDocument(documentId, passages) {
  await pool.query(`DELETE FROM kb_passages WHERE document_id = ?`, [documentId]);

  if (passages.length === 0) return [];

  await pool.query(
    `INSERT INTO kb_passages
       (document_id, page_number, section_ref, chunk_index, content, token_count)
     VALUES ?`,
    [
      passages.map((p) => [
        documentId,
        p.pageNumber,
        p.sectionRef || null,
        p.chunkIndex,
        p.content,
        p.tokenCount || 0,
      ]),
    ]
  );

  const [rows] = await pool.query(
    `SELECT id, chunk_index
       FROM kb_passages
      WHERE document_id = ?
      ORDER BY chunk_index ASC, id ASC`,
    [documentId]
  );
  return rows;
}

async function replacePassagesForPage(documentId, pageNumber, passages) {
  await pool.query(
    `DELETE FROM kb_passages WHERE document_id = ? AND page_number = ?`,
    [documentId, pageNumber]
  );

  if (passages.length === 0) return [];

  await pool.query(
    `INSERT INTO kb_passages
       (document_id, page_number, section_ref, chunk_index, content, token_count)
     VALUES ?`,
    [
      passages.map((p) => [
        documentId,
        p.pageNumber,
        p.sectionRef || null,
        p.chunkIndex,
        p.content,
        p.tokenCount || 0,
      ]),
    ]
  );

  const [rows] = await pool.query(
    `SELECT id, page_number, chunk_index
       FROM kb_passages
      WHERE document_id = ? AND page_number = ?
      ORDER BY chunk_index ASC, id ASC`,
    [documentId, pageNumber]
  );
  return rows;
}

async function fetchPassageMeta(passageIds) {
  if (!passageIds.length) return [];
  const [rows] = await pool.query(
    `SELECT p.id, p.document_id, p.page_number, p.section_ref, p.chunk_index, p.content,
            d.filename, d.title AS document_title
       FROM kb_passages p
       JOIN kb_documents d ON d.id = p.document_id
      WHERE p.id IN (?)
      ORDER BY p.document_id ASC, p.chunk_index ASC`,
    [passageIds]
  );
  return rows;
}

async function keywordSearch(query, { limit = 5 } = {}) {
  const terms = [...new Set(query.split(/\s+/).filter((t) => t.length >= 3))];
  if (terms.length === 0) return [];

  const placeholders = terms.map(() => 'p.content LIKE ?').join(' OR ');
  const matchScore = terms.map(() => '(p.content LIKE ?)').join(' + ');
  const params = terms.map((t) => `%${t}%`).concat(terms.map((t) => `%${t}%`));

  const [rows] = await pool.query(
    `SELECT p.id, p.document_id, p.page_number, p.section_ref, p.chunk_index, p.content,
            d.filename, d.title AS document_title, (${matchScore}) AS match_count
       FROM kb_passages p
       JOIN kb_documents d ON d.id = p.document_id
      WHERE ${placeholders}
      ORDER BY match_count DESC, p.id ASC
      LIMIT ?`,
    [...params, limit]
  );
  return rows;
}

async function logIngest(runId, documentId, level, message, pageNumber = null) {
  await pool.query(
    `INSERT INTO kb_ingest_log (ingest_run, document_id, level, page_number, message)
     VALUES (?, ?, ?, ?, ?)`,
    [runId || null, documentId || null, level, pageNumber, message]
  );
}

async function getDocumentStats(documentId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS passages, SUM(token_count) AS tokens
       FROM kb_passages
      WHERE document_id = ?`,
    [documentId]
  );
  return rows[0] || { passages: 0, tokens: 0 };
}

async function listDocuments() {
  const [rows] = await pool.query(
    `SELECT id, filename, page_count, has_text_layer, ocr_needed, status,
            (SELECT COUNT(*) FROM kb_passages p WHERE p.document_id = kb_documents.id) AS passage_count,
            error, updated_at
       FROM kb_documents
      ORDER BY id ASC`
  );
  return rows;
}

module.exports = {
  findDocumentByHash,
  findDocumentByFilename,
  insertDocument,
  setDocumentStatus,
  replacePassagesForDocument,
  replacePassagesForPage,
  fetchPassageMeta,
  keywordSearch,
  logIngest,
  getDocumentStats,
  listDocuments,
};