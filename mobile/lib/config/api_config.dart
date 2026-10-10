import 'package:flutter/foundation.dart';

/// Resolves the Express API base URL for the current platform.
///
/// Override for a physical phone (or any custom host) with:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.20:4000/api
class ApiConfig {
  const ApiConfig._();

  static const String _override = String.fromEnvironment('API_BASE_URL');

  static const int port = 4000;

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;

    // Android emulator reaches the host machine through 10.0.2.2.
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:$port/api';
    }

    // Windows/macOS/Linux desktop, iOS simulator, and web.
    return 'http://localhost:$port/api';
  }
}
