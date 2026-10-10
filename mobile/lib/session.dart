import 'package:flutter/foundation.dart';

import 'models/app_user.dart';

/// In-memory session: the bearer token plus the signed-in user.
///
/// This app keeps the session in memory only (no secure storage dependency),
/// so a full restart returns to the sign-in screen.
class Session {
  const Session({required this.token, required this.user});

  final String token;
  final AppUser user;

  Session copyWith({AppUser? user}) =>
      Session(token: token, user: user ?? this.user);
}

class SessionController extends ValueNotifier<Session?> {
  SessionController([super.value]);

  void signIn(String token, AppUser user) {
    value = Session(token: token, user: user);
  }

  void updateUser(AppUser user) {
    final current = value;
    if (current != null) value = current.copyWith(user: user);
  }

  void signOut() {
    value = null;
  }
}
