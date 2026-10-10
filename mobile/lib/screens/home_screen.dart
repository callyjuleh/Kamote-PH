import 'package:flutter/material.dart';

import '../data.dart';
import '../icons.dart';
import '../nav.dart';
import '../road_backdrop.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';
import 'flashcards_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.navigate,
    this.api,
    this.userName = 'driver',
  });

  final Navigate navigate;
  final ApiService? api;
  final String userName;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(child: ColoredBox(color: RW.paper)),
        SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _hero(context),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: AiEntry(onTap: () => navigate(AppScreen.ai)),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionHeading(
                      label: 'Overview',
                      action: TextLink(label: 'View all'),
                    ),
                    _statsGrid(),
                    const SectionHeading(
                      label: 'This week',
                      action: TextLink(label: 'Full chart', onTap: null),
                    ),
                    GoalChart(value: 142, bars: week),
                    const SectionHeading(label: 'Continue your lesson'),
                    _lessonUnits(context),
                    const SectionHeading(label: 'Topics to polish'),
                    _topicList(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _hero(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
      child: SizedBox(
        height: 240,
        child: Stack(
          children: [
            const Positioned.fill(child: RoadBackdrop()),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text('$_greeting, $userName',
                              style: ts(size: 16, color: const Color(0xB3FFFFFF), weight: FontWeight.w600)),
                        ),
                        RoundIconButton(
                          icon: 'bell',
                          onTap: () {},
                          bg: const Color(0x33FFFFFF),
                          fg: Colors.white,
                        ),
                        const Gap(10),
                        RoundIconButton(
                          icon: 'user',
                          onTap: () => navigate(AppScreen.profile),
                          bg: const Color(0x33FFFFFF),
                          fg: Colors.white,
                        ),
                      ],
                    ),
                    const Gap(18),
                    Text('Ready for a\nquick review?',
                        style: display().copyWith(fontSize: 30)),
                    const Gap(8),
                    Text('Repetition is how road rules stick.',
                        style: ts(size: 14, color: const Color(0xB3FFFFFF))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statsGrid() {
    return Row(
      children: [
        for (var i = 0; i < statTiles.length; i += 2)
          Expanded(
            child: Column(
              children: [
                _statTile(statTiles[i]),
                if (i + 1 < statTiles.length) const Gap(12),
                if (i + 1 < statTiles.length) _statTile(statTiles[i + 1]),
              ],
            ),
          ),
      ],
    );
  }

  Widget _statTile(StatTile stat) {
    return Padding(
      padding: EdgeInsets.only(right: statTiles.indexOf(stat).isEven ? 6 : 0, left: statTiles.indexOf(stat).isEven ? 0 : 6),
      child: Surface(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            StatIcon(tone: stat.tone, icon: stat.icon, size: 38),
            const Gap(10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(TextSpan(
                    text: stat.value,
                    style: ts(size: 17, weight: FontWeight.w800),
                    children: [
                      TextSpan(
                        text: ' ${stat.unit}'.trimRight(),
                        style: ts(size: 11, color: RW.ink3),
                      ),
                    ],
                  )),
                  const Gap(1),
                  Text(stat.label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: ts(size: 11.5, color: RW.ink2, height: 1.25)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _lessonUnits(BuildContext context) {
    return Column(
      children: [
        for (final unit in lessonUnits)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Surface(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => FlashcardsScreen(api: api),
                ),
              ),
              child: Row(
                children: [
                  SignalProgress(value: _unitValue(unit.status)),
                  const Gap(12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(unit.title, style: ts(size: 15, weight: FontWeight.w600)),
                        const Gap(2),
                        Text(unit.meta, style: ts(size: 12, color: RW.ink3)),
                      ],
                    ),
                  ),
                  RWIcon('chevron', size: 16, color: RW.ink3),
                ],
              ),
            ),
          ),
      ],
    );
  }

  double _unitValue(UnitStatus status) {
    switch (status) {
      case UnitStatus.done:
        return 1;
      case UnitStatus.current:
        return 0.45;
      case UnitStatus.next:
        return 0;
    }
  }

  Widget _topicList() {
    return Column(
      children: [
        for (final topic in topicStats)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Surface(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              child: Row(
                children: [
                  StatIcon(tone: topic.tone, icon: 'sign', size: 36),
                  const Gap(12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(topic.label, style: ts(size: 15, weight: FontWeight.w600)),
                            Text('${topic.total} answered',
                                style: ts(size: 12, color: RW.ink3)),
                          ],
                        ),
                        const Gap(8),
                        ProgressBar(value: topic.accuracy / 100),
                      ],
                    ),
                  ),
                  const Gap(12),
                  Text('${topic.accuracy}%', style: ts(size: 14, weight: FontWeight.w800)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}