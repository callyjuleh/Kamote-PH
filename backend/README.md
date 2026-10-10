# Backend reference material

## Add PDF sources for Dai

Place LTO reference PDFs in `data/traffic_pdfs`. From the `backend` directory, run:

```powershell
npm run kb:ingest
```

This extracts text, stores passages in MySQL, and creates local Ollama embeddings for search. Check a topic with:

```powershell
npm run kb:search -- "your driving question"
```

The ingestion report identifies pages with little or no extractable text; scanned pages need OCR before Dai can use their contents.

## Ground the learning modules in the traffic PDFs

Each lesson (module) in the app is filled from the same knowledge base that Ask Dai
uses, so the modules and the AI tutor share a single source of truth. Run:

```powershell
npm run kb:lessons
```

This retrieves the best-matching passage from `kb_passages` for every section of
each lesson, cleans the extracted text, and writes it to `lesson_sections` together
with `source_document` and `source_page`. Re-running it is idempotent (sections are
replaced). The section citations match the `(RO102 p.40)` style Dai uses.

Existing databases need the additive migration applied once:

```powershell
mysql --user=roadwise --password=roadwise_dev roadwise < src/database/migrations/2026-10-10-add-lesson-section-sources.sql
```

Fresh databases that load `database/schema.sql` already include the columns.

## Add the manual-based questionnaire set

Run the idempotent seed script after the quiz tables are set up:

```powershell
npm run quiz:seed-manuals
```

It adds source-grounded questions to the existing signs, traffic-rules, and mock-exam quizzes without duplicating questions on later runs. The answer explanations cite the PDF page and edition used.
