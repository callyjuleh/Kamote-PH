'use strict';

const REFERENCE_RE =
  /\b(?:SECTION|SEC\.?|RULE|ARTICLE|ART\.?|CHAPTER|PART|REPUBLIC ACT|RA)\s*\.?\s*([0-9]+|[IVXLCDM]+)\b/gi;

function normalizeReference(raw) {
  return raw
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function extractSectionReferences(text) {
  const refs = [];
  const re = new RegExp(REFERENCE_RE.source, 'gi');
  let match;
  while ((match = re.exec(text)) !== null) {
    refs.push(normalizeReference(match[0]));
  }
  return refs;
}

function firstSectionReference(text) {
  const refs = extractSectionReferences(text);
  return refs.length > 0 ? refs[0] : null;
}

module.exports = { extractSectionReferences, firstSectionReference, normalizeReference };