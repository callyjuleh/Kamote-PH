import 'package:flutter/material.dart';

import '../data.dart';
import '../icons.dart';
import '../models/app_user.dart';
import '../services/api_service.dart';
import '../session.dart';
import '../theme.dart';
import '../widgets.dart';

class _ProgressData {
  const _ProgressData({
    required this.dailyGoal,
    required this.stats,
    required this.goals,
    required this.achievements,
    required this.consent,
  });

  final int dailyGoal;
  final Map<String, dynamic> stats;
  final List<Map<String, dynamic>> goals;
  final List<Map<String, dynamic>> achievements;
  final Map<String, dynamic> consent;
}

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key, required this.api, this.user, this.session});

  final ApiService api;
  final AppUser? user;
  final SessionController? session;

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  late Future<_ProgressData> _future = _load();

  Future<_ProgressData> _load() async {
    final goalsBody = await widget.api.fetchGoals();
    final achievements = await widget.api.fetchAchievements();
    final consent = await widget.api.fetchConsent();
    final stats = goalsBody['stats'];
    final rawGoals = goalsBody['goals'];
    return _ProgressData(
      dailyGoal: _asInt(goalsBody['dailyGoal']),
      stats: stats is Map<String, dynamic> ? stats : const {},
      goals: rawGoals is List
          ? rawGoals.whereType<Map<String, dynamic>>().toList()
          : const [],
      achievements: achievements,
      consent: consent,
    );
  }

  void _retry() => setState(() => _future = _load());

  Future<void> _acceptConsent(String type) async {
    try {
      final user = await widget.api.postConsent(type);
      widget.session?.updateUser(user);
      if (!mounted) return;
      setState(() => _future = _load());
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Consent saved.')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save consent: ${e.message}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScroll(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AppHeader(
            title: 'Progress',
            leading: StatIcon(tone: Tone.yellow, icon: 'flame'),
          ),
          const Gap(4),
          Text(
            '${widget.user?.email ?? 'guest'} · synced with your local backend.',
            style: ts(size: 13.5, color: RW.ink2),
          ),
          const Gap(16),
          FutureBuilder<_ProgressData>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 3)),
                );
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return _errorCard('Could not load your progress from the backend.', _retry);
              }
              final data = snapshot.data!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _dailyGoal(data),
                  const Gap(14),
                  _statGrid(data.stats),
                  const SectionHeading(label: 'Goals'),
                  ..._goals(data),
                  const SectionHeading(label: 'Achievements'),
                  ..._achievements(data.achievements),
                  const SectionHeading(label: 'Privacy & consent'),
                  ..._consentRows(data.consent),
                ],
              );
            },
          ),
          const SectionHeading(
            label: 'Lesson status',
            action: TextLink(label: 'Synced', withChevron: false),
          ),
          FutureBuilder<List<dynamic>>(
            future: widget.api.fetchProgress(widget.user?.id ?? 0),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.only(top: 30),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 3)),
                );
              }
              if (snapshot.hasError || !snapshot.hasData) {
                return _errorCard('Could not load lesson progress.', _retry);
              }
              final rows = snapshot.data!.whereType<Map<String, dynamic>>().toList();
              if (rows.isEmpty) {
                return Text('No lessons started yet.',
                    style: ts(size: 14, color: RW.ink3));
              }
              return Column(
                children: [for (final row in rows) _lessonRow(row)],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _errorCard(String message, VoidCallback onRetry) {
    return Surface(
      padding: const EdgeInsets.all(18),
      color: RW.tintRed,
      borderColor: const Color(0xFFF5C6C3),
      child: Column(
        children: [
          Text(message, style: ts(size: 14, color: RW.ink2), textAlign: TextAlign.center),
          const Gap(10),
          CapsuleButton(label: 'Retry', color: RW.red, onTap: onRetry),
        ],
      ),
    );
  }

  Widget _dailyGoal(_ProgressData data) {
    final reviewed = _asInt(data.stats['cardsReviewed']);
    final goal = data.dailyGoal <= 0 ? 1 : data.dailyGoal;
    final value = (reviewed / goal).clamp(0.0, 1.0);
    return Surface(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          ConicRing(
            value: value,
            size: 104,
            thickness: 12,
            color: RW.blue,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('$reviewed', style: ts(size: 26, weight: FontWeight.w800)),
                Text('cards', style: ts(size: 11, color: RW.ink3)),
              ],
            ),
          ),
          const Gap(18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Daily goal', style: ts(size: 16, weight: FontWeight.w700)),
                const Gap(2),
                Text('Target · ${data.dailyGoal} cards',
                    style: ts(size: 12, color: RW.ink3)),
                const Gap(14),
                ProgressBar(value: value, height: 8),
                const Gap(8),
                Text('$reviewed of ${data.dailyGoal} reviewed today',
                    style: ts(size: 12.5, color: RW.ink2)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statGrid(Map<String, dynamic> stats) {
    final tiles = <Widget>[
      _statTile(Tone.blue, 'check', _asInt(stats['cardsReviewed']), 'cards', 'Cards reviewed'),
      _statTile(Tone.sky, 'exam', _asInt(stats['quizzesTaken']), 'quizzes', 'Quizzes taken'),
      _statTile(Tone.yellow, 'study', _asInt(stats['lessonsCompleted']), 'lessons', 'Lessons completed'),
      _statTile(Tone.red, 'flame', _asInt(stats['streak']), 'days', 'Study streak'),
    ];
    return Column(
      children: [
        for (var i = 0; i < tiles.length; i += 2)
          Padding(
            padding: EdgeInsets.only(bottom: i + 2 < tiles.length ? 12 : 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: tiles[i]),
                const Gap(12),
                Expanded(child: tiles[i + 1]),
              ],
            ),
          ),
      ],
    );
  }

  Widget _statTile(Tone tone, String icon, int value, String unit, String label) {
    return Surface(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          StatIcon(tone: tone, icon: icon, size: 38),
          const Gap(10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(TextSpan(
                  text: '$value',
                  style: ts(size: 17, weight: FontWeight.w800),
                  children: [
                    TextSpan(text: ' $unit'.trimRight(), style: ts(size: 11, color: RW.ink3)),
                  ],
                )),
                const Gap(1),
                Text(label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: ts(size: 11.5, color: RW.ink2, height: 1.25)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _goals(_ProgressData data) {
    if (data.goals.isEmpty) {
      return [Text('No goals yet.', style: ts(size: 14, color: RW.ink3))];
    }
    return [
      for (final goal in data.goals)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Surface(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            child: Row(
              children: [
                StatIcon(
                  tone: goal['done'] == true ? Tone.blue : Tone.yellow,
                  icon: goal['done'] == true ? 'check' : 'clock',
                  size: 34,
                ),
                const Gap(12),
                Expanded(
                  child: Text((goal['label'] ?? 'Goal') as String,
                      style: ts(size: 14.5, weight: FontWeight.w600)),
                ),
                if (goal['done'] == true)
                  Text('Done',
                      style: ts(size: 12.5, color: RW.signalGreen, weight: FontWeight.w700))
                else
                  Text('${_asInt(goal['current'])}/${_asInt(goal['target'])}',
                      style: ts(size: 12.5, color: RW.ink3, weight: FontWeight.w600)),
              ],
            ),
          ),
        ),
    ];
  }

  List<Widget> _achievements(List<Map<String, dynamic>> achievements) {
    if (achievements.isEmpty) {
      return [Text('No achievements yet.', style: ts(size: 14, color: RW.ink3))];
    }
    return [
      for (final achievement in achievements)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _achievementRow(achievement),
        ),
    ];
  }

  Widget _achievementRow(Map<String, dynamic> achievement) {
    final earned = achievement['earned'] == true;
    final code = (achievement['code'] ?? '') as String;
    final title = (achievement['title'] ?? 'Achievement') as String;
    final description = (achievement['description'] ?? '') as String;
    return Surface(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: earned ? RW.tintYellow : RW.paper,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: RWIcon(
                _achievementIcon(code),
                size: 21,
                color: earned ? const Color(0xFF9A6B00) : RW.ink3,
              ),
            ),
          ),
          const Gap(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: ts(size: 14.5, weight: FontWeight.w700)),
                const Gap(2),
                Text(description,
                    style: ts(size: 12, color: RW.ink3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const Gap(8),
          Text(earned ? 'Earned' : 'Locked',
              style: ts(
                size: 11.5,
                weight: FontWeight.w700,
                color: earned ? RW.signalGreen : RW.ink3,
              )),
        ],
      ),
    );
  }

  String _achievementIcon(String code) {
    switch (code) {
      case 'first_quiz':
      case 'quiz_ace':
        return 'exam';
      case 'perfect_score':
        return 'check';
      case 'first_lesson':
        return 'study';
      case 'flashcard_10':
        return 'cards';
      case 'seven_day_streak':
        return 'flame';
      case 'verified_driver':
        return 'sign';
      default:
        return 'check';
    }
  }

  List<Widget> _consentRows(Map<String, dynamic> consent) {
    return [
      _consentRow('Privacy Policy', consent['privacy'], 'privacy'),
      const Gap(10),
      _consentRow('Terms of Use', consent['terms'], 'terms'),
    ];
  }

  Widget _consentRow(String label, Object? entry, String type) {
    final map = entry is Map<String, dynamic> ? entry : const <String, dynamic>{};
    final accepted = map['acceptedAt'] != null;
    return Surface(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: ts(size: 14.5, weight: FontWeight.w600)),
                const Gap(2),
                Text(accepted ? 'Accepted' : 'Not accepted yet',
                    style: ts(size: 12, color: accepted ? RW.signalGreen : RW.ink3)),
              ],
            ),
          ),
          if (!accepted)
            CapsuleButton(
              label: 'Accept',
              expand: false,
              color: RW.blue,
              onTap: () => _acceptConsent(type),
            )
          else
            const RWIcon('check', size: 18, color: RW.signalGreen),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed':
        return RW.signalGreen;
      case 'in_progress':
        return RW.yellow;
      default:
        return RW.ink3;
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'completed':
        return RW.tintGreen;
      case 'in_progress':
        return RW.tintYellow;
      default:
        return RW.paper;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In progress';
      default:
        return 'Not started';
    }
  }

  Widget _lessonRow(Map<String, dynamic> row) {
    final title = (row['title'] ?? 'Lesson') as String;
    final status = (row['status'] ?? 'not_started') as String;
    final minutes = row['duration_min'] ?? 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Surface(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: ts(size: 15, weight: FontWeight.w600)),
                  const Gap(3),
                  Text('$minutes min', style: ts(size: 12, color: RW.ink3)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _statusBg(status),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(_statusLabel(status),
                  style: ts(size: 11.5, color: _statusColor(status), weight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
