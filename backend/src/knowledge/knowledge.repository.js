'use strict';

const { pool } = require('../database/connection');

const KEYWORD_STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'between', 'but', 'by', 'can',
  'beside', 'compare', 'could', 'describe', 'define', 'difference', 'did', 'do', 'does',
  'explain', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'in', 'is',
  'it', 'me', 'my', 'of', 'on', 'or', 'our', 'should', 'that', 'the', 'their', 'them',
  'there', 'these', 'they', 'this', 'to', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'who', 'why', 'with', 'would', 'you', 'your', 'mean',
  'see', 'wear', 'need', 'happen', 'tell', 'get', 'make', 'take', 'look',
  'ano', 'ang', 'ba', 'bakit', 'dapat', 'ibig', 'kailan', 'mo', 'paano', 'po',
  'saan', 'sabihin', 'may', 'the', 'mga', 'kapag', 'kung', 'nang', 'iyan', 'iyon',
]);

const KEYWORD_SYNONYM_GROUPS = [
  ['accident', 'aksidente', 'banggaan', 'collision', 'crash'],
  ['ambulance', 'ambulansya', 'emergency', 'firetruck'],
  ['approach', 'approaching', 'comes toward', 'coming up to', 'encounter'],
  ['automobile', 'auto', 'car', 'kotse', 'sasakyan', 'vehicle'],
  ['bicycle', 'bike', 'bisikleta', 'cycle'],
  ['blowout', 'puncture', 'punctured', 'flat tire', 'flat tyre', 'burst tire', 'burst tyre'],
  ['blindspot', 'blindspots'],
  ['brake', 'brakes', 'braking', 'brake failure', 'brake fails', 'preno'],
  ['broken', 'dash', 'dashed', 'dotted', 'putol'],
  ['breakdown', 'break down', 'broken down', 'vehicle breakdown', 'stall', 'stalled', 'stranded'],
  ['center', 'centre', 'middle'],
  ['child', 'minor', 'bata'],
  ['continuous', 'solid', 'unbroken', 'uninterrupted'],
  ['cross', 'crossing', 'straddle'],
  ['crossroad', 'crossroads', 'intersection', 'junction'],
  ['crosswalk', 'tawiran', 'zebra'],
  ['danger', 'hazard', 'panganib', 'risk'],
  ['double', 'paired', 'twin'],
  ['driver', 'drayber', 'motorist', 'tsuper'],
  ['drive', 'driving', 'operate', 'operating'],
  ['drunk', 'impaired', 'intoxicated'],
  ['drowsy', 'fatigued', 'sleepy', 'tired'],
  ['fail', 'failure', 'fails'],
  ['flood', 'flooded', 'flooding'],
  ['fine', 'multa', 'penalty', 'sanction'],
  ['fog', 'foggy'],
  ['head-on collision', 'head-on crash', 'frontal collision'],
  ['headlight', 'headlights', 'oncoming headlights'],
  ['heavy rain', 'heavy rains', 'downpour'],
  ['headlamp', 'headlight', 'lamp'],
  ['helmet', 'helmeto', 'headgear'],
  ['hydroplane', 'hydroplaning', 'aquaplane', 'aquaplaning'],
  ['jeepney', 'puj'],
  ['law', 'legislation', 'regulation', 'rule'],
  ['lane', 'traffic lane'],
  ['license', 'licence', 'lisensya', 'permit'],
  ['maximum', 'limit', 'max', 'speedlimit'],
  ['merge', 'merging'],
  ['motorbike', 'motorcycle', 'motorsiklo'],
  ['night', 'nighttime', 'at night'],
  ['overtake', 'overtaking', 'pass', 'passing'],
  ['overheat', 'overheating', 'overheated'],
  ['park', 'parking', 'paradahan'],
  ['pedestrian', 'walker'],
  ['priority', 'precedence'],
  ['rearview', 'rear-view'],
  ['back', 'reverse', 'reversing'],
  ['roundabout', 'rotunda'],
  ['railroad crossing', 'railway crossing', 'train crossing'],
  ['bus', 'coach'],
  ['truck', 'lorry'],
  ['seatbelt', 'seat-belt', 'seat belt', 'safety belt', 'sinturon'],
  ['footpath', 'sidewalk', 'walkway'],
  ['speed', 'velocity', 'bilis'],
  ['steady', 'constant'],
  ['stop', 'halt', 'hinto', 'huminto', 'stopping'],
  ['skid', 'skidding', 'slide', 'sliding', 'swerve'],
  ['school zone', 'school crossing', 'children crossing'],
  ['signal failure', 'traffic signal failure', 'traffic light failure', 'signal not working'],
  ['rain', 'rainy', 'ulan', 'wet'],
  ['no', 'not', 'never', 'hindi', 'wala'],
  ['signal', 'light'],
  ['speed limit', 'maximum speed', 'speed restriction', 'speed cap'],
  ['stop sign', 'halt sign', 'stop signage'],
  ['traffic light', 'traffic signal', 'signal light', 'stoplight'],
  ['turn', 'turning', 'liko'],
  ['warning light', 'hazard light', 'early warning device'],
  ['wiper', 'windshield wiper', 'windscreen wiper'],
  ['tyre', 'tire'],
  ['warning', 'caution'],
  ['yield', 'yielding', 'give way', 'give-way', 'magbigay-daan'],
  ['priority', 'precedence', 'right of way', 'right-of-way'],
  ['barrier', 'divider', 'guhit', 'line', 'marking', 'paint', 'separator', 'stripe'],
  ['highway', 'kalsada', 'road', 'roadway', 'street'],
  ['sign', 'karatula'],
];
const KEYWORD_SYNONYM_LOOKUP = new Map(
  KEYWORD_SYNONYM_GROUPS.flatMap((group) => group.map((term) => [term, group]))
);
const KEYWORD_IRREGULAR_FORMS = new Map([
  ['buses', 'bus'],
  ['children', 'child'],
  ['kids', 'child'],
]);

function normalizeKeywordWord(word) {
  if (KEYWORD_IRREGULAR_FORMS.has(word)) return KEYWORD_IRREGULAR_FORMS.get(word);
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(?:ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function keywordTerms(query) {
  return [...new Set(keywordTermGroups(query).flatMap(({ terms }) => terms))];
}

function keywordTermGroups(query) {
  let normalizedQuery = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const groupTerms = new Map();
  const preferredTerms = new Map();
  const addGroup = (group, preferred = []) => {
    const searchTerms = [...new Set(group)].sort();
    const groupKey = [...new Set(group.map((term) => term.replace(/-/g, ' ')))].sort().join('|');
    groupTerms.set(groupKey, [...new Set([...(groupTerms.get(groupKey) || []), ...searchTerms])]);
    preferredTerms.set(
      groupKey,
      [...new Set([...(preferredTerms.get(groupKey) || []), ...preferred])]
    );
  };

  for (const group of KEYWORD_SYNONYM_GROUPS) {
    const phrases = group.filter((term) => term.includes(' ') || term.includes('-'));
    const matchedPhrases = phrases.filter((phrase) => {
      const normalizedPhrase = phrase.replace(/-/g, ' ');
      return new RegExp(`(?:^|\\s)${normalizedPhrase.replace(/\s+/g, '\\s+')}(?:\\s|$)`).test(normalizedQuery);
    });
    if (matchedPhrases.length) {
      const preferred = matchedPhrases.flatMap((phrase) =>
        group.filter((term) => term.replace(/-/g, ' ') === phrase.replace(/-/g, ' '))
      );
      addGroup(group, preferred);
      for (const phrase of matchedPhrases) {
        const normalizedPhrase = phrase.replace(/-/g, ' ').replace(/\s+/g, '\\s+');
        normalizedQuery = normalizedQuery.replace(
          new RegExp(`(?:^|\\s)${normalizedPhrase}(?=\\s|$)`, 'g'),
          ' '
        );
      }
    }
  }

  const words = normalizedQuery.match(/[a-z0-9]+/g) || [];
  const meaningfulWords = words
    .filter((word) => !KEYWORD_STOP_WORDS.has(word))
    .map(normalizeKeywordWord)
    .filter((word) => word.length >= 3 && !KEYWORD_STOP_WORDS.has(word));

  meaningfulWords.forEach((word) => {
    const synonymGroup = KEYWORD_SYNONYM_LOOKUP.get(word);
    addGroup(synonymGroup || [word], [word]);
  });

  return [...groupTerms].map(([key, terms]) => ({
    terms,
    preferred: preferredTerms.get(key).filter((term) => terms.includes(term)),
  }));
}

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
  const termGroups = keywordTermGroups(query);
  if (termGroups.length === 0) return [];

  const groupCondition = (terms) => `(${terms.map(() => 'p.content LIKE ?').join(' OR ')})`;
  const matchScore = termGroups
    .map(({ terms, preferred }) => {
      const alternateTerms = terms.filter((term) => !preferred.includes(term));
      const exactScore = preferred.length ? 2 : 1;
      const fallbackScore = alternateTerms.length ? ` WHEN ${groupCondition(alternateTerms)} THEN 1` : '';
      return `CASE WHEN ${groupCondition(preferred.length ? preferred : terms)} THEN ${exactScore}${fallbackScore} ELSE 0 END`;
    })
    .join(' + ');
  const placeholders = termGroups.map(({ terms }) => groupCondition(terms)).join(' OR ');
  const scoreParams = termGroups.flatMap(({ terms, preferred }) => {
    const alternates = terms.filter((term) => !preferred.includes(term));
    return [
      ...(preferred.length ? preferred : terms),
      ...(preferred.length ? alternates : []),
    ].map((term) => `%${term}%`);
  });
  const filterParams = termGroups.flatMap(({ terms }) => terms.map((term) => `%${term}%`));

  const [rows] = await pool.query(
    `SELECT p.id, p.document_id, p.page_number, p.section_ref, p.chunk_index, p.content,
            d.filename, d.title AS document_title, (${matchScore}) AS match_count
       FROM kb_passages p
       JOIN kb_documents d ON d.id = p.document_id
      WHERE ${placeholders}
      ORDER BY match_count DESC,
               (p.content LIKE '%allowed%' OR p.content LIKE '%prohibited%'
                OR p.content LIKE '%overtaking%' OR p.content LIKE '%crossing%'
                OR p.content LIKE '%must%' OR p.content LIKE '%shall%'
                OR p.content LIKE '%required%' OR p.content LIKE '%means%'
                OR p.content LIKE '%indicates%' OR p.content LIKE '%right of way%'
                OR p.content LIKE '%right-of-way%') DESC,
               p.id ASC
      LIMIT ?`,
    [...scoreParams, ...filterParams, limit]
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
  keywordTerms,
  keywordTermGroups,
  keywordSearch,
  logIngest,
  getDocumentStats,
  listDocuments,
};