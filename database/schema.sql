-- RoadWise PH Learning App - MySQL 8 schema
-- Drop in dependency order so the file is idempotent for local dev.

SET NAMES utf8mb4;

DROP TABLE IF EXISTS ai_generations;
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS sync_queue;
DROP TABLE IF EXISTS user_flashcard_progress;
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS study_progress;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS attempt_answers;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS lesson_sections;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name        VARCHAR(120)    NOT NULL,
  email            VARCHAR(190)    NOT NULL,
  password_hash    VARCHAR(255)    NOT NULL,
  avatar_url       VARCHAR(512)    NULL,
  track            ENUM('new','licensed') NOT NULL DEFAULT 'new',
  daily_goal       INT             NOT NULL DEFAULT 10,
  notifications_on TINYINT(1)      NOT NULL DEFAULT 1,
  reminder_time    VARCHAR(5)      NOT NULL DEFAULT '19:00',
  sounds           TINYINT(1)      NOT NULL DEFAULT 0,
  license_number   VARCHAR(32)     NULL,
  license_file_name VARCHAR(255)   NULL,
  license_thumb    MEDIUMTEXT      NULL,
  license_status   ENUM('none','pending','verified','rejected') NOT NULL DEFAULT 'none',
  license_review_note VARCHAR(255) NULL,
  consent_privacy_version VARCHAR(20) NULL,
  consent_privacy_at TIMESTAMP    NULL DEFAULT NULL,
  consent_terms_version VARCHAR(20) NULL,
  consent_terms_at TIMESTAMP      NULL DEFAULT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  kind       ENUM('streak','reminder','lesson','quiz','tip','system') NOT NULL DEFAULT 'system',
  title      VARCHAR(180)    NOT NULL,
  body       TEXT            NOT NULL,
  target     VARCHAR(40)     NULL,
  is_read    TINYINT(1)      NOT NULL DEFAULT 0,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE study_progress (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  study_set       VARCHAR(180)    NOT NULL,
  cards_completed INT             NOT NULL DEFAULT 0,
  cards_total     INT             NOT NULL DEFAULT 0,
  accuracy        INT             NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_study_user_set (user_id, study_set),
  CONSTRAINT fk_study_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  score      INT             NOT NULL DEFAULT 0,
  total      INT             NOT NULL DEFAULT 0,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quiz_attempts_user (user_id, created_at),
  CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flashcards (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  deck        VARCHAR(120)    NOT NULL,
  category    VARCHAR(80)     NOT NULL DEFAULT 'General',
  icon        VARCHAR(40)     NULL,
  front       TEXT            NOT NULL,
  back        TEXT            NOT NULL,
  order_index INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_flashcards_deck (deck, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_flashcard_progress (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  deck          VARCHAR(120)    NOT NULL,
  current_index INT             NOT NULL DEFAULT 0,
  cards_total   INT             NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_flash_user_deck (user_id, deck),
  CONSTRAINT fk_flash_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE achievements (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(60)     NOT NULL,
  title       VARCHAR(120)    NOT NULL,
  description VARCHAR(255)    NOT NULL,
  icon        VARCHAR(40)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_achievements (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  achievement_id BIGINT UNSIGNED NOT NULL,
  earned_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_achievement (user_id, achievement_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(180)    NOT NULL,
  description   TEXT            NULL,
  category      VARCHAR(80)     NOT NULL DEFAULT 'General',
  icon          VARCHAR(80)     NULL,
  order_index   INT             NOT NULL DEFAULT 0,
  duration_min  INT             NOT NULL DEFAULT 0,
  is_published  TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lessons_category (category),
  KEY idx_lessons_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lesson_sections (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id       BIGINT UNSIGNED NOT NULL,
  heading         VARCHAR(180)    NOT NULL,
  body            TEXT            NOT NULL,
  media_url       VARCHAR(512)    NULL,
  source_document VARCHAR(255)    NULL COMMENT 'knowledge-base file the module section is grounded in',
  source_page     VARCHAR(40)     NULL COMMENT 'PDF page number(s) cited for this section',
  source_ref      VARCHAR(120)    NULL COMMENT 'legal/rule reference detected in the source (e.g. SECTION 3)',
  order_index     INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sections_lesson (lesson_id, order_index),
  CONSTRAINT fk_sections_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quizzes (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id  BIGINT UNSIGNED NULL,
  title      VARCHAR(180)    NOT NULL,
  kind       ENUM('lesson','practice','mock_exam') NOT NULL DEFAULT 'lesson',
  pass_score INT             NOT NULL DEFAULT 70,
  time_limit INT             NULL COMMENT 'seconds, NULL = untimed',
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quizzes_lesson (lesson_id),
  CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_id     BIGINT UNSIGNED NOT NULL,
  prompt      TEXT            NOT NULL,
  explanation TEXT            NULL,
  points      INT             NOT NULL DEFAULT 1,
  order_index INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_questions_quiz (quiz_id, order_index),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE options (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  body        TEXT            NOT NULL,
  is_correct  TINYINT(1)      NOT NULL DEFAULT 0,
  order_index INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_options_question (question_id, order_index),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  quiz_id      BIGINT UNSIGNED NOT NULL,
  score        INT             NOT NULL DEFAULT 0,
  total_points INT             NOT NULL DEFAULT 0,
  passed       TINYINT(1)      NOT NULL DEFAULT 0,
  current_index INT            NOT NULL DEFAULT 0,
  started_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_attempts_user (user_id, started_at),
  KEY idx_attempts_quiz (quiz_id),
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempt_answers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id  BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  option_id   BIGINT UNSIGNED NULL,
  is_correct  TINYINT(1)      NOT NULL DEFAULT 0,
  answered_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt_question (attempt_id, question_id),
  KEY idx_answers_question (question_id),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts (id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option FOREIGN KEY (option_id) REFERENCES options (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE progress (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  lesson_id    BIGINT UNSIGNED NOT NULL,
  status       ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMP       NULL DEFAULT NULL,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_progress_user_lesson (user_id, lesson_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookmarks (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  lesson_id  BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookmarks_user_lesson (user_id, lesson_id),
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_history (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       ENUM('user','assistant','system') NOT NULL,
  content    TEXT            NOT NULL,
  model      VARCHAR(80)     NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_user_time (user_id, created_at),
  CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_generations (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,
  kind          ENUM('chat','quiz','explanation','summary','search') NOT NULL,
  prompt_hash   CHAR(64)        NOT NULL COMMENT 'sha256 of the normalized prompt, for caching',
  request_json  JSON            NULL,
  response_json JSON            NULL,
  model         VARCHAR(80)     NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_kind_hash (kind, prompt_hash),
  CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sync_queue (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NULL,
  entity     VARCHAR(60)     NOT NULL,
  action     ENUM('create','update','delete') NOT NULL,
  payload    JSON            NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at  TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_sync_pending (user_id, synced_at),
  CONSTRAINT fk_sync_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
