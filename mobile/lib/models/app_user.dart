class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.track = 'new',
    this.dailyGoal = 0,
    this.licenseStatus = 'none',
    this.privacyAccepted = false,
    this.termsAccepted = false,
  });

  final int id;
  final String name;
  final String email;
  final String track;
  final int dailyGoal;
  final String licenseStatus;
  final bool privacyAccepted;
  final bool termsAccepted;

  String get firstName {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.isEmpty || parts.first.isEmpty ? name : parts.first;
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final consent = json['consent'];
    final privacy = consent is Map ? consent['privacy'] : null;
    final terms = consent is Map ? consent['terms'] : null;
    return AppUser(
      id: _asInt(json['id']),
      name: (json['name'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      track: (json['track'] ?? 'new') as String,
      dailyGoal: _asInt(json['dailyGoal']),
      licenseStatus: (json['licenseStatus'] ?? 'none') as String,
      privacyAccepted:
          privacy is Map && privacy['acceptedAt'] != null,
      termsAccepted: terms is Map && terms['acceptedAt'] != null,
    );
  }
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
