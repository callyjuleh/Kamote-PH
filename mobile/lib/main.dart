import 'package:flutter/material.dart';

import 'icons.dart';
import 'nav.dart';
import 'screens/ask_ai_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/lesson_screen.dart';
import 'screens/library_screen.dart';
import 'screens/progress_screen.dart';
import 'services/api_service.dart';
import 'session.dart';
import 'theme.dart';

void main() {
  runApp(const KamoteApp());
}

class KamoteApp extends StatelessWidget {
  const KamoteApp({super.key, this.session, this.api});

  final SessionController? session;
  final ApiService? api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RoadWise PH',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      themeMode: ThemeMode.light,
      home: _Root(session: session, api: api),
    );
  }
}

/// Owns the app session and API client, and swaps between the auth screen and
/// the signed-in shell.
class _Root extends StatefulWidget {
  const _Root({this.session, this.api});

  final SessionController? session;
  final ApiService? api;

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  late final SessionController _session = widget.session ?? SessionController();
  late final ApiService _api = widget.api ?? ApiService();
  late final bool _ownsApi = widget.api == null;

  @override
  void initState() {
    super.initState();
    _session.addListener(_syncToken);
    _syncToken();
  }

  void _syncToken() => _api.setToken(_session.value?.token);

  @override
  void dispose() {
    _session.removeListener(_syncToken);
    if (_ownsApi) _api.dispose();
    if (widget.session == null) _session.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Session?>(
      valueListenable: _session,
      builder: (context, session, _) {
        if (session == null) {
          return AuthScreen(session: _session, api: _api);
        }
        return KamoteShell(session: _session, api: _api);
      },
    );
  }
}

class KamoteShell extends StatefulWidget {
  const KamoteShell({super.key, this.api, required this.session});

  final ApiService? api;
  final SessionController session;

  @override
  State<KamoteShell> createState() => _KamoteShellState();
}

class _KamoteShellState extends State<KamoteShell> {
  late final ApiService _api = widget.api ?? ApiService();
  AppScreen _screen = AppScreen.home;

  void _navigate(AppScreen screen) {
    final tab = _TabBar.tabs.any((t) => t.$1 == screen);
    if (!tab) return;
    setState(() => _screen = screen);
  }

  Widget _buildScreen() {
    final user = widget.session.value?.user;
    switch (_screen) {
      case AppScreen.home:
        return HomeScreen(
          navigate: _navigate,
          api: _api,
          userName: user?.name ?? 'driver',
        );
      case AppScreen.library:
        return LibraryScreen(api: _api);
      case AppScreen.ai:
        return AskAiScreen(api: _api);
      case AppScreen.study:
        return LessonListScreen(api: _api);
      case AppScreen.progress:
        return ProgressScreen(
          api: _api,
          user: user,
          session: widget.session,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: KeyedSubtree(key: ValueKey(_screen), child: _buildScreen()),
      ),
      bottomNavigationBar: _TabBar(current: _screen, onSelect: _navigate),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.current, required this.onSelect});

  static const tabs = [
    (AppScreen.home, 'Home', 'home'),
    (AppScreen.library, 'Library', 'library'),
    (AppScreen.ai, 'Ask Dai', 'spark'),
    (AppScreen.study, 'Study', 'study'),
    (AppScreen.progress, 'Progress', 'clock'),
  ];

  final AppScreen current;
  final ValueChanged<AppScreen> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: RW.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            for (final (screen, label, icon) in tabs)
              Expanded(child: _TabButton(
                label: label,
                icon: icon,
                active: current == screen,
                onTap: () => onSelect(screen),
              )),
          ],
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  final String label;
  final String icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? RW.blue : RW.ink3;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 52,
        margin: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: active && icon == 'spark' ? RW.tintBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            RWIcon(icon, size: 22, color: color),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: color,
                  letterSpacing: 0.1,
                )),
          ],
        ),
      ),
    );
  }
}
