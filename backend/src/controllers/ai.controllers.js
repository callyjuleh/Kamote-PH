'use strict';

const { retrieve } = require('../knowledge/retrieval');
const { keywordTerms } = require('../knowledge/knowledge.repository');
const ollama = require('../ai/ollama.service');
const {
  buildTutorSystemPrompt,
  buildUserMessage,
  citationLabel,
  sourceCitation,
} = require('../ai/prompt.builder');

const MAX_QUERY_LENGTH = 1000;
const TOP_K = 8;
const MIN_VECTOR_RELEVANCE = 0.58;
const UNVERIFIED_ANSWER = "I don't have enough reliable information to answer that.";
const GENERAL_CHAT_PROMPT = `You are Dai, a friendly local assistant. Answer simple everyday questions directly and briefly using your general knowledge. Do not include citations or source names. If a question needs live or current information, say you cannot check it right now. Do not guess about Philippine traffic laws or driving rules; those must be answered from the provided study references.`;
const ROAD_RULE_QUERY = /\b(?:traffic|trapiko|road|kalsada|driv\w*|drayber|tsuper|vehicle|sasakyan|kotse|car|bus|truck|motorcycle|motorsiklo|motorbike|motorist|license|licence|lisensya|permit|jeepney|puj|highway|lane|overtak\w*|pass(?:ing)?|intersection|crossroad|pedestrian|walk(?:er|way)?|tawiran|zebra|sign|karatula|signal|light|speed|bilis|maximum|limit|fine|multa|penalt\w*|sanction|right[- ]of[- ]way|priority|line|guhit|marking|solid|broken|putol|dash(?:ed)?|dotted|continuous|unbroken|uninterrupted|divider|stripe|crosswalk|pavement|park(?:ing)?|paradahan|helmet|helmeto|headgear|seat[- ]?belt|belt|sinturon|brak(?:e|ing)|preno|accident|aksidente|banggaan|collision|crash|yield|hinto|halt|roundabout|rotunda|tire|tyre|emergency|ambulance|ambulansya|blind ?spot)\b/i;
const ROAD_RULE_SEARCH_TERMS = new Set([
  'accident', 'ambulance', 'bicycle', 'blindspot', 'brake', 'bus', 'car', 'collision',
  'blowout', 'breakdown', 'crosswalk', 'driver', 'drowsy', 'emergency', 'fail', 'failure',
  'fatigued', 'fine', 'flood', 'fog', 'glare', 'helmet', 'hydroplane', 'intersection', 'jeepney', 'lane', 'law',
  'license', 'line', 'multa', 'motorcycle', 'overtake', 'park', 'pedestrian', 'penalty',
  'permit', 'preno', 'puncture', 'railroad', 'rain', 'roundabout', 'road', 'rule', 'school',
  'seat belt', 'seatbelt', 'signal', 'skid', 'sleepy', 'stalled', 'tired', 'tire',
  'speed', 'stop', 'traffic', 'truck', 'vehicle', 'yield', 'aksidente', 'ambulansya',
  'banggaan', 'bilis', 'drayber', 'guhit', 'helmeto', 'hinto', 'karatula', 'kalsada',
  'kotse', 'lisensya', 'motorsiklo', 'paradahan', 'panganib', 'putol', 'sasakyan',
  'tawiran', 'trapiko', 'tsuper', 'ulan', 'yielding',
]);
const NON_FACT_TERMS = new Set([
  'a', 'about', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'being',
  'by', 'can', 'could', 'did', 'do', 'does', 'each', 'fdm', 'for', 'from', 'had',
  'has', 'have', 'he', 'her', 'here', 'how', 'i', 'in', 'into', 'is', 'it', 'its',
  'may', 'me', 'my', 'must', 'no', 'not', 'of', 'on', 'or', 'our', 'out', 'over',
  'p', 'part', 'per', 'please', 'should', 'so', 'than', 'that', 'the', 'their', 'them',
  'then', 'there', 'these', 'they', 'this', 'those', 'to', 'under', 'up', 'us',
  'vol', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'law',
  'will', 'with', 'would', 'you', 'your',
]);

function factTerms(text) {
  const words = String(text).toLowerCase().match(/[a-z]+|\d[\d,]*(?:\.\d+)?/g) || [];
  return new Set(
    words
      .map((word) => (/^\d/.test(word) ? String(Number(word.replace(/,/g, ''))) : word))
      .map((word) => word.endsWith('s') && word.length > 4 ? word.slice(0, -1) : word)
      .filter((word) => !NON_FACT_TERMS.has(word) && (word.length > 2 || /^\d+$/.test(word)))
  );
}

function answerFromRoadSignalMaterial(message, passages) {
  const query = message.toLowerCase();
  const rules = [
    {
      matches: /\bflashing\s+(?:yellow|amber)\s+(?:signal|light)\b/,
      source: /flashing yellow signal\b[^•\n]*?proceed with caution/i,
      answer: "The RO102 material says a flashing yellow signal advises you to proceed with caution.",
    },
    {
      matches: /\bflashing\s+red\s+(?:signal|light)\b/,
      source: /flashing red signal\b[^•\n]*?proceed only when it is safe/i,
      answer: "A flashing red signal means stop and proceed only when it is safe.",
    },
    {
      matches: /\b(?:steady\s+)?red\s+(?:signal|light)\b/,
      source: /red signal means you must bring your vehicle to a stop at a clearly marked line/i,
      answer: "A red signal means stop at a clearly marked line.",
    },
    {
      matches: /\b(?:steady\s+)?(?:yellow|amber)\s+(?:signal|light)\b/,
      source: /yellow signal indicates that the red signal is about to appear/i,
      answer: "A yellow signal indicates that the red signal is about to appear.",
    },
    {
      matches: /\bgreen\s+(?:signal|light)\b/,
      source: /green signal means you proceed, provided you yield to pedestrians and traffic lawfully using the intersection/i,
      answer: "A green signal means you may proceed, while yielding to pedestrians and traffic lawfully using the intersection.",
    },
  ];

  for (const rule of rules) {
    if (!rule.matches.test(query)) continue;
    const source = passages.find(
      (passage) =>
        /^RO102[_-]/i.test(String(passage.filename || '')) &&
        rule.source.test(String(passage.content || ""))
    );
    if (source) return rule.answer;
  }

  return null;
}

function answerFromRoadMarkingMaterial(message, passages) {
  const query = message.toLowerCase();
  const terms = new Set(keywordTerms(query));
  const hasSolidTerm = ['solid', 'continuous', 'unbroken', 'uninterrupted']
    .some((term) => terms.has(term));
  const hasBrokenTerm = ['broken', 'dash', 'dashed', 'dotted']
    .some((term) => terms.has(term));
  const hasLineTerm = ['line', 'marking', 'paint', 'separator', 'stripe']
    .some((term) => terms.has(term));
  if (!hasLineTerm || (!hasSolidTerm && !hasBrokenTerm)) return null;
  if (hasBrokenTerm && /\bwhite\b/i.test(query) && !/\byellow\b/i.test(query)) return null;

  const content = passages.map((passage) => String(passage.content || '')).join('\n');
  const singleLineSupported =
    /SINGLE SOLID\s+(?:YELLOW|WHITE)(?:\s*\/\s*(?:YELLOW|WHITE))?\s+LINE/i.test(content) &&
    /(?:no overtaking|overtaking.{0,100}(?:prohibited|not allowed))/i.test(content) &&
    /(?:crossing (?:is )?(?:allowed|permitted)|crossing movement is allowed)/i.test(content);
  const doubleLineSupported =
    /DOUBLE SOLID\s+(?:YELLOW|WHITE)(?:\s*\/\s*(?:YELLOW|WHITE))?\s+LINES?/i.test(content) &&
    /(?:no overtaking|overtaking.{0,100}(?:prohibited|not allowed)|overtaking or crossing is prohibited)/i.test(content) &&
    /(?:no crossing|crossing (?:is )?prohibited|overtaking or crossing is prohibited)/i.test(content);
  const brokenAndSolidSupported =
    /BROKEN AND SOLID YELLOW LINES/i.test(content) &&
    /(?:passing is permitted|crossing and overtaking is allowed) on the side of the broken line/i.test(content) &&
    /(?:not on (?:the )?side of solid line|not allowed on (?:the )?side of solid line|not allowed on (?:the )?side of the solid line)/i.test(content);
  const brokenLineSupported = passages.some((passage) =>
    /\bBROKEN YELLOW LINE\b[\s\S]{0,140}crossing and overtaking is allowed with necessary precaution/i
      .test(String(passage.content || ''))
  );

  if (hasBrokenTerm && hasSolidTerm && brokenAndSolidSupported) {
    return 'A broken (dashed) yellow line allows crossing and overtaking with necessary precaution. When paired with a solid line, crossing and overtaking are allowed only on the broken-line side.';
  }
  if (hasBrokenTerm && brokenLineSupported) {
    return 'A broken (dashed) yellow line allows crossing and overtaking with necessary precaution.';
  }

  if (
    /\bwhite\b/i.test(query) &&
    !/\bdouble\b/i.test(query) &&
    /crossing of solid white lines requires special care and is discouraged/i.test(content)
  ) {
    return 'The material says crossing solid white lines requires special care and is discouraged.';
  }

  if (/\bdouble\b/i.test(query)) {
    return doubleLineSupported
      ? 'Double solid lines prohibit overtaking and crossing.'
      : null;
  }

  if (/\bsingle\b/i.test(query)) {
    return singleLineSupported
      ? 'A single solid yellow line allows crossing but prohibits overtaking.'
      : null;
  }

  if (singleLineSupported && doubleLineSupported) {
    return 'A solid line is an unbroken road marking. A single solid yellow line allows crossing but prohibits overtaking; double solid yellow lines prohibit both.';
  }
  if (singleLineSupported) {
    return 'A single solid yellow line allows crossing but prohibits overtaking.';
  }
  if (doubleLineSupported) {
    return 'Double solid lines prohibit overtaking and crossing.';
  }
  return null;
}

function isRoadRuleQuery(message) {
  return ROAD_RULE_QUERY.test(String(message || '')) ||
    keywordTerms(message).some((term) => ROAD_RULE_SEARCH_TERMS.has(term));
}

function answerFromVehicleSafetyGuide(message, passages) {
  const query = message.toLowerCase();
  const guidePassages = passages.filter((passage) =>
    /^RoadWise_PH_Vehicle_Safety_Informative_Guide\.pdf$/i.test(String(passage.filename || ''))
  );
  const rules = [
    {
      matches: /\b(?:radiator|cooling[- ]system)\s+cap\b.*\b(?:hot|open|check|coolant)\b|\b(?:hot|open|check|coolant)\b.*\b(?:radiator|cooling[- ]system)\s+cap\b/i,
      source: /never (?:open|remove) a hot (?:radiator|cooling-system) cap/i,
      answer: "No. Never open a hot radiator cap. Wait until the cooling system is cool and follow the owner's manual.",
    },
    {
      matches: /\b(?:coolant|cooling)\s+reservoir\b/i,
      source: /check coolant reservoir level only when the engine is cool/i,
      answer: "Check the coolant reservoir level only when the engine is cool, and follow the owner's manual.",
    },
    {
      matches: /\b(?:check[- ]engine|engine)\s+(?:warning\s+)?light\b/i,
      source: /if the light flashes, the engine runs abnormally, the vehicle overheats, or there is smoke or a burning smell, stop safely and arrange professional help/i,
      answer: "The meaning depends on the vehicle and warning behavior, so consult the owner's manual. If the light flashes or the engine runs abnormally, the vehicle overheats, or there is smoke or a burning smell, stop safely and arrange professional help.",
    },
    {
      matches: /\b(?:tire|tyre)\s+pressure\b/i,
      source: /use the vehicle's tire-pressure placard or owner's manual/i,
      answer: "Use the vehicle's tire-pressure placard or owner's manual; the correct pressure can vary by vehicle and load, so do not guess a universal value.",
    },
    {
      matches: /\bfloodwater\b|\bflood(?:ed|ing)?\s+(?:road|water)\b/i,
      source: /do not enter if depth, current, or road condition is uncertain/i,
      answer: "Do not enter floodwater if its depth, current, or the road condition is uncertain.",
    },
    {
      matches: /\b(?:soft|spongy|different|unsafe)\s+(?:brake|brakes|braking)\b|\bbrakes?\s+(?:feel|feels|behave|behaves)\s+(?:soft|different|unsafe)\b/i,
      source: /do not continue driving when braking may be unsafe/i,
      answer: "Do not continue driving when braking may be unsafe. Stop in a safe place and arrange professional assistance.",
    },
    {
      matches: /\bmaintenance schedule\b|\bwhen should i (?:service|maintain)\b/i,
      source: /follow the schedule in the owner's manual for the exact vehicle/i,
      answer: "Follow the maintenance schedule in the owner's manual for the exact vehicle.",
    },
  ];

  for (const rule of rules) {
    if (!rule.matches.test(query)) continue;
    const source = guidePassages.find((passage) => rule.source.test(String(passage.content || '')));
    if (source) return rule.answer;
  }

  return null;
}

function lacksExactFineSupport(message, passages) {
  if (!/\b(?:fine|penalt(?:y|ies)|exact amount|how much.*(?:ticket|violation))\b/i.test(message)) {
    return false;
  }
  return !passages.some((passage) =>
    /\b(?:fine|penalt(?:y|ies))\b[^.\n]{0,120}(?:₱|PHP\s*[\d,]+|[\d,]+\s*(?:pesos?|PHP))/i.test(String(passage.content || ""))
  );
}

function answerToSmallTalk(message) {
  const text = message.toLowerCase().replace(/[!.?,\s]+$/g, '').trim();
  const replies = new Map([
    ['hi', "Hi! I'm Dai. What driving rule or road sign can I help you with?"],
    ['hello', "Hello! I'm Dai. What driving rule or road sign can I help you with?"],
    ['hey', "Hey! What driving rule or road sign can I help you with?"],
    ['hi there', "Hi! What driving rule or road sign can I help you with?"],
    ['hello there', "Hello! What driving rule or road sign can I help you with?"],
    ['good morning', "Good morning! What driving rule or road sign can I help you with?"],
    ['good afternoon', "Good afternoon! What driving rule or road sign can I help you with?"],
    ['good evening', "Good evening! What driving rule or road sign can I help you with?"],
    ['how are you', "I'm ready to help you study Philippine road rules! What would you like to ask?"],
    ['how are you doing', "I'm ready to help you study Philippine road rules! What would you like to ask?"],
    ['thank you', "You're welcome! Ask me anytime about a driving rule or road sign."],
    ['thanks', "You're welcome! Ask me anytime about a driving rule or road sign."],
  ]);

  return replies.get(text) || null;
}

function hasValidSourceCitations(reply, passages) {
  const citations = [...reply.matchAll(/\(([^()]+?)\s+p\.(\d+)\)/gi)];
  if (citations.length === 0) return false;

  return citations.every(([, label, page]) =>
    passages.some(
      (passage) =>
        citationLabel(passage).toLowerCase() === label.trim().toLowerCase() &&
        Number(passage.page_number) === Number(page)
    )
  );
}

function findSupportingPassage(query, reply, passages) {
  const answer = String(reply).replace(/\([^()]+?\s+p\.\d+\)/gi, '');
  const answerTerms = factTerms(answer);
  const queryTerms = factTerms(query);
  if (answerTerms.size < 2 || queryTerms.size === 0) return null;

  const pages = new Map();
  for (const passage of passages) {
    const citation = sourceCitation(passage);
    if (!citation) continue;
    const existing = pages.get(citation);
    if (existing) {
      existing.content += ` ${passage.content || ''}`;
    } else {
      pages.set(citation, { ...passage, content: String(passage.content || '') });
    }
  }

  const supported = [...pages.values()]
    .map((passage) => {
      const sourceTerms = factTerms(passage.content);
      const answerMatches = [...answerTerms].filter((term) => sourceTerms.has(term)).length;
      const queryMatches = [...queryTerms].filter((term) => sourceTerms.has(term)).length;
      const answerCoverage = answerMatches / answerTerms.size;
      const queryCoverage = queryMatches / queryTerms.size;
      return { passage, answerCoverage, queryCoverage };
    })
    .filter(({ answerCoverage, queryCoverage }) => answerCoverage >= 0.75 && queryCoverage >= 0.5)
    .sort((a, b) => b.answerCoverage - a.answerCoverage || b.queryCoverage - a.queryCoverage);

  return supported[0] || null;
}

function groundModelAnswer(query, reply, passages) {
  const supporting = findSupportingPassage(query, reply, passages);
  if (!supporting) return null;

  const citations = [...reply.matchAll(/\(([^()]+?)\s+p\.(\d+)\)/gi)];
  const hasCitationText = /\([^)]*p\.\d+[^)]*\)/i.test(reply);
  if (hasCitationText) {
    if (!hasValidSourceCitations(reply, passages)) return null;
    const supportedCitations = citations.every(([, label, page]) =>
      passages.some(
        (passage) =>
          citationLabel(passage).toLowerCase() === label.trim().toLowerCase() &&
          Number(passage.page_number) === Number(page) &&
          findSupportingPassage(query, reply, [passage])
      )
    );
    if (!supportedCitations) return null;
    return reply;
  }

  const citation = sourceCitation(supporting.passage);
  if (!citation) return null;
  const groundedReply = `${reply.trim()} ${citation}`;
  return hasValidSourceCitations(groundedReply, passages) ? groundedReply : null;
}

function removeSourceCitations(reply) {
  return String(reply).replace(/\s*\([^()]+?\s+p\.\d+\)/gi, '').trim();
}

async function chat(req, res, next) {
  try {
    const body = req.body || {};
    const bodyMessages = Array.isArray(body.messages) ? body.messages : null;

    let message;
    let history;
    let textShape = false;

    if (bodyMessages) {
      const lastUser = [...bodyMessages].reverse().find((item) => item && item.role === 'user');
      message = typeof lastUser?.content === 'string' ? lastUser.content.trim() : '';
      history = bodyMessages
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .slice(0, -1)
        .map((item) => ({ role: item.role, content: item.content }));
      textShape = true;
    } else {
      message = typeof body.message === 'string' ? body.message.trim() : '';
      history = typeof body.history === 'string' ? JSON.parse(body.history) : body.history;
    }

    if (!message) {
      return res.status(400).json({ error: 'message is required and must be a non-empty string.' });
    }
    if (message.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        error: `message is too long. Keep it under ${MAX_QUERY_LENGTH} characters.`,
      });
    }

    const smallTalkAnswer = answerToSmallTalk(message);
    if (smallTalkAnswer) {
      const response = {
        model: ollama.CHAT_MODEL,
        mode: 'local-smalltalk',
        warning: null,
      };
      return res.json(textShape
        ? { ...response, text: smallTalkAnswer }
        : { ...response, reply: smallTalkAnswer });
    }

    if (!isRoadRuleQuery(message)) {
      try {
        const result = await ollama.chat({
          messages: [
            { role: 'system', content: GENERAL_CHAT_PROMPT },
            ...history.slice(-8),
            { role: 'user', content: message },
          ],
        });
        const response = {
          model: ollama.CHAT_MODEL,
          mode: 'local-general',
          warning: null,
        };
        return res.json(textShape
          ? { ...response, text: result.content }
          : { ...response, reply: result.content });
      } catch (err) {
        return res.status(503).json({
          error: 'The local AI is not available right now.',
          detail: err.message,
        });
      }
    }

    const retrieval = await retrieve({ query: message, topK: TOP_K, embedQuery: true });
    const passages = retrieval.results || [];
    const groundedSignalAnswer = answerFromRoadSignalMaterial(message, passages);
    const groundedRoadMarkingAnswer = answerFromRoadMarkingMaterial(message, passages);
    const groundedVehicleSafetyAnswer = answerFromVehicleSafetyGuide(message, passages);
    const groundedFineAnswer = lacksExactFineSupport(message, passages)
      ? "I can't confirm the exact fine from the information I have."
      : null;
    const bestRelevance = Math.max(0, ...passages.map((passage) => Number(passage.score) || 0));
    const retrievalIsRelevant = retrieval.mode !== 'vector' || bestRelevance >= MIN_VECTOR_RELEVANCE;

    let reply;
    const responseMode = retrieval.mode;
    if (groundedSignalAnswer || groundedRoadMarkingAnswer || groundedVehicleSafetyAnswer || groundedFineAnswer) {
      reply = groundedSignalAnswer || groundedRoadMarkingAnswer || groundedVehicleSafetyAnswer || groundedFineAnswer;
    } else if (!retrievalIsRelevant) {
      reply = UNVERIFIED_ANSWER;
    } else {
      try {
        const result = await ollama.chat({
          messages: [
            { role: 'system', content: buildTutorSystemPrompt() },
            {
              role: 'user',
              content: buildUserMessage({ query: message, history: { contextPassages: passages, messages: history } }),
            },
          ],
        });
        const groundedReply = groundModelAnswer(message, result.content, passages);
        reply = groundedReply || UNVERIFIED_ANSWER;
        if (
          groundedReply &&
          /\b(?:fine|penalt(?:y|ies))\b/i.test(message) &&
          passages.some((passage) => /^FDM[- ]Vol\.?[- ]2/i.test(String(passage.filename || ''))) &&
          !/\b2021\b/.test(reply)
        ) {
          reply += ' Penalties may change, so verify the current amount before relying on it.';
        }
      } catch (err) {
        return res.status(503).json({
          error: 'The local AI is not available right now.',
          detail: err.message,
        });
      }
    }

    reply = removeSourceCitations(reply);

    if (textShape) {
      return res.json({
        text: reply,
        model: ollama.CHAT_MODEL,
        mode: responseMode,
        warning: retrieval.warning || null,
      });
    }

    return res.json({
      reply,
      model: ollama.CHAT_MODEL,
      mode: responseMode,
      warning: retrieval.warning || null,
    });
  } catch (err) {
    return next(err);
  }
}

async function models(req, res, next) {
  try {
    const result = await ollama.listModels();
    if (!result.ok) {
      return res.status(503).json({ error: 'Local AI (Ollama) is not reachable.' });
    }
    return res.json({ models: result.models });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  chat,
  models,
  answerFromRoadSignalMaterial,
  answerFromVehicleSafetyGuide,
  lacksExactFineSupport,
  answerToSmallTalk,
  hasValidSourceCitations,
  findSupportingPassage,
  groundModelAnswer,
  answerFromRoadMarkingMaterial,
  isRoadRuleQuery,
};