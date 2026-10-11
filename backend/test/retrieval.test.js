'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { mergeResults } = require('../src/knowledge/retrieval');

test('hybrid retrieval merges vector and keyword results without duplicating passages', () => {
  const results = mergeResults(
    [
      { passageId: 1, score: 0.8, content: 'Vector result' },
      { passageId: 2, score: 0.6, content: 'Shared result' },
    ],
    [
      { id: 2, match_count: 4, content: 'Shared result' },
      { id: 3, match_count: 3, content: 'Keyword result' },
    ],
    3
  );

  assert.deepEqual(results.map((result) => result.passageId), [2, 3, 1]);
  assert.equal(results[0].score, 0.6);
  assert.equal(results[0].keywordScore, 4);
  assert.equal(results[1].score, 0);
  assert.equal(results[1].keywordScore, 3);
});

test('hybrid retrieval honors the requested result limit', () => {
  const results = mergeResults(
    [{ passageId: 1, score: 0.8 }, { passageId: 2, score: 0.7 }],
    [{ id: 3, match_count: 2 }, { id: 4, match_count: 1 }],
    2
  );

  assert.equal(results.length, 2);
});
