import 'package:flutter/material.dart';

import '../data.dart';
import '../icons.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';
import 'flashcards_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key, this.api});

  final ApiService? api;

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  String _tag = 'All';
  String _query = '';

  List<StudySet> get _visible {
    final filtered = _tag == 'All' ? studySets : studySets.where((s) => s.tag == _tag);
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return filtered.toList();
    return filtered
        .where((s) =>
            s.title.toLowerCase().contains(q) ||
            s.description.toLowerCase().contains(q))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScroll(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppHeader(title: 'Library'),
          const Gap(4),
          Text('Explore study sets, each with review cards and progress.',
              style: ts(size: 14, color: RW.ink2)),
          const Gap(16),
          TextField(
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(
              hintText: 'Find a topic…',
              hintStyle: const TextStyle(color: RW.ink3),
              prefixIcon: const Padding(
                padding: EdgeInsets.all(12),
                child: RWIcon('search', size: 20, color: RW.ink3),
              ),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: RW.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: RW.blue, width: 1.6),
              ),
            ),
          ),
          const Gap(14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final tag in const ['All', 'Recent', 'Saved'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _filterChip(tag),
                  ),
              ],
            ),
          ),
          const Gap(14),
          for (final set in _visible)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _setCard(set),
            ),
          if (_visible.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: Column(
                children: [
                  const RWIcon('search', size: 40, color: RW.ink3),
                  const Gap(10),
                  Text('No study sets match.', style: ts(size: 15, color: RW.ink3)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _filterChip(String tag) {
    final active = _tag == tag;
    return InkWell(
      onTap: () => setState(() => _tag = tag),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? RW.blue : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? RW.blue : RW.border),
        ),
        child: Text(tag,
            style: ts(size: 13, color: active ? Colors.white : RW.ink2, weight: FontWeight.w600)),
      ),
    );
  }

  Widget _setCard(StudySet set) {
    final icon = _icon(set.icon);
    return Surface(
      padding: const EdgeInsets.all(16),
      onTap: () async {
        await Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => FlashcardsScreen(api: widget.api, initialDeck: set.title),
          ),
        );
      },
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: RW.tintBlue,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(child: RWIcon(icon, size: 26, color: RW.blue)),
          ),
          const Gap(14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(set.title,
                          style: ts(size: 16, weight: FontWeight.w700),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    if (set.tag.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: RW.tintYellow,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(set.tag, style: ts(size: 10.5, color: const Color(0xFF9A6B00), weight: FontWeight.w700)),
                      ),
                  ],
                ),
                const Gap(3),
                Text(set.description,
                    style: ts(size: 12.5, color: RW.ink2),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const Gap(9),
                Row(
                  children: [
                    Text('${set.cards} cards', style: ts(size: 12, color: RW.ink3)),
                    const Gap(10),
                    Expanded(
                      child: ProgressBar(value: set.progress / 100, height: 6),
                    ),
                    const Gap(10),
                    Text('${set.progress}%', style: ts(size: 12, weight: FontWeight.w700)),
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

  String _icon(String name) {
    switch (name) {
      case 'signal':
        return 'signal';
      case 'sign':
        return 'sign';
      case 'rules':
        return 'rules';
      case 'marking':
        return 'marking';
      case 'arrow':
        return 'arrow';
      default:
        return 'exam';
    }
  }
}