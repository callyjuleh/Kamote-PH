class LessonSection {
  const LessonSection({
    required this.id,
    required this.heading,
    required this.body,
    this.mediaUrl,
    this.orderIndex = 0,
  });

  final int id;
  final String heading;
  final String body;
  final String? mediaUrl;
  final int orderIndex;

  factory LessonSection.fromJson(Map<String, dynamic> json) {
    return LessonSection(
      id: _asInt(json['id']),
      heading: (json['heading'] ?? '') as String,
      body: (json['body'] ?? '') as String,
      mediaUrl: json['media_url'] as String?,
      orderIndex: _asInt(json['order_index']),
    );
  }
}

class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.category,
    this.description,
    this.icon,
    this.orderIndex = 0,
    this.durationMin = 0,
    this.sectionCount = 0,
    this.sections = const [],
  });

  final int id;
  final String title;
  final String category;
  final String? description;
  final String? icon;
  final int orderIndex;
  final int durationMin;
  final int sectionCount;
  final List<LessonSection> sections;

  factory Lesson.fromJson(Map<String, dynamic> json) {
    final rawSections = json['sections'];
    return Lesson(
      id: _asInt(json['id']),
      title: (json['title'] ?? '') as String,
      category: (json['category'] ?? 'General') as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      orderIndex: _asInt(json['order_index']),
      durationMin: _asInt(json['duration_min']),
      sectionCount: _asInt(json['section_count']),
      sections: rawSections is List
          ? rawSections
              .whereType<Map<String, dynamic>>()
              .map(LessonSection.fromJson)
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
