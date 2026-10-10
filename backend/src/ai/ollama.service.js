'use strict';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const CHAT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';

async function chat({ model = CHAT_MODEL, messages, timeoutMs = 90000 } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('At least one chat message is required.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.1, top_p: 0.8 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama chat HTTP ${res.status}: ${body}`);
    }

    const json = await res.json();
    const content = json.message && json.message.content;

    if (!content || !content.trim()) {
      throw new Error('Ollama returned an empty reply.');
    }

    return { model: json.model || model, content: content.trim() };
  } finally {
    clearTimeout(timer);
  }
}

async function listModels() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, models: [] };
    const json = await res.json();
    const names = (json.models || []).map((m) => m.name).sort();
    return { ok: true, models: names };
  } catch (err) {
    return { ok: false, models: [], error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chat, listModels, OLLAMA_URL, CHAT_MODEL };