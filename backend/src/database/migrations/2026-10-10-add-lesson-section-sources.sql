-- Additive migration: ground lesson/module sections in the traffic-PDF knowledge base.
-- Safe to run repeatedly on MySQL 8 (checks information_schema before altering).

SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lesson_sections' AND COLUMN_NAME = 'source_document') = 0,
  'ALTER TABLE lesson_sections ADD COLUMN source_document VARCHAR(255) NULL COMMENT ''knowledge-base file the module section is grounded in'' AFTER media_url',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lesson_sections' AND COLUMN_NAME = 'source_page') = 0,
  'ALTER TABLE lesson_sections ADD COLUMN source_page VARCHAR(40) NULL COMMENT ''PDF page number(s) cited for this section'' AFTER source_document',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lesson_sections' AND COLUMN_NAME = 'source_ref') = 0,
  'ALTER TABLE lesson_sections ADD COLUMN source_ref VARCHAR(120) NULL COMMENT ''legal/rule reference detected in the source'' AFTER source_page',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
