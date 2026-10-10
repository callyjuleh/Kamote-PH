import 'package:flutter/material.dart';

import '../icons.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';

class _FlashDeck {
  const _FlashDeck({
    required this.deck,
    required this.category,
    required this.icon,
    required this.total,
  });

  final String deck;
  final String category;
  final String icon;
  final int total;

  factory _FlashDeck.fromJson(Map<String, dynamic> json) => _FlashDeck(
        deck: (json['deck'] ?? '') as String,
        category: (json['category'] ?? '') as String,
        icon: (json['icon'] ?? 'cards') as String,
        total: _asInt(json['total']),
      );
}

class _FlashCard {
  const _FlashCard({
    required this.id,
    required this.deck,
    required this.front,
    required this.back,
  });

  final int id;
  final String deck;
  final String front;
  final String back;

  factory _FlashCard.fromJson(Map<String, dynamic> json) => _FlashCard(
        id: _asInt(json['id']),
        deck: (json['deck'] ?? '') as String,
        front: (json['front'] ?? '') as String,
        back: (json['back'] ?? '') as String,
      );
}

/// Card review backed by the shared flashcard decks, with resumable progress.
class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({super.key, this.api, this.initialDeck});

  final ApiService? api;
  final String? initialDeck;

  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> {
  late final ApiService _api = widget.api ?? ApiService();
  late final bool _ownsApi = widget.api == null;

  List<_FlashDeck> _decks = const [];
  List<_FlashCard> _cards = const [];
  final Map<String, int> _savedIndex = {};

  String? _deck;
  int _index = 0;
  bool _flipped = false;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    if (_ownsApi) _api.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final decks = (await _api.fetchDecks()).map(_FlashDeck.fromJson).toList();
      final progress = await _loadProgress();
      if (!mounted) return;
      setState(() {
        _decks = decks;
        _savedIndex
          ..clear()
          ..addAll(progress);
        _deck = _resolveDeck(decks);
        _loading = false;
      });
      if (_deck != null) await _loadCards(_deck!);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    }
  }

  Future<Map<String, int>> _loadProgress() async {
    try {
      final rows = await _api.fetchFlashcardProgress();
      final map = <String, int>{};
      for (final row in rows) {
        final deck = row['deck'];
        if (deck is String) map[deck] = _asInt(row['currentIndex']);
      }
      return map;
    } catch (e) {
      debugPrint('Flashcard progress unavailable: $e');
      return const {};
    }
  }

  String? _resolveDeck(List<_FlashDeck> decks) {
    if (decks.isEmpty) return null;
    final wanted = widget.initialDeck;
    if (wanted != null && decks.any((d) => d.deck == wanted)) return wanted;
    return decks.first.deck;
  }

  Future<void> _loadCards(String deck) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cards = (await _api.fetchCards(deck)).map(_FlashCard.fromJson).toList();
      if (!mounted) return;
      final saved = _savedIndex[deck] ?? 0;
      final index = cards.isEmpty ? 0 : saved.clamp(0, cards.length - 1);
      setState(() {
        _cards = cards;
        _index = index;
        _flipped = false;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    }
  }

  void _selectDeck(String deck) {
    if (deck == _deck) return;
    _persist();
    _deck = deck;
    _loadCards(deck);
  }

  void _go(int delta) {
    final next = _index + delta;
    if (next < 0 || next >= _cards.length) return;
    setState(() {
      _index = next;
      _flipped = false;
    });
    _persist();
  }

  void _persist() {
    final deck = _deck;
    if (deck == null || _cards.isEmpty) return;
    _api
        .saveFlashcardProgress(
          deck: deck,
          currentIndex: _index,
          cardsTotal: _cards.length,
        )
        .catchError((Object e) => debugPrint('Could not save flashcard progress: $e'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RW.paper,
      appBar: AppBar(
        backgroundColor: RW.paper,
        foregroundColor: RW.ink,
        elevation: 0,
        title: Text('Flashcards', style: ts(size: 17, weight: FontWeight.w700)),
        bottom: _cards.isEmpty ? null : _progressBar(),
      ),
      body: _body(),
    );
  }

  PreferredSizeWidget _progressBar() {
    return PreferredSize(
      preferredSize: const Size.fromHeight(30),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            Text('Card ${_index + 1} of ${_cards.length}',
                style: ts(size: 12, color: RW.ink3)),
            const Gap(10),
            Expanded(child: ProgressBar(value: (_index + 1) / _cards.length)),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 3));
    }
    if (_error != null) {
      return ScreenScroll(
        child: Surface(
          padding: const EdgeInsets.all(20),
          color: RW.tintRed,
          borderColor: const Color(0xFFF5C6C3),
          child: Column(
            children: [
              const RWIcon('cards', size: 32, color: RW.red),
              const Gap(10),
              Text('Could not load flashcards.', style: ts(size: 15, weight: FontWeight.w700)),
              const Gap(4),
              Text(_error!, style: ts(size: 12.5, color: RW.ink2), textAlign: TextAlign.center),
              const Gap(12),
              CapsuleButton(label: 'Retry', color: RW.red, onTap: _bootstrap),
            ],
          ),
        ),
      );
    }
    if (_decks.isEmpty) {
      return Center(
        child: Text('No flashcard decks yet.', style: ts(size: 15, color: RW.ink3)),
      );
    }
    return Column(
      children: [
        const Gap(12),
        _deckChips(),
        const Gap(4),
        Expanded(child: _cards.isEmpty ? _empty() : _cardArea()),
      ],
    );
  }

  Widget _deckChips() {
    return SizedBox(
      height: 40,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            for (final deck in _decks)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _chip(deck.deck),
              ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String deck) {
    final active = deck == _deck;
    return InkWell(
      onTap: () => _selectDeck(deck),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? RW.blue : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? RW.blue : RW.border),
        ),
        child: Text(deck,
            style: ts(size: 13, color: active ? Colors.white : RW.ink2, weight: FontWeight.w600)),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const RWIcon('cards', size: 40, color: RW.ink3),
          const Gap(10),
          Text('No cards in this deck yet.', style: ts(size: 15, color: RW.ink3)),
        ],
      ),
    );
  }

  Widget _cardArea() {
    final card = _cards[_index];
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GestureDetector(
            onTap: () => setState(() => _flipped = !_flipped),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 240),
              switchInCurve: Curves.easeOut,
              switchOutCurve: Curves.easeIn,
              child: _flipped ? _backCard(card) : _frontCard(card),
            ),
          ),
          const Gap(14),
          Text(
            _flipped ? 'Tap the card to see the front' : 'Tap the card to reveal the answer',
            style: ts(size: 12, color: RW.ink3),
            textAlign: TextAlign.center,
          ),
          const Gap(20),
          CapsuleButton(
            label: 'Next card',
            icon: 'chevron',
            onTap: _index < _cards.length - 1 ? () => _go(1) : null,
            color: _index < _cards.length - 1 ? RW.blue : RW.border.withValues(alpha: 0.6),
          ),
          const Gap(10),
          if (_index > 0)
            CapsuleButton(
              label: 'Previous',
              icon: 'back',
              color: Colors.transparent,
              fg: RW.blue,
              onTap: () => _go(-1),
            ),
        ],
      ),
    );
  }

  String _iconForDeck(String deckName) {
    for (final deck in _decks) {
      if (deck.deck == deckName) return deck.icon;
    }
    return 'cards';
  }

  Widget _frontCard(_FlashCard card) {
    return Surface(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: RW.tintBlue,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                RWIcon(_iconForDeck(card.deck), size: 14, color: RW.blue),
                const Gap(6),
                Text(card.deck, style: ts(size: 12, color: RW.blue, weight: FontWeight.w700)),
              ],
            ),
          ),
          const Gap(20),
          Text(card.front,
              style: ts(size: 21, weight: FontWeight.w700, height: 1.3),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _backCard(_FlashCard card) {
    return Surface(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: RW.tintGreen,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const RWIcon('check', size: 14, color: RW.signalGreen),
                const Gap(6),
                Text('Answer', style: ts(size: 12, color: const Color(0xFF1D7A3A), weight: FontWeight.w700)),
              ],
            ),
          ),
          const Gap(18),
          Text(card.back,
              style: ts(size: 16, color: RW.ink2, height: 1.5),
              textAlign: TextAlign.center),
        ],
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
