'use strict';

/* Seed the learning modules (lesson_sections) from the traffic-PDF knowledge base.
 *
 * For each published lesson we define a set of sections. Every section runs a
 * retrieval over kb_passages, picks the best matching passage (preferring the
 * expected source document), cleans the extracted text, and stores it in
 * lesson_sections together with the source document + page it came from.
 *
 * Idempotent: existing sections for the touched lessons are replaced each run.
 *
 * Usage:  npm run kb:lessons
 */

require('dotenv').config();

const { pool } = require('../src/database/connection');
const { retrieve } = require('../src/knowledge/retrieval');
const { citationLabel } = require('../src/ai/prompt.builder');

const LESSON_SECTIONS = [
  {
    lesson: 'Road Signs and Markings',
    docHint: /RO102/,
    sections: [
      { heading: 'Warning Signs', query: 'warning signs hazards curve intersection pedestrian crossing slow down' },
      { heading: 'Regulatory Signs', query: 'regulatory signs prohibition stop no entry speed limit must must not' },
      { heading: 'Informative Signs', query: 'informative signs guidance directions distance facilities routes' },
      { heading: 'Road Markings and Lines', query: 'road markings broken line solid line lane separation continuity line' },
    ],
  },
  {
    lesson: 'Traffic Rules and Regulations',
    docHint: /[Vv]ol\.?-?2|RO102/,
    sections: [
      { heading: 'Traffic Lights and Signals', query: 'traffic lights signals red yellow green flashing proceed caution' },
      { heading: 'Speed Limits and Safe Speed', query: 'maximum allowable speed city municipality open road limit' },
      { heading: 'Overtaking and Lane Discipline', query: 'overtaking overtake safe lane discipline lane change' },
      { heading: 'Parking and Stopping', query: 'parking no stopping zone stopping restrictions' },
    ],
  },
  {
    lesson: 'Right-of-Way',
    docHint: /[Vv]ol\.?-?1|RO102/,
    sections: [
      { heading: 'Intersections and Yield', query: 'intersection right of way yield vehicle arrived first uncontrolled' },
      { heading: 'Pedestrian Crossings', query: 'pedestrian crossing yield pedestrians marked crossing slow down stop' },
      { heading: 'Rotundas and Rotaries', query: 'rotunda rotary roundabout traffic circle right of way' },
      { heading: 'Emergency Vehicles', query: 'emergency vehicle ambulance fire truck police right of way yield' },
    ],
  },
  {
    lesson: 'Defensive Driving',
    docHint: /[Vv]ol\.?-?1/,
    sections: [
      { heading: 'Scanning and the SIPDE Process', query: 'SIPDE scanning process awareness leaving yourself an out' },
      { heading: 'Following Distance', query: 'following distance safe gap three second rule braking distance' },
      { heading: 'Hazard Perception', query: 'hazard perception anticipate other road users blind spot mirrors' },
      { heading: 'Fatigue, Drugs, and Alcohol', query: 'fatigue drugs alcohol concentration driving skills physiological factors' },
    ],
  },
  {
    lesson: 'Vehicle Safety and Maintenance',
    docHint: /[Vv]ol\.?-?1|Vehicle_Safety|Vehicle Safety/,
    sections: [
      { heading: 'Pre-Trip Checks', query: 'pre-trip inspection before starting driving essential checks' },
      { heading: 'Dashboard Warning Lights', query: 'dashboard warning lights indicators engine brake check' },
      { heading: 'Brakes, Tires, and Steering', query: 'brakes tires steering condition tread pressure check' },
      { heading: 'Engine, Coolant, and Radiator Safety', query: 'radiator coolant cap engine cool never open hot' },
      { heading: 'Roadside Emergencies and Floodwater', query: 'floodwater breakdown emergency stopping safe place hazard' },
    ],
  },
  {
    lesson: 'Philippine Traffic Laws (RA 4136)',
    docHint: /Traffic-Law|[Vv]ol\.?-?2/,
    sections: [
      { heading: 'Republic Acts on Road Safety', query: 'Republic Act traffic violations penalties motorcycle helmet speed limiter' },
      { heading: 'Driving Licenses and Renewal', query: 'driver license validity renewal five years ten years CDE' },
      { heading: 'Vehicle Registration and Importation', query: 'vehicle registration importation MAIRDOE dealer LTO' },
      { heading: 'Penalties, Fines, and Impounding', query: 'penalties fines impounding suspension schedule violations driving without license' },
    ],
  },
];

const MAX_BODY_CHARS = 1500;
const MIN_PASSAGE_CHARS = 80;

const RUNNING_HEADERS = [
  /\bROAD AND TRAFFIC RULES\b/gi,
  /\bBEFORE STARTING AND DRIVING ON THE ROAD\b/gi,
  /\bREFERENCE MANUAL ON ROAD SAFETY AND TRAFFIC RULES\b/gi,
  /\bROAD TRAFFIC SIGNS\b/gi,
  /\bPROACTIVE VEHICLE MAINTENANCE\b/gi,
  /\bDEALING WITH EMERGENCY SITUATIONS\b/gi,
  /Go to Main Slide/gi,
];

const SAFE_HYPHENS = [
  [/right\s*-\s*of\s*-\s*way/gi, 'right-of-way'],
  [/pre\s*-\s*trip/gi, 'pre-trip'],
  [/owner\s*-\s*s\s*manual/gi, "owner's manual"],
  [/brake\s*-\s*fluid/gi, 'brake fluid'],
  [/one\s*-\s*way/gi, 'one-way'],
  [/two\s*-\s*or\s*-\s*three/gi, 'two- or three-'],
  [/tow\s*-\s*away/gi, 'tow-away'],
];

function cleanPassage(text) {
  let t = String(text || '');
  for (const header of RUNNING_HEADERS) t = t.replace(header, ' ');

  t = t
    .replace(/\bPage\s*\d+\b.*$/i, '')
    .replace(/^\s*\d{1,3}\s*[.\-]?\s+/, '')
    .replace(/^\s*\d{1,3}\s*[.\-]\s*(?=[A-Z])/, '')
    .replace(/([•▪*])\s*/g, ' - ')
    .replace(/([a-z0-9])\s*\n\s*([a-z])/g, '$1 $2')
    .replace(/([.!?])\s*\n\s*([A-Z0-9])/g, '$1 $2')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/(^|\s)l\s(?=[A-Z])/g, '$1- ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s([.,;:])/g, '$1')
    .replace(/\.{4,}/g, '...')
    .trim();

  for (const [pattern, replacement] of SAFE_HYPHENS) t = t.replace(pattern, replacement);

  // Drop a leading mid-word fragment left by chunk overlap when the text opens lowercase.
  if (/^[a-z]/.test(t)) {
    const boundary = t.match(/^.{0,90}?[.:;]\s+(?=[A-Z0-9-])/);
    if (boundary) t = t.slice(boundary[0].length).trim();
  }

  return t;
}

function fitBudget(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(': '));
  const end = lastSentence > max * 0.6 ? lastSentence + 1 : max;
  return `${text.slice(0, end).trim()}...`;
}

async function pickPassage({ query, docHint }) {
  const { results = [] } = await retrieve({ query, topK: 8, embedQuery: true });
  if (!results.length) return null;

  const scored = results
    .map((passage) => ({
      ...passage,
      score: Number(passage.score) || 0,
      clean: cleanPassage(passage.content),
    }))
    .filter((passage) => passage.clean.length >= MIN_PASSAGE_CHARS)
    .sort((a, b) => b.score - a.score);

  const preferred = scored.find((passage) => docHint && docHint.test(String(passage.filename || '')));
  return preferred || scored[0] || null;
}

async function findLessonId(title) {
  const [rows] = await pool.query(
    `SELECT id FROM lessons WHERE title = ? ORDER BY id LIMIT 1`,
    [title]
  );
  return rows[0] ? rows[0].id : null;
}

async function replaceSections(lessonId, sections) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM lesson_sections WHERE lesson_id = ?`, [lessonId]);
    if (sections.length) {
      await conn.query(
        `INSERT INTO lesson_sections (lesson_id, heading, body, source_document, source_page, source_ref, order_index)
         VALUES ?`,
        [
          sections.map((section, index) => [
            lessonId,
            section.heading,
            section.body,
            section.source_document || null,
            section.source_page != null ? String(section.source_page) : null,
            section.source_ref || null,
            index,
          ]),
        ]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function main() {
  const report = [];

  for (const mod of LESSON_SECTIONS) {
    const lessonId = await findLessonId(mod.lesson);
    if (!lessonId) {
      console.error(`- Lesson not found: ${mod.lesson}`);
      continue;
    }

    const sections = [];
    for (const spec of mod.sections) {
      const passage = await pickPassage({ query: spec.query, docHint: mod.docHint });
      if (!passage) {
        report.push({ lesson: mod.lesson, section: spec.heading, status: 'no-source', doc: null, page: null });
        continue;
      }
      const body = fitBudget(passage.clean, MAX_BODY_CHARS);
      sections.push({
        heading: spec.heading,
        body,
        source_document: passage.filename || null,
        source_page: passage.page_number != null ? passage.page_number : null,
        source_ref: passage.section_ref || null,
      });
      report.push({
        lesson: mod.lesson,
        section: spec.heading,
        status: 'ok',
        doc: passage.filename,
        page: passage.page_number,
        score: passage.score,
      });
    }

    await replaceSections(lessonId, sections);
    console.log(`- ${mod.lesson}: ${sections.length} section(s) written`);
  }

  console.log('\n=== Section source report ===');
  for (const row of report) {
    if (row.status === 'ok') {
      const ref = row.page != null ? `p.${row.page}` : 'n/a';
      console.log(`  [ok]  ${row.lesson} / ${row.section}  ->  ${citationLabel({ filename: row.doc })} ${ref} (score ${row.score})`);
    } else {
      console.log(`  [none] ${row.lesson} / ${row.section}  ->  no usable passage found`);
    }
  }

  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Seeding failed:', err);
  await pool.end().catch(() => {});
  process.exit(1);
});