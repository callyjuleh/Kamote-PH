import 'package:flutter/material.dart';

import '../icons.dart';
import '../road_backdrop.dart';
import '../services/api_service.dart';
import '../session.dart';
import '../theme.dart';
import '../widgets.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.session, required this.api});

  final SessionController session;
  final ApiService api;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  bool _signIn = true;
  bool _agreed = false;
  bool _busy = false;
  String? _error;
  String _track = 'new';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _toggleMode() {
    setState(() {
      _signIn = !_signIn;
      _error = null;
    });
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    final email = _email.text.trim();
    final password = _password.text;

    final validation = _validate(name, email, password);
    if (validation != null) {
      setState(() => _error = validation);
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final result = _signIn
          ? await widget.api.login(email: email, password: password)
          : await widget.api.register(
              name: name,
              email: email,
              password: password,
              track: _track,
            );

      widget.api.setToken(result.token);
      widget.session.signIn(result.token, result.user);

      if (!_signIn && _agreed) {
        await _recordConsent();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Something went wrong. Please try again.';
      });
    }
  }

  Future<void> _recordConsent() async {
    for (final type in const ['privacy', 'terms']) {
      try {
        final user = await widget.api.postConsent(type);
        widget.session.updateUser(user);
      } catch (_) {
        // Consent can be recorded later from the Progress tab.
      }
    }
  }

  String? _validate(String name, String email, String password) {
    if (!_signIn && name.length < 2) return 'Please enter your full name.';
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!_signIn && !_agreed) {
      return 'Please agree to the Privacy Policy and Terms of Use.';
    }
    return null;
  }

  void _openPolicy(String title, String body) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text(title, style: ts(size: 18, weight: FontWeight.w700)),
        content: SingleChildScrollView(
          child: Text(body, style: ts(size: 14, color: RW.ink2, height: 1.5)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Close', style: ts(size: 14, color: RW.blue, weight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RW.paper,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _hero(),
            Transform.translate(
              offset: const Offset(0, -28),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Surface(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _signIn ? 'Welcome back' : 'Create your account',
                        style: ts(size: 22, weight: FontWeight.w800),
                      ),
                      const Gap(4),
                      Text(
                        _signIn
                            ? 'Sign in to sync your progress across the app.'
                            : 'Track your lessons, quizzes, and streak as you learn.',
                        style: ts(size: 13.5, color: RW.ink2),
                      ),
                      const Gap(18),
                      if (!_signIn) ...[
                        _field(
                          controller: _name,
                          hint: 'Full name',
                          icon: 'user',
                          textInputAction: TextInputAction.next,
                        ),
                        const Gap(12),
                      ],
                      _field(
                        controller: _email,
                        hint: 'Email',
                        icon: 'user',
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                      ),
                      const Gap(12),
                      _field(
                        controller: _password,
                        hint: 'Password',
                        icon: 'settings',
                        obscure: true,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _submit(),
                      ),
                      if (!_signIn) ...[
                        const Gap(16),
                        Text('I am a…', style: ts(size: 13, weight: FontWeight.w700)),
                        const Gap(8),
                        Row(
                          children: [
                            Expanded(
                              child: _trackChip('New driver', 'new'),
                            ),
                            const Gap(10),
                            Expanded(
                              child: _trackChip('Licensed', 'licensed'),
                            ),
                          ],
                        ),
                        const Gap(14),
                        _agreementRow(),
                      ],
                      if (_error != null) ...[
                        const Gap(14),
                        Surface(
                          color: RW.tintRed,
                          borderColor: const Color(0xFFF5C6C3),
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const RWIcon('close', size: 16, color: RW.red),
                              const Gap(8),
                              Expanded(
                                child: Text(_error!,
                                    style: ts(size: 13, color: RW.ink2, height: 1.35)),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const Gap(20),
                      CapsuleButton(
                        label: _busy
                            ? (_signIn ? 'Signing in…' : 'Creating account…')
                            : (_signIn ? 'Sign in' : 'Create account'),
                        icon: _signIn ? 'arrow' : 'check',
                        onTap: _busy ? null : _submit,
                        color: _busy ? RW.border.withValues(alpha: 0.8) : RW.blue,
                      ),
                      const Gap(12),
                      Center(
                        child: TextLink(
                          label: _signIn
                              ? 'New here? Create an account'
                              : 'Already have an account? Sign in',
                          withChevron: false,
                          onTap: _busy ? null : _toggleMode,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Text(
                'Demo account · demo@kamote.ph / kamote123',
                textAlign: TextAlign.center,
                style: ts(size: 12, color: RW.ink3),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _hero() {
    return SizedBox(
      height: 220,
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
        child: Stack(
          children: [
            const Positioned.fill(child: RoadBackdrop()),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 20, 22, 0),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Gap(20),
                    const RWIcon('signal', size: 34, color: Colors.white),
                    const Gap(14),
                    Text('RoadWise PH', style: display().copyWith(fontSize: 30)),
                    const Gap(6),
                    Text(
                      'Your driving tutor, powered by the local AI.',
                      style: ts(size: 14, color: const Color(0xB3FFFFFF)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required String icon,
    bool obscure = false,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    ValueChanged<String>? onSubmitted,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: RW.ink3),
        prefixIcon: Padding(
          padding: const EdgeInsets.all(12),
          child: RWIcon(icon, size: 20, color: RW.ink3),
        ),
        filled: true,
        fillColor: RW.paper,
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
    );
  }

  Widget _trackChip(String label, String value) {
    final active = _track == value;
    return InkWell(
      onTap: _busy ? null : () => setState(() => _track = value),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? RW.blue : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? RW.blue : RW.border),
        ),
        child: Text(label,
            style: ts(size: 13.5, color: active ? Colors.white : RW.ink2, weight: FontWeight.w600)),
      ),
    );
  }

  Widget _agreementRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: _agreed,
            onChanged: _busy ? null : (v) => setState(() => _agreed = v ?? false),
            activeColor: RW.blue,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
        ),
        const Gap(8),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text('I agree to the ', style: ts(size: 13, color: RW.ink2)),
                _policyLink('Privacy Policy', _privacyText),
                Text(' and ', style: ts(size: 13, color: RW.ink2)),
                _policyLink('Terms of Use', _termsText),
                Text('.', style: ts(size: 13, color: RW.ink2)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _policyLink(String label, String body) {
    return GestureDetector(
      onTap: () => _openPolicy(label, body),
      child: Text(label, style: ts(size: 13, color: RW.blue, weight: FontWeight.w700)),
    );
  }

  static const String _privacyText =
      'RoadWise PH stores your study progress, quiz attempts, and preferences '
      'so it can sync them to your account. We do not sell your data and only '
      'use it to power your learning experience in the app.';

  static const String _termsText =
      'By using RoadWise PH you agree to use the study material for personal '
      'learning only. The content is a study aid and does not replace the '
      'official LTO reviewer or local traffic rules.';
}
