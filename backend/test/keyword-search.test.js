'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { keywordTerms } = require('../src/knowledge/knowledge.repository');

test('keyword search drops question filler and maps dashed lines to broken lines', () => {
  const terms = keywordTerms('What is a solid line and a dashed line?');

  for (const term of ['solid', 'continuous', 'line', 'dashed', 'broken', 'dash']) {
    assert.ok(terms.includes(term), `expected expanded terms to include "${term}"`);
  }
});

test('keyword search normalizes plural road-marking terms', () => {
  const terms = keywordTerms('Explain broken lines and road markings');

  for (const term of ['broken', 'dash', 'dashed', 'line', 'road', 'marking']) {
    assert.ok(terms.includes(term), `expected expanded terms to include "${term}"`);
  }
});

test('keyword search expands common road-rule terminology', () => {
  const terms = keywordTerms('Can I overtake across an unbroken center stripe?');

  for (const term of ['pass', 'passing', 'solid', 'continuous', 'centre', 'line', 'marking']) {
    assert.ok(terms.includes(term), `expected expanded terms to include "${term}"`);
  }
});

test('keyword search recognizes common pedestrian-crossing terminology', () => {
  const terms = keywordTerms('Where should I stop before a zebra crossing?');

  for (const term of ['halt', 'crosswalk', 'zebra', 'crossing']) {
    assert.ok(terms.includes(term), `expected expanded terms to include "${term}"`);
  }
});

test('keyword search expands driving safety, vehicle, and priority terminology', () => {
  const seatBeltTerms = keywordTerms('Do I have to wear a seat belt?');
  const rightOfWayTerms = keywordTerms('Who has the right-of-way at this junction?');
  const emergencyTerms = keywordTerms('What should I do around an ambulance?');

  for (const term of ['seat belt', 'seatbelt', 'safety belt']) {
    assert.ok(seatBeltTerms.includes(term), `expected seat-belt terms to include "${term}"`);
  }
  for (const term of ['right of way', 'priority', 'precedence']) {
    assert.ok(rightOfWayTerms.includes(term), `expected right-of-way terms to include "${term}"`);
  }
  for (const term of ['ambulance', 'emergency', 'firetruck']) {
    assert.ok(emergencyTerms.includes(term), `expected emergency terms to include "${term}"`);
  }
  assert.ok(!seatBeltTerms.includes('wear'));
});

test('keyword search recognizes speed-limit phrases and vehicle aliases', () => {
  const speedTerms = keywordTerms('What is the maximum speed restriction?');
  const vehicleTerms = keywordTerms('Can a car pass another auto?');

  for (const term of ['speed limit', 'speed restriction', 'speed cap']) {
    assert.ok(speedTerms.includes(term), `expected speed-limit terms to include "${term}"`);
  }
  for (const term of ['car', 'auto', 'automobile', 'vehicle']) {
    assert.ok(vehicleTerms.includes(term), `expected vehicle terms to include "${term}"`);
  }
});

test('keyword search recognizes common Filipino road-safety terms', () => {
  const crossingTerms = keywordTerms('Ano ang ibig sabihin ng tawiran?');
  const vehicleTerms = keywordTerms('Ano ang dapat gawin sa sasakyan?');
  const stoppingTerms = keywordTerms('Dapat bang huminto sa karatula?');

  for (const term of ['crosswalk', 'zebra']) {
    assert.ok(crossingTerms.includes(term), `expected crossing terms to include "${term}"`);
  }
  for (const term of ['car', 'vehicle', 'kotse']) {
    assert.ok(vehicleTerms.includes(term), `expected vehicle terms to include "${term}"`);
  }
  for (const term of ['stop', 'halt', 'sign']) {
    assert.ok(stoppingTerms.includes(term), `expected stop-sign terms to include "${term}"`);
  }
  assert.ok(!crossingTerms.includes('ibig'));
  assert.ok(!crossingTerms.includes('sabihin'));
});

test('keyword search expands common aliases and plural forms', () => {
  const accidentTerms = keywordTerms('What should I do after a road collision?');
  const speedTerms = keywordTerms('What are the speed limits for buses?');
  const rightOfWayTerms = keywordTerms('Who has the right of way?');

  for (const term of ['accident', 'crash']) {
    assert.ok(accidentTerms.includes(term), `expected accident terms to include "${term}"`);
  }
  assert.ok(speedTerms.includes('bus'));
  assert.ok(rightOfWayTerms.includes('priority'));
});
