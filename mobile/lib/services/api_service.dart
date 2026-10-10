import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/app_user.dart';
import '../models/lesson.dart';
import '../models/quiz.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiService {
  ApiService({http.Client? client, String? baseUrl, String? token})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? ApiConfig.baseUrl {
    _token = token;
  }

  final http.Client _client;
  final String _baseUrl;
  String? _token;

  static const Duration _timeout = Duration(seconds: 10);

  void setToken(String? token) => _token = token;

  Map<String, String> _headers({bool json = false}) => {
        if (json) 'Content-Type': 'application/json',
        if (_token != null && _token!.isNotEmpty) 'Authorization': 'Bearer $_token',
      };

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  Future<({String token, AppUser user})> register({
    required String name,
    required String email,
    required String password,
    required String track,
  }) =>
      _auth('/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'track': track,
      });

  Future<({String token, AppUser user})> login({
    required String email,
    required String password,
  }) =>
      _auth('/auth/login', {'email': email, 'password': password});

  Future<({String token, AppUser user})> _auth(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await _post(path, body);
    final token = res['token'];
    final user = res['user'];
    if (token is! String || user is! Map<String, dynamic>) {
      throw ApiException('Unexpected response from the server.');
    }
    return (token: token, user: AppUser.fromJson(user));
  }

  Future<AppUser> getCurrentUser() async {
    final body = await _get('/me');
    final user = body['user'];
    if (user is! Map<String, dynamic>) {
      throw ApiException('Unexpected response for the current user.');
    }
    return AppUser.fromJson(user);
  }

  // ---------------------------------------------------------------------------
  // Lessons, quizzes (public), progress
  // ---------------------------------------------------------------------------

  Future<List<Lesson>> fetchLessons() async {
    final body = await _get('/lessons');
    final data = body['data'];
    if (data is! List) {
      throw ApiException('Unexpected response for lessons.');
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(Lesson.fromJson)
        .toList();
  }

  Future<Lesson> fetchLesson(int id) async {
    final body = await _get('/lessons/$id');
    final data = body['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException('Lesson $id was not found.');
    }
    return Lesson.fromJson(data);
  }

  Future<Quiz> fetchQuiz(int id) async {
    final body = await _get('/quizzes/$id');
    final data = body['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException('Quiz $id was not found.');
    }
    return Quiz.fromJson(data);
  }

  Future<List<dynamic>> fetchProgress(int userId) async {
    final body = await _get('/progress/$userId');
    final data = body['data'];
    if (data is! List) throw ApiException('Unexpected response for progress.');
    return data;
  }

  // ---------------------------------------------------------------------------
  // Quiz sessions (authenticated)
  // ---------------------------------------------------------------------------

  Future<QuizSession> startQuizSession(int quizId) async {
    final body = await _post('/quizzes/$quizId/start');
    final data = body['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException('Could not start the quiz session.');
    }
    return QuizSession.fromJson(data);
  }

  Future<QuizSession?> getQuizSession(int quizId) async {
    final body = await _get('/quizzes/$quizId/attempt');
    final data = body['data'];
    if (data is! Map<String, dynamic>) return null;
    return QuizSession.fromJson(data);
  }

  Future<void> saveQuizSession(
    int quizId,
    int attemptId,
    List<QuizAnswer> answers,
    int currentIndex,
  ) async {
    await _put('/quizzes/$quizId/attempt', {
      'attemptId': attemptId,
      'answers': answers.map((a) => a.toJson()).toList(),
      'currentIndex': currentIndex,
    });
  }

  Future<Map<String, dynamic>> submitQuizSession(
    int quizId,
    int attemptId,
    List<QuizAnswer> answers,
  ) async {
    final body = await _post('/quizzes/$quizId/submit', {
      'attemptId': attemptId,
      'answers': answers.map((a) => a.toJson()).toList(),
    });
    final data = body['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException('Unexpected response for quiz submission.');
    }
    return data;
  }

  // ---------------------------------------------------------------------------
  // Flashcards (public decks + user progress)
  // ---------------------------------------------------------------------------

  Future<List<Map<String, dynamic>>> fetchDecks() async {
    final body = await _get('/flashcards/decks');
    final decks = body['decks'];
    return decks is List ? decks.whereType<Map<String, dynamic>>().toList() : const [];
  }

  Future<List<Map<String, dynamic>>> fetchCards(String deck) async {
    final body = await _get('/flashcards?deck=${Uri.encodeQueryComponent(deck)}');
    final cards = body['cards'];
    return cards is List ? cards.whereType<Map<String, dynamic>>().toList() : const [];
  }

  Future<List<Map<String, dynamic>>> fetchFlashcardProgress() async {
    final body = await _get('/me/flashcards');
    final progress = body['progress'];
    return progress is List ? progress.whereType<Map<String, dynamic>>().toList() : const [];
  }

  Future<void> saveFlashcardProgress({
    required String deck,
    required int currentIndex,
    required int cardsTotal,
  }) async {
    await _put('/me/flashcards', {
      'deck': deck,
      'currentIndex': currentIndex,
      'cardsTotal': cardsTotal,
    });
  }

  // ---------------------------------------------------------------------------
  // Goals, achievements, suggestions, history
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> fetchGoals() => _get('/me/goals');

  Future<List<Map<String, dynamic>>> fetchAchievements() async {
    final body = await _get('/me/achievements');
    final achievements = body['achievements'];
    return achievements is List
        ? achievements.whereType<Map<String, dynamic>>().toList()
        : const [];
  }

  Future<Map<String, dynamic>> fetchSuggestions() => _get('/me/suggestions');

  Future<List<Map<String, dynamic>>> fetchAttempts() async {
    final body = await _get('/me/attempts');
    final attempts = body['attempts'];
    return attempts is List ? attempts.whereType<Map<String, dynamic>>().toList() : const [];
  }

  // ---------------------------------------------------------------------------
  // Consent
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> fetchConsent() => _get('/me/consent');

  Future<AppUser> postConsent(String type) async {
    final body = await _post('/me/consent', {'type': type});
    final user = body['user'];
    if (user is! Map<String, dynamic>) {
      throw ApiException('Unexpected response for consent.');
    }
    return AppUser.fromJson(user);
  }

  // ---------------------------------------------------------------------------
  // AI
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> chatWithDai(
    String message, {
    List<Map<String, String>> history = const [],
  }) async {
    return _post('/ai/chat', {
      'message': message,
      'history': history,
    });
  }

  Future<List<Object?>> fetchAIModels() async {
    final body = await _get('/ai/models');
    final models = body['models'];
    if (models is! List) return const [];
    return models;
  }

  // ---------------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> _get(String path) {
    final uri = Uri.parse('$_baseUrl$path');
    return _run(() => _client.get(uri, headers: _headers()).timeout(_timeout));
  }

  Future<Map<String, dynamic>> _post(String path, [Map<String, dynamic>? body]) {
    final uri = Uri.parse('$_baseUrl$path');
    return _run(() => _client
        .post(uri, headers: _headers(json: true), body: jsonEncode(body ?? const {}))
        .timeout(_timeout));
  }

  Future<Map<String, dynamic>> _put(String path, Map<String, dynamic> body) {
    final uri = Uri.parse('$_baseUrl$path');
    return _run(() => _client
        .put(uri, headers: _headers(json: true), body: jsonEncode(body))
        .timeout(_timeout));
  }

  Future<Map<String, dynamic>> _run(Future<http.Response> Function() call) async {
    http.Response response;
    try {
      response = await call();
    } on TimeoutException {
      throw ApiException('The server took too long to respond.');
    } catch (_) {
      throw ApiException(
        'Could not reach the server at $_baseUrl. '
        'Make sure the backend is running.',
      );
    }

    final ok = response.statusCode >= 200 && response.statusCode < 300;

    if (response.bodyBytes.isEmpty) {
      if (!ok) throw ApiException('Request failed (${response.statusCode}).');
      return {};
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw ApiException('The server returned an invalid response.');
    }

    if (!ok) {
      final message = decoded is Map && decoded['error'] is String
          ? decoded['error'] as String
          : 'Request failed (${response.statusCode}).';
      throw ApiException(message, statusCode: response.statusCode);
    }

    if (decoded is! Map<String, dynamic>) {
      throw ApiException('Unexpected response format.');
    }
    return decoded;
  }

  void dispose() => _client.close();
}
