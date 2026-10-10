# RoadWise PH — Flutter Frontend Rebuild Task

Run this with a **vision-capable model** (e.g. Claude Sonnet/Opus, GPT-4o, Gemini
vision). The previous model (big-pickle) has no image input, so it could not see
the Figma screenshots. A vision model can complete this task end-to-end.

## Project context

- **App**: RoadWise PH — a Philippine road-safety / driving-theory learning app.
- **Frontend**: Flutter application at `mobile/`. Package/import name is `kamote` — do not rename.
- **Backend**: Express 5 + MySQL running at `http://localhost:4000/api`.
- **Design source of truth**: the 13 PNG screenshots in `designs/`.
  These define the look, colors, typography, layout, and the screen-to-screen flow.
- **AI/Ollama**: exists in the backend but is out of scope for this task. Do not implement AI on the frontend.

## Verified API endpoints (already wired in `mobile/`)

- `GET /api/lessons` — list of published lessons
- `GET /api/lessons/:id` — lesson detail incl. `sections`
- `GET /api/quizzes/:id` — quiz with `questions` and `options`
- `POST /api/quizzes/:id/submit` — graded submission
- `GET|PUT /api/progress/:userId/:lessonId` — user progress

Base URL logic lives in `mobile/lib/config/api_config.dart`
(Android emulator `10.0.2.2`, desktop `localhost`, `--dart-define=API_BASE_URL=...` override).

## Existing `mobile/lib/` (working, passing `flutter analyze`)

- `config/api_config.dart`
- `models/lesson.dart` (Lesson, LessonSection), `models/quiz.dart` (Quiz, Question, QuizOption)
- `services/api_service.dart` (fetchLessons, fetchLesson, fetchQuiz)
- `screens/lessons_screen.dart`, `screens/lesson_detail_screen.dart`
- `main.dart` — shell app (Material 3, green seed, home = LessonsScreen)

## Instructions

1. Open every image in `designs/` (PNG/JPG/JPEG/WEBP). Determine the screen
   sequence from the images and visible navigation flow.
2. Identify shared components, colors, typography, spacing, cards, buttons,
   navigation, illustrations across all screens.
3. Audit `mobile/` (lib/screens, widgets, models, services, theme, utils, pubspec)
   and the backend endpoints before editing.
4. Rebuild the UI to match the screenshots as closely as practical. Do not invent
   screens or styling the references don't show.
5. Keep the existing API integration, models, and working code. Populate
   data-driven screens from the real API; do not hardcode lesson/quiz/progress data.
6. Copy design assets from `designs/` into `mobile/assets/` only when needed and
   update `pubspec.yaml` accordingly.
7. Make buttons/interactive elements functional; implement the navigation the
   designs show or imply.
8. Preserve loading/empty/error states; don't degrade existing functionality.
9. Do not implement Ollama/new backend features.

## Verify before finishing

1. `flutter pub get` (in `mobile/`)
2. `flutter analyze` (in `mobile/`) — must be clean
3. `flutter test` (in `mobile/`) — must pass
4. Run on Windows desktop or Android emulator; visually compare each screen
   against the Figma references and fix obvious differences.
5. Confirm lessons API + lesson details still work and navigation flows.

## Final report to the user

- Which screenshots were found/inspected and the screen order identified
- Which screens were implemented
- Files created/modified
- Whether the app visually matches the references
- Whether `flutter analyze`/`flutter test` pass
- Remaining differences or blockers