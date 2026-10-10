class QuizOption {
  const QuizOption({
    required this.id,
    required this.body,
    this.orderIndex = 0,
  });

  final int id;
  final String body;
  final int orderIndex;

  factory QuizOption.fromJson(Map<String, dynamic> json) {
    return QuizOption(
      id: _asInt(json['id']),
      body: (json['body'] ?? '') as String,
      orderIndex: _asInt(json['order_index']),
    );
  }
}

class Question {
  const Question({
    required this.id,
    required this.prompt,
    this.points = 1,
    this.orderIndex = 0,
    this.options = const [],
  });

  final int id;
  final String prompt;
  final int points;
  final int orderIndex;
  final List<QuizOption> options;

  factory Question.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    return Question(
      id: _asInt(json['id']),
      prompt: (json['prompt'] ?? '') as String,
      points: _asInt(json['points']),
      orderIndex: _asInt(json['order_index']),
      options: rawOptions is List
          ? rawOptions
              .whereType<Map<String, dynamic>>()
              .map(QuizOption.fromJson)
              .toList()
          : const [],
    );
  }
}

class Quiz {
  const Quiz({
    required this.id,
    required this.title,
    required this.kind,
    this.lessonId,
    this.passScore = 70,
    this.timeLimit,
    this.questions = const [],
  });

  final int id;
  final String title;
  final String kind;
  final int? lessonId;
  final int passScore;
  final int? timeLimit;
  final List<Question> questions;

  factory Quiz.fromJson(Map<String, dynamic> json) {
    final rawQuestions = json['questions'];
    return Quiz(
      id: _asInt(json['id']),
      title: (json['title'] ?? '') as String,
      kind: (json['kind'] ?? 'lesson') as String,
      lessonId: json['lesson_id'] == null ? null : _asInt(json['lesson_id']),
      passScore: _asInt(json['pass_score']),
      timeLimit: json['time_limit'] == null ? null : _asInt(json['time_limit']),
      questions: rawQuestions is List
          ? rawQuestions
              .whereType<Map<String, dynamic>>()
              .map(Question.fromJson)
              .toList()
          : const [],
    );
  }
}

/// One answer in an in-progress or submitted attempt. [optionId] is null for
/// an unanswered question.
class QuizAnswer {
  const QuizAnswer({required this.questionId, this.optionId});

  final int questionId;
  final int? optionId;

  Map<String, dynamic> toJson() => {'questionId': questionId, 'optionId': optionId};

  factory QuizAnswer.fromJson(Map<String, dynamic> json) {
    final optionId = json['optionId'];
    return QuizAnswer(
      questionId: _asInt(json['questionId']),
      optionId: optionId == null ? null : _asInt(optionId),
    );
  }
}

/// A resumable quiz session returned by `/quizzes/:id/start` or `/attempt`.
class QuizSession {
  const QuizSession({
    required this.attemptId,
    required this.currentIndex,
    this.answers = const [],
    this.resumed = false,
  });

  final int attemptId;
  final int currentIndex;
  final List<QuizAnswer> answers;
  final bool resumed;

  factory QuizSession.fromJson(Map<String, dynamic> json) {
    final rawAnswers = json['answers'];
    return QuizSession(
      attemptId: _asInt(json['attemptId']),
      currentIndex: _asInt(json['currentIndex']),
      resumed: json['resumed'] == true,
      answers: rawAnswers is List
          ? rawAnswers
              .whereType<Map<String, dynamic>>()
              .map(QuizAnswer.fromJson)
              .toList()
          : const [],
    );
  }
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
