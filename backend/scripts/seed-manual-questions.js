'use strict';

require('dotenv').config();

const { pool } = require('../src/database/connection');

const QUESTIONS = [
  {
    quizId: 1,
    prompt: 'Where are expressway exit signs posted before a vehicle reaches an exit ramp?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 86, says exit signs are posted overhead before the interchange exit ramp.',
    options: [
      'Overhead before the interchange exit ramp',
      'Only at the end of the exit ramp',
      'On the vehicle entry ramp after merging',
      'Only at the toll payment booth',
    ],
    correctIndex: 0,
  },
  {
    quizId: 1,
    prompt: 'What is the purpose of a traffic instruction sign?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 88, describes these signs as instructions to follow a direction or course of action.',
    options: [
      'To instruct motorists to follow a direction or course of action',
      'To identify nearby fuel and accommodation services only',
      'To mark every place where vehicles may park',
      'To show the distance to a province boundary only',
    ],
    correctIndex: 0,
  },
  {
    quizId: 1,
    prompt: 'According to the road-sign examples, when may a driver turn right where a sign says “Turn right on green light only”?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 89, lists this as a traffic instruction sign.',
    options: [
      'Only when the traffic light is green',
      'Whenever the road appears clear, regardless of the light',
      'Only when the traffic light is red',
      'Only after another vehicle turns first',
    ],
    correctIndex: 0,
  },
  {
    quizId: 1,
    prompt: 'What do hazard markers emphasize to approaching drivers?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 90, says they emphasize a change in travel direction or an obstruction.',
    options: [
      'A change in travel direction or an obstruction',
      'A nearby gasoline station or rest area',
      'The start of a toll payment zone',
      'The legal classification of the driver',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'What does a continuity line on the left side indicate when you want to continue in your current direction?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 97, says the lane is ending or exiting, so a driver continuing must change lanes.',
    options: [
      'The lane is ending or exiting, so change lanes to continue',
      'The lane will continue unaffected',
      'Stop before the line and wait for a signal',
      'The lane is reserved for bicycles',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'What does a continuity line on the right side indicate?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 97, says the lane continues unaffected.',
    options: [
      'The lane continues unaffected',
      'The lane is ending and all vehicles must stop',
      'The road is closed to through traffic',
      'Drivers must yield to all traffic behind them',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'Where should a vehicle stop at a marked stop line?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 98, says vehicles are required to stop before the white line.',
    options: [
      'Before the white line',
      'On top of the white line',
      'After crossing the pedestrian area',
      'Beside the nearest parked vehicle',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'What should a driver do at a give-way or holding line?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 98, says drivers must give way to all traffic at these markings.',
    options: [
      'Give way to all traffic',
      'Continue without yielding if traveling straight',
      'Stop only when a traffic officer is present',
      'Use the line as a parking boundary',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'At a roundabout holding line, which traffic has the right of way?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 98, gives priority to vehicles already within the roundabout.',
    options: [
      'Vehicles already within the roundabout',
      'Vehicles just about to enter the roundabout',
      'The largest vehicle approaching the roundabout',
      'Vehicles entering from the left in every case',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'According to the manual, may a motor vehicle use a marked bicycle lane?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 104, states that motor vehicles are not allowed to use the bicycle lane.',
    options: [
      'No, motor vehicles are not allowed to use it',
      'Yes, whenever traffic is moving slowly',
      'Yes, if the vehicle signals first',
      'Only during daylight hours',
    ],
    correctIndex: 0,
  },
  {
    quizId: 2,
    prompt: 'What do rumble strips provide to motorists who drive over them?',
    explanation: 'FDM Vol. 1 (2nd ed., 2021), PDF p. 102, describes visual, audio, and motion warnings.',
    options: [
      'Visual, audio, and motion warnings',
      'A guaranteed safe stopping distance',
      'A signal that the road has become one-way',
      'A measurement of vehicle tire pressure',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'What does Republic Act No. 4136 control, according to FDM Vol. 2?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 33, says RA 4136 covers motor-vehicle registration and operation and the licensing of related persons.',
    options: [
      'Motor-vehicle registration and operation, and related licensing',
      'Only the collection of road tolls',
      'Only motorcycle helmet standards',
      'Only the construction of national highways',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'Which law is identified in FDM Vol. 2 as the Seat Belts Use Act of 1999?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 36, identifies the Seat Belts Use Act as Republic Act No. 8750.',
    options: [
      'Republic Act No. 8750',
      'Republic Act No. 4136',
      'Republic Act No. 10054',
      'Republic Act No. 10586',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'Which law does FDM Vol. 2 identify as the Motorcycle Helmet Act of 2009?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 40, identifies the Motorcycle Helmet Act as Republic Act No. 10054.',
    options: [
      'Republic Act No. 10054',
      'Republic Act No. 8750',
      'Republic Act No. 10913',
      'Republic Act No. 8794',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'What helmet-related exemption is stated in FDM Vol. 2?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 41, states that drivers of tricycles are exempt from the motorcycle-helmet requirement described there.',
    options: [
      'Drivers of tricycles are exempt from that requirement',
      'All motorcycle passengers are exempt',
      'The requirement applies only on expressways',
      'The requirement applies only to professional drivers',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'How long does the manual say a Temporary Operator’s Permit may be used to operate a motor vehicle?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 76, describes the permit as valid for 72 hours.',
    options: [
      '72 hours',
      '24 hours',
      '5 days',
      '15 days',
    ],
    correctIndex: 0,
  },
  {
    quizId: 3,
    prompt: 'Within how many days does the manual say an apprehension must be contested in writing?',
    explanation: 'FDM Vol. 2 (2nd ed., 2021), PDF p. 76, states that a written contest must be filed within five days of apprehension.',
    options: [
      '5 days',
      '24 hours',
      '15 days',
      '30 days',
    ],
    correctIndex: 0,
  },
];

function orderedOptions(question) {
  const options = question.options.map((body) => ({ body, isCorrect: false }));
  const [correctOption] = options.splice(question.correctIndex, 1);
  let hash = 0;
  for (const character of question.prompt) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  options.splice(hash % (options.length + 1), 0, {
    ...correctOption,
    isCorrect: true,
  });
  return options;
}

async function seedQuestions() {
  const connection = await pool.getConnection();
  const counts = new Map();

  try {
    await connection.beginTransaction();
    const quizIds = [...new Set(QUESTIONS.map((question) => question.quizId))];
    const [quizzes] = await connection.query('SELECT id FROM quizzes WHERE id IN (?)', [quizIds]);
    const availableQuizIds = new Set(quizzes.map((quiz) => Number(quiz.id)));
    const missingQuizIds = quizIds.filter((quizId) => !availableQuizIds.has(quizId));
    if (missingQuizIds.length > 0) {
      throw new Error(`Required quiz records are missing: ${missingQuizIds.join(', ')}`);
    }

    for (const quizId of quizIds) {
      const [rows] = await connection.query(
        'SELECT COALESCE(MAX(order_index), 0) AS last_order FROM questions WHERE quiz_id = ?',
        [quizId]
      );
      counts.set(quizId, { added: 0, skipped: 0, reordered: 0, nextOrder: Number(rows[0].last_order) + 1 });
    }

    for (const question of QUESTIONS) {
      if (
        question.options.length !== 4 ||
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      ) {
        throw new Error(`Invalid answer options for: ${question.prompt}`);
      }

      const [existing] = await connection.query(
        'SELECT id FROM questions WHERE quiz_id = ? AND prompt = ? LIMIT 1',
        [question.quizId, question.prompt]
      );
      const quizCounts = counts.get(question.quizId);
      if (existing.length > 0) {
        const [currentOptions] = await connection.query(
          'SELECT id, body, is_correct, order_index FROM options WHERE question_id = ?',
          [existing[0].id]
        );
        const expectedOptions = orderedOptions(question);
        const hasSameOptions =
          currentOptions.length === expectedOptions.length &&
          expectedOptions.every((expected) =>
            currentOptions.some(
              (current) =>
                current.body === expected.body &&
                Boolean(Number(current.is_correct)) === expected.isCorrect
            )
          );

        if (hasSameOptions) {
          const orderChanged = expectedOptions.some(
            (expected, index) =>
              !currentOptions.some(
                (current) =>
                  current.body === expected.body &&
                  Number(current.order_index) === index + 1
              )
          );
          if (orderChanged) {
            await connection.query(
              'UPDATE options SET order_index = order_index + 100 WHERE question_id = ?',
              [existing[0].id]
            );
            for (const [index, option] of expectedOptions.entries()) {
              await connection.query(
                'UPDATE options SET order_index = ? WHERE question_id = ? AND body = ?',
                [index + 1, existing[0].id, option.body]
              );
            }
            quizCounts.reordered += 1;
          }
        }
        quizCounts.skipped += 1;
        continue;
      }

      const [inserted] = await connection.query(
        `INSERT INTO questions (quiz_id, prompt, explanation, points, order_index)
         VALUES (?, ?, ?, 1, ?)`,
        [question.quizId, question.prompt, question.explanation, quizCounts.nextOrder]
      );
      await connection.query(
        `INSERT INTO options (question_id, body, is_correct, order_index)
         VALUES ?`,
        [
          orderedOptions(question).map((option, index) => [
            inserted.insertId,
            option.body,
            option.isCorrect ? 1 : 0,
            index + 1,
          ]),
        ]
      );

      quizCounts.added += 1;
      quizCounts.nextOrder += 1;
    }

    await connection.commit();
    return Object.fromEntries(
      [...counts].map(([quizId, quizCounts]) => [
        quizId,
        {
          added: quizCounts.added,
          skipped: quizCounts.skipped,
          reordered: quizCounts.reordered,
        },
      ])
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

seedQuestions()
  .then((result) => {
    console.log('Manual-based quiz questions:');
    for (const [quizId, counts] of Object.entries(result)) {
      console.log(
        `- Quiz ${quizId}: ${counts.added} added, ${counts.reordered} option sets shuffled, ${counts.skipped} already present`
      );
    }
  })
  .catch((error) => {
    console.error('Could not add manual-based quiz questions:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
