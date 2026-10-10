'use strict';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

async function embed(texts, opts = {}) {
  const model = opts.model || EMBED_MODEL;
  const input = Array.isArray(texts) ? texts : [texts];
  const timeoutMs = opts.timeoutMs || 120000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model, input }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama embed HTTP ${res.status}: ${body}`);
    }

    const json = await res.json();
    const embeddings =
      Array.isArray(json.embeddings) && json.embeddings.length > 0
        ? json.embeddings
        : null;

    if (!embeddings) {
      throw new Error(
        `Ollama returned no embeddings. Pull the model first: ollama pull ${model}`
      );
    }

    return {
      model,
      dimensions: embeddings[0] ? embeddings[0].length : 0,
      embeddings,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function embedOne(text, opts = {}) {
  const result = await embed(text, opts);
  return {
    model: result.model,
    dimensions: result.dimensions,
    embedding: result.embeddings[0],
  };
}

module.exports = { embed, embedOne, OLLAMA_URL, EMBED_MODEL };