'use strict';

const { pool } = require('../database/connection');
const { fetchPassageMeta } = require('./knowledge.repository');

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

class MySqlVectorStore {
  constructor() {
    this.model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  }

  async upsert(passageId, vector, model, dimensions) {
    await pool.query(
      `INSERT INTO kb_embeddings (passage_id, model, dimensions, vector)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         vector = VALUES(vector),
         dimensions = VALUES(dimensions),
         model = VALUES(model)`,
      [passageId, model || this.model, dimensions || vector.length, JSON.stringify(vector)]
    );
  }

  async upsertMany(vecRows) {
    for (const row of vecRows) {
      await this.upsert(row.passageId, row.vector, row.model, row.dimensions);
    }
  }

  async hasEmbeddings() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS n FROM kb_embeddings WHERE model = ?`,
      [this.model]
    );
    return rows[0] ? rows[0].n > 0 : false;
  }

  async search(queryVector, { topK = 5 } = {}) {
    const [rows] = await pool.query(
      `SELECT passage_id, vector FROM kb_embeddings WHERE model = ?`,
      [this.model]
    );

    const scored = rows
      .map((row) => {
        let vector;
        try {
          vector = typeof row.vector === 'string' ? JSON.parse(row.vector) : row.vector;
        } catch {
          vector = null;
        }
        if (!Array.isArray(vector) || vector.length === 0) return null;
        return { passageId: row.passage_id, score: cosine(queryVector, vector) };
      })
      .filter((item) => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (scored.length === 0) return [];

    const meta = await fetchPassageMeta(scored.map((r) => r.passageId));
    const metaById = new Map(meta.map((m) => [m.id, m]));

    return scored.map(({ passageId, score }) => ({
      ...(metaById.get(passageId) || {}),
      passageId,
      score: Number(score.toFixed(4)),
    }));
  }

  async clear() {
    await pool.query(`DELETE FROM kb_embeddings WHERE model = ?`, [this.model]);
  }
}

module.exports = { MySqlVectorStore, cosine };