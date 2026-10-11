'use strict';

const { embed, EMBED_MODEL } = require('./embedding.client');
const { MySqlVectorStore } = require('./vector.store');
const { keywordSearch } = require('./knowledge.repository');

const RRF_K = 10;
const KEYWORD_RANK_WEIGHT = 1.5;

function mergeResults(vectorResults, keywordResults, topK) {
  const merged = new Map();

  vectorResults.forEach((result, index) => {
    const id = result.passageId ?? result.id;
    if (id == null) return;
    merged.set(id, {
      ...result,
      score: Number(result.score) || 0,
      rankScore: 1 / (RRF_K + index + 1),
    });
  });

  keywordResults.forEach((result, index) => {
    const id = result.passageId ?? result.id;
    if (id == null) return;
    const existing = merged.get(id);
    const keywordScore = 1.5 / (RRF_K + index + 1);
    merged.set(id, {
      ...existing,
      ...result,
      passageId: id,
      score: existing ? existing.score : 0,
      keywordScore: Number(result.match_count) || 0,
      rankScore: (existing ? existing.rankScore : 0) + keywordScore,
    });
  });

  return [...merged.values()]
    .sort((a, b) =>
      b.rankScore - a.rankScore ||
      b.score - a.score ||
      b.keywordScore - a.keywordScore
    )
    .slice(0, topK)
    .map(({ rankScore, ...result }) => result);
}

async function retrieve({ query, topK = 5, embedQuery = true }) {
  const store = new MySqlVectorStore();

  if (embedQuery) {
    let embedding;
    try {
      const { embeddings } = await embed(query);
      embedding = embeddings && embeddings[0];
      if (!embedding) {
        throw new Error('Embedding service returned an empty result.');
      }
    } catch (err) {
      const results = await keywordSearch(query, { limit: topK });
      return {
        mode: 'keyword-fallback',
        warning: `Embedding unavailable (${err.message}). Used keyword search instead.`,
        results,
      };
    }

    const [vectorResults, keywordResults] = await Promise.all([
      store.search(embedding, { topK }),
      keywordSearch(query, { limit: Math.max(topK * 2, 10) }),
    ]);
    if (keywordResults.length === 0) {
      return { mode: 'vector', model: EMBED_MODEL, results: vectorResults };
    }

    return {
      mode: 'hybrid',
      model: EMBED_MODEL,
      results: mergeResults(vectorResults, keywordResults, topK),
    };
  }

  const results = await keywordSearch(query, { limit: topK });
  return { mode: 'keyword', results };
}

module.exports = { retrieve, mergeResults };