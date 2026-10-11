'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  answerFromRoadMarkingMaterial,
  isRoadRuleQuery,
} = require('../src/controllers/ai.controllers');

const brokenLinePassage = {
  content: 'BROKEN YELLOW LINE Crossing and overtaking is allowed with necessary precaution.',
};
const pairedLinePassage = {
  content: 'BROKEN AND SOLID YELLOW LINES passing is permitted on the side of the broken line but not on side of solid line.',
};

test('road-marking answers recognize alternate words for dashed and solid lines', () => {
  const answer = answerFromRoadMarkingMaterial(
    'What does an unbroken road stripe mean beside a dotted stripe?',
    [brokenLinePassage, pairedLinePassage]
  );

  assert.match(answer, /broken \(dashed\) yellow line/i);
  assert.match(answer, /only on the broken-line side/i);
});

test('a differently worded broken-line question uses its matching reference', () => {
  const answer = answerFromRoadMarkingMaterial('What can I do across a dashed yellow divider?', [
    brokenLinePassage,
  ]);

  assert.equal(
    answer,
    'A broken (dashed) yellow line allows crossing and overtaking with necessary precaution.'
  );
});

test('road-marking answers do not infer a rule without matching reference text', () => {
  const answer = answerFromRoadMarkingMaterial('What does a dotted road stripe mean?', [
    { content: 'DOUBLE SOLID YELLOW LINES prohibit overtaking and crossing.' },
  ]);

  assert.equal(answer, null);
});

test('road-marking answers do not apply yellow-line rules to a white line', () => {
  const answer = answerFromRoadMarkingMaterial('What does a broken white line mean?', [
    brokenLinePassage,
    pairedLinePassage,
  ]);

  assert.equal(answer, null);
});

test('alternate road-marking words use the reference-backed road-rule route', () => {
  assert.equal(isRoadRuleQuery('What can I do across a dashed yellow divider?'), true);
  assert.equal(isRoadRuleQuery('What does an unbroken road stripe mean?'), true);
});

test('other driving topics use the reference-backed road-rule route', () => {
  for (const question of [
    'Do I have to wear a seat belt?',
    'Who has the right-of-way at this junction?',
    'What should I do around an ambulance?',
    'What is the maximum speed restriction?',
    'What does a warning sign mean?',
    'Ano ang ibig sabihin ng tawiran?',
    'Ano ang speed limit sa kalsada?',
    'Ano ang dapat gawin kapag may banggaan?',
    'My car is hydroplaning in heavy rain; what should I do?',
    'A tire blew out while I was driving. What now?',
    'I feel sleepy; is it safe to keep driving?',
    'The traffic light is not working at the intersection. How should I proceed?',
    'My vehicle has broken down on the road. What should I do?',
    'Ano ang gagawin kapag pumalya ang preno?',
  ]) {
    assert.equal(isRoadRuleQuery(question), true, question);
  }
  assert.equal(isRoadRuleQuery('What is your favorite movie?'), false);
});
