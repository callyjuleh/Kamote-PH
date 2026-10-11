'use strict';

const PERSONA = `You are Dai, a patient and clear Filipino driving instructor helping a learner prepare for the LTO road rules exam. Talk like a friendly mentor, not a judge.`;

const BEHAVIOR = `Rules:
- Answer directly in plain English, normally in no more than 2 short sentences. For a real-life driving scenario, use up to 4 brief sentences when needed to make supported actions clear and ordered.
- For a real-life driving scenario, identify the situation and the rule that applies, then give the safest action or next step in order when the references support it.
- Consider the details the learner gives, such as the traffic control, road type, vehicle, road condition, and other road users. Do not assume missing details or combine instructions for different situations.
- If an essential detail would change the correct action, ask one brief clarifying question. If the references do not cover the scenario, say what you cannot confirm rather than inventing emergency procedures.
- Treat the provided LTO reference passages as the only authority for specific road rules and laws. State only facts and instructions clearly supported by those passages.
- Apply a rule to the situation only when the reference and the learner's stated conditions support that application. Do not add guessed reasons, hazards, legal requirements, examples, or generic advice.
- Use the reference passages internally to ground factual answers. Do not include citations, document names, page numbers, or a source list in the answer.
- If the passages do not clearly answer the question, say that you cannot confirm it from the available reference material and direct the learner to official LTO materials. Do not fill gaps from memory.
- Never invent numbers, penalties, fines, or speeds.
- For fines or penalties quoted from an FDM volume, identify them as information from the 2021 edition and advise the learner to confirm current amounts with official LTO sources.
- If asked to practice, ask one short question and wait for the learner's answer.`;

function citationLabel(passage) {
  const filename = String(passage.filename || '');
  if (/^FDM[- ]Vol\.?[- ]1/i.test(filename)) return 'FDM Vol. 1';
  if (/^FDM[- ]Vol\.?[- ]2/i.test(filename)) return 'FDM Vol. 2';
  if (/^RO102[_-]/i.test(filename)) return 'RO102';
  if (/^Traffic[-_ ]Law/i.test(filename)) return 'Traffic Law';

  return String(passage.document_title || filename.replace(/\.pdf$/i, ''))
    .replace(/[_-]+/g, ' ')
    .trim() || 'LTO reference';
}

function sourceCitation(passage) {
  if (passage.page_number == null) return null;
  return `(${citationLabel(passage)} p.${passage.page_number})`;
}

function buildTutorSystemPrompt() {
  return `${PERSONA}\n\n${BEHAVIOR}`;
}

function buildContextSection(passages) {
  if (!Array.isArray(passages) || passages.length === 0) {
    return 'No retrieval context was available. Do not answer specific road-rule or legal questions from memory.';
  }

  const lines = passages.map((passage, i) => {
    const section = passage.section_ref ? ` (${passage.section_ref})` : '';
    const title = passage.document_title || passage.filename || 'LTO reference';
    const content = String(passage.content || '').replace(/\s+/g, ' ').trim();
    const snippet = content.slice(0, 900);
    return `[REFERENCE ${i + 1} — ${title}${section}]\n${snippet}`;
  });

  return `LTO reference material (use these passages as your source of truth):\n\n${lines.join('\n\n')}`;
}

function buildUserMessage({ query, history }) {
  const context = buildContextSection(history.contextPassages);

  const transcript = (history.messages || [])
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Learner' : 'Dai'}: ${m.content.trim().slice(0, 2000)}`)
    .join('\n');

  const parts = [context];
  if (transcript) {
    parts.push(`Recent conversation:\n${transcript}`);
  }
  parts.push(`Learner's latest question:\n${query.trim()}`);

  return parts.join('\n\n');
}

function simplifySources(passages) {
  const seen = new Set();
  const sources = [];
  for (const passage of passages || []) {
    const page = passage.page_number != null ? passage.page_number : null;
    if (page == null || seen.has(page)) continue;
    seen.add(page);
    sources.push({
      document: passage.filename || null,
      title: passage.document_title || null,
      page,
      section: passage.section_ref || null,
      score: passage.score != null ? passage.score : passage.match_count || 0,
    });
  }
  return sources.slice(0, 5);
}

module.exports = {
  buildTutorSystemPrompt,
  buildContextSection,
  buildUserMessage,
  simplifySources,
  citationLabel,
  sourceCitation,
};