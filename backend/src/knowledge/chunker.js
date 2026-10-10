'use strict';

const SENTENCE_ENDINGS = ['.', ':', ';', '\n'];

function chunkText(text, { size = 800, overlap = 150 } = {}) {
  const clean = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const baseEnd = Math.min(start + size, clean.length);
    const slice = clean.slice(start, baseEnd);

    let boundary = -1;
    for (const ending of SENTENCE_ENDINGS) {
      const idx = slice.lastIndexOf(ending);
      if (idx > size * 0.6) {
        boundary = idx + 1;
        break;
      }
    }

    const end = boundary > 0 ? start + boundary : baseEnd;
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

module.exports = { chunkText, estimateTokens };