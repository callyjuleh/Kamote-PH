import 'package:flutter/material.dart';

import '../data.dart';
import '../icons.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets.dart';

/// Live chat with Dai — the on-device AI tutor powered by Ollama + retrieval.
class AskAiScreen extends StatefulWidget {
  const AskAiScreen({super.key, this.api});

  final ApiService? api;

  @override
  State<AskAiScreen> createState() => _AskAiScreenState();
}

class _AskAiScreenState extends State<AskAiScreen> {
  late final ApiService _api = widget.api ?? ApiService();
  final TextEditingController _controller = TextEditingController();
  final List<ChatMessage> _messages = [
    const ChatMessage(
      fromUser: false,
      text: "Hi, I'm Dai! Ask me anything about traffic signals, road signs, "
          'right of way, or anything else in the LTO rules. Tap a suggestion below to start.',
    ),
  ];
  final List<Map<String, String>> _history = [];
  List<String> _suggestions = tutorPrompts.map((p) => p.label).toList();
  bool _busy = false;
  String? _modelLabel;

  @override
  void initState() {
    super.initState();
    _loadModel();
    _loadSuggestions();
  }

  Future<void> _loadSuggestions() async {
    try {
      final data = await _api.fetchSuggestions();
      final chips = <String>[];
      if (data['personalized'] == true) {
        final prompts = data['personalizedPrompts'];
        if (prompts is List) chips.addAll(prompts.whereType<String>());
      }
      final general = data['general'];
      if (general is List) {
        for (final item in general.whereType<Map<String, dynamic>>()) {
          final question = item['question'];
          if (question is String && question.isNotEmpty) chips.add(question);
        }
      }
      if (!mounted || chips.isEmpty) return;
      setState(() => _suggestions = chips.take(6).toList());
    } catch (e) {
      debugPrint('Suggestions unavailable, keeping defaults: $e');
    }
  }

  Future<void> _loadModel() async {
    try {
      final models = await _api.fetchAIModels();
      final names =
          models.whereType<String>().map((n) => n.split(':').first).toSet();
      if (!mounted) return;
      setState(() => _modelLabel = names.join(', '));
    } catch (_) {
      // Backend offline; the chat will surface the error instead.
    }
  }

  Future<void> _send([String? override]) async {
    final text = (override ?? _controller.text).trim();
    if (text.isEmpty || _busy) return;

    setState(() {
      _messages.add(ChatMessage(fromUser: true, text: text));
      _busy = true;
      _controller.clear();
    });

    ChatMessage reply;
    try {
      final result = await _api.chatWithDai(text, history: _history);
      reply = ChatMessage(fromUser: false, text: result['reply'] as String? ?? '');
    } on ApiException catch (e) {
      reply = _offlineReply(text, e.message);
    } catch (_) {
      reply = _offlineReply(text, 'Something went wrong.');
    }

    _history.add({'role': 'user', 'content': text});
    _history.add({'role': 'assistant', 'content': reply.text});

    if (!mounted) return;
    setState(() {
      _messages.add(reply);
      _busy = false;
    });
  }

  /// Local pattern fallback so the tutor still answers when the backend is down.
  ChatMessage _offlineReply(String text, String reason) {
    for (final tutor in tutorReplies) {
      if (RegExp(tutor.pattern, caseSensitive: false).hasMatch(text)) {
        return ChatMessage(fromUser: false, text: tutor.text, lit: tutor.lit, flashing: tutor.flashing);
      }
    }
    return ChatMessage(fromUser: false, text: '${fallbackReply.text}\n\n($reason)');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RW.paper,
      body: Stack(
        children: [
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: _Header(model: _modelLabel),
          ),
          Positioned.fill(
            top: 132,
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    reverse: true,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Column(
                      children: [
                        for (final message in _messages) _bubble(message),
                        const SizedBox(height: 4),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.start,
                            children: [
                              for (final prompt in _suggestions)
                                _suggestion(prompt, () => _send(prompt)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_busy) const _Typing(),
                      ],
                    ),
                  ),
                ),
                _Composer(controller: _controller, onSend: _send, busy: _busy),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bubble(ChatMessage message) {
    final isUser = message.fromUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: isUser ? RW.blue : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 18),
          ),
          border: isUser ? null : Border.all(color: RW.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isUser && message.lit != null && message.lit!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: TrafficLight(lit: message.lit!, flashing: message.flashing, size: 16),
              ),
            Text(
              message.text,
              style: ts(size: 15, color: isUser ? Colors.white : RW.ink, height: 1.45),
            ),
          ],
        ),
      ),
    );
  }

  Widget _suggestion(String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: RW.border),
        ),
        child: Text(label, style: ts(size: 13, color: RW.blue, weight: FontWeight.w600)),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({this.model});
  final String? model;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [RW.navy, Color(0xFF12325F)],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                RWIcon('spark', size: 26, color: Colors.white),
                Gap(10),
                Expanded(
                  child: Text('Ask Dai',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      )),
                ),
              ],
            ),
            const Gap(6),
            Text('Your driving tutor, powered by the local AI',
                style: ts(size: 14, color: const Color(0xB3FFFFFF))),
            if (model != null) ...[
              const Gap(10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const _Dot(color: RW.signalGreen),
                    const Gap(6),
                    Text('Models online · $model',
                        style: ts(size: 12, color: Colors.white, weight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.color});
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _Typing extends StatelessWidget {
  const _Typing();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5)),
        Gap(10),
        Text('Dai is thinking…', style: TextStyle(fontSize: 13, color: RW.ink3)),
      ],
    );
  }
}

class _Composer extends StatefulWidget {
  const _Composer({required this.controller, required this.onSend, required this.busy});

  final TextEditingController controller;
  final Future<void> Function(String) onSend;
  final bool busy;

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: RW.border)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: widget.controller,
                onSubmitted: widget.busy ? null : (t) => widget.onSend(t),
                textInputAction: TextInputAction.send,
                decoration: InputDecoration(
                  hintText: 'Ask about signals, signs, rules…',
                  hintStyle: const TextStyle(color: RW.ink3),
                  filled: true,
                  fillColor: RW.paper,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: RW.border),
                  ),
                ),
              ),
            ),
            const Gap(10),
            Material(
              color: widget.busy ? RW.border.withValues(alpha: 0.6) : RW.blue,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: widget.busy ? null : () => widget.onSend(widget.controller.text),
                child: const SizedBox(
                  width: 46,
                  height: 46,
                  child: Center(child: RWIcon('send', size: 20, color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}