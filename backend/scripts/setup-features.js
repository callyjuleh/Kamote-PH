'use strict';

// Non-destructive migration + content seed for the feature set:
// quiz resume, flashcards-from-DB, achievements/goals, consent, license review.
// Safe to run repeatedly.

require('dotenv').config();

const { pool } = require('../src/database/connection');

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

async function addColumn(table, column, definition) {
  if (await columnExists(table, column)) return;
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  console.log(`  + ${table}.${column}`);
}

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].n > 0;
}

const DECKS = [
  {
    deck: 'Road Signs',
    category: 'Signs',
    icon: 'sign',
    cards: [
      ['What shape and colour are warning signs?', 'Yellow diamond with a black symbol or border, used to warn of hazards ahead.'],
      ['What does a red octagon mean?', 'Stop completely, then proceed only when the way is clear.'],
      ['What does a downward-pointing triangle mean?', 'Give way: slow down and yield to traffic and pedestrians.'],
      ['What does a yellow diamond with a pedestrian symbol mean?', 'Pedestrian crossing or pedestrians ahead — slow down and be ready to stop.'],
      ['What does a circular sign with a red border usually mean?', 'A prohibition or restriction, such as no entry or a speed limit.'],
      ['What does a school zone sign warn?', 'Children may be crossing — reduce speed and watch for students.'],
      ['What do blue circular signs usually show?', 'A mandatory instruction, such as turn left or keep right.'],
      ['What does a flashing red light mean?', 'Treat it like a stop sign: stop fully, then go when safe.'],
    ],
  },
  {
    deck: 'Road Rules',
    category: 'Rules',
    icon: 'rules',
    cards: [
      ['On which side do we drive in the Philippines?', 'On the right side of the road.'],
      ['What is the default speed limit on most city roads?', 'Around 30-40 km/h unless a sign says otherwise.'],
      ['When must you use your headlights?', 'At night and whenever visibility is poor, such as heavy rain.'],
      ['Who has the right of way at an intersection without signs?', 'The vehicle already on the main road or the one that arrived first.'],
      ['Is overtaking allowed on a solid double line?', 'No. Never cross a solid double line to overtake.'],
      ['How far should you stop from a pedestrian crossing?', 'Before the crossing line, leaving it clear for pedestrians.'],
    ],
  },
  {
    deck: 'Road Safety',
    category: 'Safety',
    icon: 'safety',
    cards: [
      ['What is the safe following distance rule?', 'The three-second rule: keep at least three seconds behind the vehicle ahead.'],
      ['What should you do in heavy rain?', 'Slow down, increase following distance, and turn on headlights.'],
      ['Who must wear a seatbelt?', 'Everyone in the vehicle, front and back.'],
      ['When may you use a mobile phone while driving?', 'Only with a hands-free device, and never for texting.'],
      ['What is the first thing to do after a minor crash?', 'Move to a safe spot, warn other traffic, and exchange details.'],
      ['What should you do if you feel sleepy while driving?', 'Pull over safely and rest. Never push through fatigue.'],
    ],
  },
  {
    deck: 'Vehicle Basics',
    category: 'Vehicle',
    icon: 'vehicle',
    cards: [
      ['What does the oil pressure warning light mean?', 'Engine oil pressure is low — stop safely and check the oil.'],
      ['When should you check tyre pressure?', 'When tyres are cold, before long trips and at least once a month.'],
      ['What is the legal tread depth for tyres?', 'At least 1.6 mm; replace tyres worn below that.'],
      ['What should you check before a long drive?', 'Brakes, tyres, lights, oil, coolant, and fuel.'],
      ['What does a red battery warning light mean?', 'The charging system is faulty — have it checked soon.'],
    ],
  },
  {
    deck: 'Traffic Laws',
    category: 'Laws',
    icon: 'laws',
    cards: [
      ['What is the blood alcohol limit for drivers?', 'Philippine law sets a low limit; the safest choice is zero alcohol.'],
      ['What documents must you carry while driving?', "Your driver's licence and the vehicle's registration and insurance."],
      ['Is wearing a helmet required on motorcycles?', 'Yes. Both rider and passenger must wear an approved helmet.'],
      ['What is the penalty for driving without a licence?', 'A fine and possible impounding of the vehicle.'],
      ['Are children allowed on the front seat?', 'No. Children under the required height must ride in the back.'],
    ],
  },
  {
    deck: 'Traffic Signals',
    category: 'Signals',
    icon: 'signal',
    cards: [
      ['What does a steady yellow traffic light mean?', 'Prepare to stop; the light is about to turn red.'],
      ['What does a green light with a left arrow mean?', 'You may turn left with care; oncoming traffic is stopped.'],
      ['What does a flashing yellow light mean?', 'Proceed with caution; slow down and watch for hazards.'],
      ['What does a green light mean?', 'Proceed straight or turn if the way is clear, yielding to pedestrians.'],
      ['What does a police officer directing traffic override?', 'Traffic lights and road signs — always follow the officer.'],
    ],
  },
];

const ACHIEVEMENTS = [
  ['first_quiz', 'First quiz taken', 'Complete your first practice quiz.', 'quiz'],
  ['first_lesson', 'First lesson done', 'Finish reading your first lesson.', 'book'],
  ['perfect_score', 'Perfect score', 'Answer every question correctly in a quiz.', 'star'],
  ['quiz_ace', 'Quiz ace', 'Pass five quizzes.', 'trophy'],
  ['flashcard_10', 'Card starter', 'Review ten flashcards.', 'cards'],
  ['seven_day_streak', 'Seven-day streak', 'Study for seven days in a row.', 'fire'],
  ['verified_driver', 'Verified driver', 'Get your driver status verified.', 'badge'],
];

async function seedFlashcards() {
  const [count] = await pool.query('SELECT COUNT(*) AS n FROM flashcards');
  if (count[0].n > 0) {
    console.log('  flashcards already seeded');
    return;
  }
  const rows = [];
  DECKS.forEach((deck, dIndex) => {
    deck.cards.forEach((card, cIndex) => {
      rows.push([deck.deck, deck.category, deck.icon, card[0], card[1], dIndex * 100 + cIndex]);
    });
  });
  await pool.query(
    `INSERT INTO flashcards (deck, category, icon, front, back, order_index) VALUES ?`,
    [rows]
  );
  console.log(`  seeded ${rows.length} flashcards in ${DECKS.length} decks`);
}

async function seedAchievements() {
  const [count] = await pool.query('SELECT COUNT(*) AS n FROM achievements');
  if (count[0].n > 0) {
    console.log('  achievements already seeded');
    return;
  }
  await pool.query(
    `INSERT INTO achievements (code, title, description, icon) VALUES ?`,
    [ACHIEVEMENTS]
  );
  console.log(`  seeded ${ACHIEVEMENTS.length} achievements`);
}

async function main() {
  console.log('Altering tables...');
  await addColumn('attempts', 'current_index', 'current_index INT NOT NULL DEFAULT 0');
  await addColumn('users', 'license_status', "license_status ENUM('none','pending','verified','rejected') NOT NULL DEFAULT 'none'");
  await addColumn('users', 'license_review_note', 'license_review_note VARCHAR(255) NULL');
  await addColumn('users', 'consent_privacy_version', 'consent_privacy_version VARCHAR(20) NULL');
  await addColumn('users', 'consent_privacy_at', 'consent_privacy_at TIMESTAMP NULL DEFAULT NULL');
  await addColumn('users', 'consent_terms_version', 'consent_terms_version VARCHAR(20) NULL');
  await addColumn('users', 'consent_terms_at', 'consent_terms_at TIMESTAMP NULL DEFAULT NULL');

  console.log('Creating tables...');
  await pool.query(`CREATE TABLE IF NOT EXISTS flashcards (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    deck        VARCHAR(120)    NOT NULL,
    category    VARCHAR(80)     NOT NULL DEFAULT 'General',
    icon        VARCHAR(40)     NULL,
    front       TEXT            NOT NULL,
    back        TEXT            NOT NULL,
    order_index INT             NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_flashcards_deck (deck, order_index)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS user_flashcard_progress (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NOT NULL,
    deck          VARCHAR(120)    NOT NULL,
    current_index INT             NOT NULL DEFAULT 0,
    cards_total   INT             NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_flash_user_deck (user_id, deck),
    CONSTRAINT fk_flash_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS achievements (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code        VARCHAR(60)     NOT NULL,
    title       VARCHAR(120)    NOT NULL,
    description VARCHAR(255)    NOT NULL,
    icon        VARCHAR(40)     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_achievements_code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS user_achievements (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    achievement_id BIGINT UNSIGNED NOT NULL,
    earned_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_achievement (user_id, achievement_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await seedFlashcards();
  await seedAchievements();

  await pool.end();
  console.log('\nFeature setup complete.');
}

main().catch((err) => {
  console.error('Feature setup failed:', err.message);
  process.exit(1);
});
