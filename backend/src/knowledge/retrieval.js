'use strict';

const { embed, EMBED_MODEL } = require('./embedding.client');
const { MySqlVectorStore } = require('./vector.store');
const { keywordSearch } = require('./knowledge.repository');

async function retrieve({ query, topK = 5, embedQuery = true }) {
  const store = new MySqlVectorStore();

  if (embedQuery) {
    try {
      const { embeddings } = await embed(query);
      const embedding = embeddings && embeddings[0];
      if (!embedding) {
        throw new Error('Embedding service returned an empty result.');
      }
      const results = await store.search(embedding, { topK });
      return { mode: 'vector', model: EMBED_MODEL, results };
    } catch (err) {
      const results = await keywordSearch(query, { limit: topK });
      return {
        mode: 'keyword-fallback',
        warning: `Embedding unavailable (${err.message}). Used keyword search instead.`,
        results,
      };
    }
  }

  const results = await keywordSearch(query, { limit: topK });
  return { mode: 'keyword', results };
}

module.exports = { retrieve };