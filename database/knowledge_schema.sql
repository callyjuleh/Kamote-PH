-- RoadWise PH - Knowledge base schema (RAG storage for traffic-law PDFs).
-- ADDITIVE ONLY: does not modify or drop any existing application tables.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS kb_documents (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename        VARCHAR(255)    NOT NULL,
  title           VARCHAR(255)    NULL,
  source_path     VARCHAR(1024)   NULL,
  file_hash       CHAR(64)        NULL COMMENT 'sha256 of the original file',
  page_count      INT             NOT NULL DEFAULT 0,
  has_text_layer  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'any character text was extracted',
  ocr_needed      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'one or more pages had no usable text',
  status          ENUM('pending','processing','ingested','failed') NOT NULL DEFAULT 'pending',
  error           TEXT            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kb_documents_filename (filename),
  UNIQUE KEY uq_kb_documents_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kb_passages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  page_number INT             NOT NULL,
  section_ref VARCHAR(120)    NULL COMMENT 'legal reference like "SECTION 3" when detected',
  chunk_index INT             NOT NULL DEFAULT 0,
  content     TEXT            NOT NULL,
  token_count INT             NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kb_passages_doc (document_id, chunk_index),
  KEY idx_kb_passages_section (section_ref),
  CONSTRAINT fk_kb_passages_doc FOREIGN KEY (document_id) REFERENCES kb_documents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kb_embeddings (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  passage_id  BIGINT UNSIGNED NOT NULL,
  model       VARCHAR(120)    NOT NULL,
  dimensions  INT             NOT NULL,
  vector      JSON            NOT NULL COMMENT 'float array; moved to a dedicated vector store if needed',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kb_emb_passage_model (passage_id, model),
  KEY idx_kb_emb_model (model, dimensions),
  CONSTRAINT fk_kb_emb_passage FOREIGN KEY (passage_id) REFERENCES kb_passages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kb_ingest_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ingest_run  VARCHAR(64)     NULL,
  document_id BIGINT UNSIGNED NULL,
  level       ENUM('info','warn','error') NOT NULL DEFAULT 'info',
  page_number INT             NULL,
  message     TEXT            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kb_log_run (ingest_run),
  KEY idx_kb_log_doc (document_id),
  CONSTRAINT fk_kb_log_doc FOREIGN KEY (document_id) REFERENCES kb_documents (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;