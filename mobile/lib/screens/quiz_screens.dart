import 'dart:async';

import 'package:flutter/material.dart';

import '../icons.dart';
import '../models/quiz.dart' as model;
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';

/// A graded answer from the submit response, used for the review list.
class GradedAnswer {
  const GradedAnswer({
    required this.prompt,
    this.options = const [],
    this.optionId,
    this.correctOptionId,
    this.isCorrect = false,
    this.explanation,
  });

  final String prompt;
  final List<model.QuizOption> options;
  final int? optionId;
  final int? correctOptionId;
  final bool isCorrect;
  final String? explanation;
}

class QuizScreen extends StatefulWidget {
  const QuizScreen({
    super.key,
    required this.api,
    required this.quiz,
    this.backLabel = 'Exit',
  });

  final ApiService api;
  final model.Quiz quiz;
  final String backLabel;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<model.Question> get _questions => widget.quiz.questions;

  late final List<int?> _selections =
      List<int?>.filled(_questions.length, null);

  int _index = 0;
  int? _attemptId;
  bool _starting = true;
  String? _startError;
  bool _submitting = false;
  bool _finished = false;

  Timer? _timer;
  int _remaining = 0;
  bool _paused = false;

  bool get _hasTimer {
    final limit = widget.quiz.timeLimit;
    return limit != null && limit > 0;
  }

  bool get _last => _index == _questions.length - 1;

  @override
  void initState() {
    super.initState();
    _startSession();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _timer = null;
    super.dispose();
  }

  Future<void> _startSession() async {
    if (_questions.isEmpty) {
      setState(() {
        _starting = false;
        _startError = 'This quiz has no questions yet.';
      });
      return;
    }
    setState(() {
      _starting = true;
      _startError = null;
    });
    try {
      final session = await widget.api.startQuizSession(widget.quiz.id);
      if (!mounted) return;
      setState(() {
        _attemptId = session.attemptId;
        _index = session.currentIndex.clamp(0, _questions.length - 1);
        for (final answer in session.answers) {
          final qIndex = _indexOfQuestion(answer.questionId);
          if (qIndex == null) continue;
          final optionIndex = _optionIndexOf(qIndex, answer.optionId);
          if (optionIndex != null) _selections[qIndex] = optionIndex;
        }
        _starting = false;
      });
      _startTimer();
      if (session.resumed && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Resuming your saved answers.')),
        );
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _starting = false;
        _startError = e.message;
      });
    }
  }

  int? _indexOfQuestion(int questionId) {
    for (var i = 0; i < _questions.length; i++) {
      if (_questions[i].id == questionId) return i;
    }
    return null;
  }

  int? _optionIndexOf(int qIndex, int? optionId) {
    if (optionId == null) return null;
    final options = _questions[qIndex].options;
    for (var i = 0; i < options.length; i++) {
      if (options[i].id == optionId) return i;
    }
    return null;
  }

  int? _optionIdAt(int qIndex) {
    final selection = _selections[qIndex];
    if (selection == null) return null;
    final options = _questions[qIndex].options;
    if (selection < 0 || selection >= options.length) return null;
    return options[selection].id;
  }

  List<model.QuizAnswer> _answersForSubmit() => [
        for (var i = 0; i < _questions.length; i++)
          model.QuizAnswer(questionId: _questions[i].id, optionId: _optionIdAt(i)),
      ];

  List<model.QuizAnswer> _answersAnswered() => [
        for (var i = 0; i < _questions.length; i++)
          if (_selections[i] != null)
            model.QuizAnswer(questionId: _questions[i].id, optionId: _optionIdAt(i)),
      ];

  void _startTimer() {
    if (_timer != null || !_hasTimer) return;
    _remaining = widget.quiz.timeLimit!;
    _paused = false;
    _timer = Timer.periodic(const Duration(seconds: 1), _tick);
  }

  void _tick(Timer timer) {
    if (_paused || _finished) return;
    setState(() => _remaining -= 1);
    if (_remaining <= 0) {
      timer.cancel();
      _timer = null;
      _autoSubmit();
    }
  }

  void _togglePause() {
    if (!_hasTimer || _finished) return;
    setState(() => _paused = !_paused);
  }

  void _save() {
    final attemptId = _attemptId;
    if (attemptId == null || _finished) return;
    widget.api
        .saveQuizSession(widget.quiz.id, attemptId, _answersAnswered(), _index)
        .catchError((Object e) => debugPrint('Could not save quiz progress: $e'));
  }

  void _choose(int i) {
    if (_selections[_index] == i) return;
    setState(() => _selections[_index] = i);
    _save();
  }

  void _goTo(int index) {
    if (index < 0 || index >= _questions.length) return;
    setState(() => _index = index);
    _save();
  }

  Future<void> _next() async {
    if (_last) {
      await _submit();
    } else {
      _goTo(_index + 1);
    }
  }

  Future<void> _autoSubmit() async {
    if (_finished || _submitting) return;
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Time's up — submitting your answers.")),
    );
    await _submit();
  }

  Future<void> _submit() async {
    if (_finished || _submitting) return;
    final attemptId = _attemptId;
    if (attemptId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('The quiz session is not ready yet.')),
      );
      return;
    }
    _timer?.cancel();
    _timer = null;
    setState(() => _submitting = true);

    try {
      final result = await widget.api.submitQuizSession(
        widget.quiz.id,
        attemptId,
        _answersForSubmit(),
      );
      if (!mounted) return;
      _finished = true;
      final review = _parseGraded(result);
      final earned = result['earnedAchievements'] is List
          ? (result['earnedAchievements'] as List).whereType<String>().toList()
          : const <String>[];
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => QuizResultsScreen(
            title: widget.quiz.title,
            percent: _asInt(result['percent']),
            correct: review.where((g) => g.isCorrect).length,
            total: _asInt(result['totalPoints']),
            score: _asInt(result['score']),
            passed: result['passed'] == true,
            earned: earned,
            review: review,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not submit: ${e.message}')),
      );
    }
  }

  List<GradedAnswer> _parseGraded(Map<String, dynamic> result) {
    final raw = result['answers'];
    if (raw is! List) return const [];
    return raw.whereType<Map<String, dynamic>>().map((m) {
      final options = m['options'] is List
          ? (m['options'] as List)
              .whereType<Map<String, dynamic>>()
              .map(model.QuizOption.fromJson)
              .toList()
          : const <model.QuizOption>[];
      return GradedAnswer(
        prompt: (m['prompt'] ?? '') as String,
        options: options,
        optionId: m['optionId'] == null ? null : _asInt(m['optionId']),
        correctOptionId:
            m['correctOptionId'] == null ? null : _asInt(m['correctOptionId']),
        isCorrect: m['isCorrect'] == true,
        explanation: m['explanation'] as String?,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_starting) {
      return Scaffold(
        backgroundColor: RW.paper,
        appBar: AppBar(
          backgroundColor: RW.paper,
          foregroundColor: RW.ink,
          elevation: 0,
          title: Text(widget.quiz.title, style: ts(size: 17, weight: FontWeight.w700)),
        ),
        body: const Center(child: CircularProgressIndicator(strokeWidth: 3)),
      );
    }
    if (_startError != null) {
      return Scaffold(
        backgroundColor: RW.paper,
        appBar: AppBar(
          backgroundColor: RW.paper,
          foregroundColor: RW.ink,
          elevation: 0,
          title: Text(widget.quiz.title, style: ts(size: 17, weight: FontWeight.w700)),
        ),
        body: ScreenScroll(
          child: Surface(
            padding: const EdgeInsets.all(20),
            color: RW.tintRed,
            borderColor: const Color(0xFFF5C6C3),
            child: Column(
              children: [
                const RWIcon('exam', size: 32, color: RW.red),
                const Gap(10),
                Text('Could not start the quiz.', style: ts(size: 15, weight: FontWeight.w700)),
                const Gap(4),
                Text(_startError!, style: ts(size: 12.5, color: RW.ink2), textAlign: TextAlign.center),
                const Gap(12),
                CapsuleButton(label: 'Retry', color: RW.red, onTap: _startSession),
              ],
            ),
          ),
        ),
      );
    }

    final question = _questions[_index];
    final selected = _selections[_index];
    return Scaffold(
      backgroundColor: RW.paper,
      appBar: AppBar(
        backgroundColor: RW.paper,
        foregroundColor: RW.ink,
        elevation: 0,
        title: Text(widget.quiz.title, style: ts(size: 17, weight: FontWeight.w700)),
        actions: [_timerControl()],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(30),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text('Question ${_index + 1} of ${_questions.length}',
                    style: ts(size: 12, color: RW.ink3)),
                const Gap(10),
                Expanded(
                  child: ProgressBar(
                    value: (_index + 1) / _questions.length,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
        children: [
          Text(question.prompt,
              style: ts(size: 22, weight: FontWeight.w700, height: 1.25)),
          const Gap(22),
          for (var i = 0; i < question.options.length; i++)
            _optionTile(question, i, selected),
        ],
      ),
      bottomNavigationBar: ActionBar(
        child: Row(
          children: [
            if (_index > 0) ...[
              Expanded(
                child: CapsuleButton(
                  label: 'Back',
                  icon: 'back',
                  color: Colors.transparent,
                  fg: RW.blue,
                  onTap: _submitting ? null : () => _goTo(_index - 1),
                ),
              ),
              const Gap(10),
            ],
            Expanded(
              child: CapsuleButton(
                label: _submitting
                    ? 'Grading…'
                    : (_last ? 'Submit' : 'Next'),
                icon: _last ? 'check' : 'chevron',
                onTap: _submitting || selected == null ? null : _next,
                color: selected == null || _submitting
                    ? RW.border.withValues(alpha: 0.6)
                    : RW.blue,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timerControl() {
    if (!_hasTimer) return const SizedBox.shrink();
    final minutes = (_remaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (_remaining % 60).toString().padLeft(2, '0');
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Row(
        children: [
          const RWIcon('clock', size: 15, color: RW.ink2),
          const Gap(5),
          Text('$minutes:$seconds', style: ts(size: 14, weight: FontWeight.w700)),
          const Gap(6),
          GestureDetector(
            onTap: _togglePause,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: RW.tintBlue,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(_paused ? 'Resume' : 'Pause',
                  style: ts(size: 12, color: RW.blue, weight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _optionTile(model.Question question, int i, int? selected) {
    final isSelected = selected == i;
    final borderColor = isSelected ? RW.blue : RW.border;
    final bg = isSelected ? RW.tintBlue : Colors.white;
    return GestureDetector(
      onTap: _submitting ? null : () => _choose(i),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: isSelected ? 1.6 : 1),
        ),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? RW.blue : Colors.white,
                borderRadius: BorderRadius.circular(9),
                border: Border.all(color: isSelected ? RW.blue : RW.border),
              ),
              child: Text(_letter(i),
                  style: ts(size: 14, color: isSelected ? Colors.white : RW.ink2)),
            ),
            const Gap(12),
            Expanded(
              child: Text(question.options[i].body, style: ts(size: 16)),
            ),
          ],
        ),
      ),
    );
  }

  String _letter(int index) => String.fromCharCode(65 + index);
}

class QuizResultsScreen extends StatelessWidget {
  const QuizResultsScreen({
    super.key,
    required this.title,
    required this.percent,
    required this.correct,
    required this.total,
    required this.score,
    required this.passed,
    this.earned = const [],
    this.review = const [],
  });

  final String title;
  final int percent;
  final int correct;
  final int total;
  final int score;
  final bool passed;
  final List<String> earned;
  final List<GradedAnswer> review;

  @override
  Widget build(BuildContext context) {
    final color = passed ? RW.signalGreen : RW.red;
    return Scaffold(
      backgroundColor: RW.paper,
      appBar: AppBar(
        backgroundColor: RW.paper,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text('Results', style: ts(size: 17, weight: FontWeight.w700)),
      ),
      body: ScreenScroll(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Gap(16),
            Surface(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  ConicRing(
                    value: percent / 100,
                    size: 150,
                    thickness: 16,
                    color: color,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('$percent%',
                            style: ts(size: 40, weight: FontWeight.w800, color: color)),
                        Text(passed ? 'Passed' : 'Keep going',
                            style: ts(size: 13, color: RW.ink3)),
                      ],
                    ),
                  ),
                  const Gap(20),
                  Text(passed ? 'Nice work!' : 'Almost there!',
                      style: ts(size: 20, weight: FontWeight.w800)),
                  const Gap(8),
                  Text(
                    'You answered $correct of $total correctly.'
                    ' ${passed ? 'Reviewing the ones you missed will lock it in.' : 'Review the material, then try again.'}',
                    style: ts(size: 14.5, color: RW.ink2, height: 1.4),
                    textAlign: TextAlign.center,
                  ),
                  const Gap(20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _resultStat(color, '$percent%', 'Score'),
                      _resultStat(color, '$correct/$total', 'Correct'),
                      _resultStat(color, passed ? 'Passed' : 'Retake', 'Verdict'),
                    ],
                  ),
                ],
              ),
            ),
            if (earned.isNotEmpty) ...[
              const SectionHeading(label: 'New achievements'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [for (final code in earned) _achievementChip(code)],
              ),
            ],
            if (review.isNotEmpty) ...[
              const SectionHeading(label: 'Review'),
              for (final answer in review) _reviewCard(answer),
            ],
            const Gap(20),
            CapsuleButton(
              label: 'Back to study',
              icon: 'back',
              onTap: () => Navigator.of(context).popUntil((r) => r.isFirst),
            ),
          ],
        ),
      ),
    );
  }

  Widget _achievementChip(String code) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: RW.tintYellow,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const RWIcon('check', size: 14, color: Color(0xFF9A6B00)),
          const Gap(6),
          Text(code.replaceAll('_', ' '),
              style: ts(size: 12.5, color: const Color(0xFF9A6B00), weight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _reviewCard(GradedAnswer answer) {
    final color = answer.isCorrect ? RW.signalGreen : RW.red;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Surface(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                RWIcon(answer.isCorrect ? 'check' : 'close', size: 16, color: color),
                const Gap(8),
                Expanded(
                  child: Text(answer.prompt,
                      style: ts(size: 15, weight: FontWeight.w700, height: 1.3)),
                ),
              ],
            ),
            const Gap(12),
            for (var i = 0; i < answer.options.length; i++)
              _reviewOption(i, answer),
            if (answer.explanation != null && answer.explanation!.isNotEmpty) ...[
              const Gap(10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: RW.tintBlue,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(answer.explanation!,
                    style: ts(size: 13, color: RW.ink2, height: 1.4)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _reviewOption(int index, GradedAnswer answer) {
    final option = answer.options[index];
    final isCorrect = option.id == answer.correctOptionId;
    final isMine = option.id == answer.optionId;
    var color = RW.ink2;
    var marker = '';
    if (isCorrect) {
      color = const Color(0xFF1D7A3A);
      marker = 'Correct';
    } else if (isMine) {
      color = RW.red;
      marker = 'Your answer';
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text('${String.fromCharCode(65 + index)}.',
              style: ts(size: 13.5, color: color, weight: FontWeight.w700)),
          const Gap(8),
          Expanded(child: Text(option.body, style: ts(size: 13.5, color: color))),
          if (marker.isNotEmpty)
            Text(marker, style: ts(size: 11, color: color, weight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _resultStat(Color color, String value, String label) {
    return Column(
      children: [
        Text(value, style: ts(size: 18, weight: FontWeight.w800, color: color)),
        Text(label, style: ts(size: 12, color: RW.ink3)),
      ],
    );
  }
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
