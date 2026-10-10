import 'package:flutter/material.dart';

import '../data.dart';
import '../icons.dart';
import '../models/lesson.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';
import 'flashcards_screen.dart';
import 'quiz_screens.dart';

/// The lesson quiz ids that exist in the seeded database, per lesson id.
const Map<int, int> lessonQuizzes = {1: 1, 2: 2};

String iconFor(String? icon) {
  switch (icon) {
    case 'signpost':
      return 'sign';
    case 'traffic':
      return 'rules';
    case 'merge':
      return 'arrow';
    case 'shield':
      return 'marking';
    case 'car':
      return 'settings';
    case 'gavel':
      return 'exam';
    default:
      return 'study';
  }
}

/// Study tab — live lesson list from the backend.
class LessonListScreen extends StatefulWidget {
  const LessonListScreen({super.key, this.api});

  final ApiService? api;

  @override
  State<LessonListScreen> createState() => _LessonListScreenState();
}

class _LessonListScreenState extends State<LessonListScreen> {
  late final ApiService _api = widget.api ?? ApiService();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Lesson>>(
      future: _api.fetchLessons(),
      builder: (context, snapshot) {
        return ScreenScroll(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppHeader(
                title: 'Study',
                leading: StatIcon(tone: Tone.blue, icon: 'study'),
                trailing: tutorialChip(snapshot),
              ),
              const Gap(4),
              Text('The LTO lessons, straight from the RoadWise backend.',
                  style: ts(size: 14, color: RW.ink2)),
              const Gap(16),
              ..._content(snapshot),
            ],
          ),
        );
      },
    );
  }

  Widget tutorialChip(AsyncSnapshot<List<Lesson>> snapshot) {
    final ready = snapshot.hasData && snapshot.data != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: ready ? RW.tintGreen : RW.tintYellow,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _dot(ready ? RW.signalGreen : RW.yellow),
          const Gap(6),
          Text(ready ? '${snapshot.data!.length} lessons' : 'Syncing…',
              style: ts(size: 12, weight: FontWeight.w700,
                  color: ready ? const Color(0xFF1D7A3A) : const Color(0xFF9A6B00))),
        ],
      ),
    );
  }

  Widget _dot(Color color) {
    return Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  }

  List<Widget> _content(AsyncSnapshot<List<Lesson>> snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const [
        Padding(
          padding: EdgeInsets.only(top: 60),
          child: Center(child: CircularProgressIndicator(strokeWidth: 3)),
        ),
      ];
    }
    if (snapshot.hasError) {
      return [
        Surface(
          padding: const EdgeInsets.all(20),
          color: RW.tintRed,
          borderColor: const Color(0xFFF5C6C3),
          child: Column(
            children: [
              const RWIcon('signal', size: 32, color: RW.red),
              const Gap(10),
              Text('Could not reach the backend.', style: ts(size: 15, weight: FontWeight.w700)),
              const Gap(4),
              Text('${snapshot.error}', style: ts(size: 12.5, color: RW.ink2), textAlign: TextAlign.center),
              const Gap(12),
              CapsuleButton(label: 'Retry', color: RW.red, onTap: () => setState(() {})),
            ],
          ),
        ),
      ];
    }
    final lessons = snapshot.data ?? const <Lesson>[];
    if (lessons.isEmpty) {
      return const [
        Text('No lessons yet.', style: TextStyle(fontSize: 14, color: RW.ink3)),
      ];
    }
    return [
      for (final lesson in lessons)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _lessonCard(lesson),
        ),
    ];
  }

  Widget _lessonCard(Lesson lesson) {
    return Surface(
      padding: const EdgeInsets.all(16),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => LessonDetailScreen(lesson: lesson, api: _api),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: RW.tintBlue,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(child: RWIcon(iconFor(lesson.icon), size: 26, color: RW.blue)),
          ),
          const Gap(14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lesson.title, style: ts(size: 16, weight: FontWeight.w700)),
                const Gap(3),
                if (lesson.description != null)
                  Text(lesson.description!,
                      style: ts(size: 12.5, color: RW.ink2),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                const Gap(8),
                Row(
                  children: [
                    Text(lesson.category, style: ts(size: 12, color: RW.ink3, weight: FontWeight.w600)),
                    const Gap(10),
                    TimePill(text: '${lesson.durationMin} min'),
                    const Gap(10),
                    Text('${lesson.sectionCount} sections', style: ts(size: 12, color: RW.ink3)),
                  ],
                ),
              ],
            ),
          ),
          const Gap(6),
          const RWIcon('chevron', size: 16, color: RW.ink3),
        ],
      ),
    );
  }
}

/// Full lesson view: sections, a flashcard review, and the lesson quiz.
class LessonDetailScreen extends StatelessWidget {
  const LessonDetailScreen({super.key, required this.lesson, this.api});

  final Lesson lesson;
  final ApiService? api;

  @override
  Widget build(BuildContext context) {
    final quizId = lessonQuizzes[lesson.id];
    return Scaffold(
      backgroundColor: RW.paper,
      appBar: AppBar(
        backgroundColor: RW.paper,
        foregroundColor: RW.ink,
        elevation: 0,
        title: Text(lesson.title, style: ts(size: 17, weight: FontWeight.w700)),
      ),
      body: ScreenScroll(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _lessonHero(lesson),
            const Gap(6),
            if (quizId != null)
              CapsuleButton(
                label: 'Take the lesson quiz',
                icon: 'exam',
                onTap: () => _openQuiz(context, quizId),
              ),
            const Gap(10),
            CapsuleButton(
              label: 'Review with flashcards',
              icon: 'cards',
              color: Colors.transparent,
              fg: RW.blue,
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => FlashcardsScreen(api: api)),
                );
              },
            ),
            const Gap(18),
            const SectionHeading(label: 'Lesson content'),
            for (var i = 0; i < lesson.sections.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _sectionCard(i, lesson.sections[i]),
              ),
            if (lesson.sections.isEmpty)
              const Text('No sections for this lesson yet.', style: TextStyle(color: RW.ink3)),
          ],
        ),
      ),
    );
  }

  Widget _lessonHero(Lesson lesson) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [RW.navy, Color(0xFF12325F)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(17),
            ),
            child: Center(child: RWIcon(iconFor(lesson.icon), size: 28, color: Colors.white)),
          ),
          const Gap(14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lesson.title, style: ts(size: 18, color: Colors.white, weight: FontWeight.w800)),
                const Gap(3),
                Text('${lesson.category} · ${lesson.sectionCount} sections',
                    style: ts(size: 12.5, color: const Color(0xB3FFFFFF))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionCard(int index, LessonSection section) {
    return Surface(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: RW.tintBlue, borderRadius: BorderRadius.circular(10)),
            child: Text('${index + 1}', style: ts(size: 14, color: RW.blue, weight: FontWeight.w800)),
          ),
          const Gap(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(section.heading, style: ts(size: 15.5, weight: FontWeight.w700)),
                const Gap(6),
                Text(section.body, style: ts(size: 13.5, color: RW.ink2, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openQuiz(BuildContext context, int quizId) async {
    final apiService = api ?? ApiService();
    try {
      final quiz = await apiService.fetchQuiz(quizId);
      if (!context.mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => QuizScreen(api: apiService, quiz: quiz),
        ),
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Could not load quiz: ${e.message}')));
    }
  }
}