import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kamote/main.dart';
import 'package:kamote/models/app_user.dart';
import 'package:kamote/services/api_service.dart';
import 'package:kamote/session.dart';

ApiService _offlineApi() {
  return ApiService(
    client: MockClient((request) async => http.Response('{"models":[]}', 200)),
  );
}

void main() {
  testWidgets('KamoteShell renders the five tabs for a signed-in user', (tester) async {
    final session = SessionController(
      const Session(
        token: 'test-token',
        user: AppUser(id: 1, name: 'Pat Cruz', email: 'pat@example.com'),
      ),
    );

    await tester.pumpWidget(KamoteApp(session: session, api: _offlineApi()));
    await tester.pump();

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Library'), findsOneWidget);
    expect(find.text('Ask Dai'), findsOneWidget);
    expect(find.text('Study'), findsOneWidget);
    expect(find.text('Progress'), findsOneWidget);

    // Switch to the Ask Dai tab without crashing.
    await tester.tap(find.text('Ask Dai'));
    await tester.pump();
    expect(find.text('Your driving tutor, powered by the local AI'), findsOneWidget);
  });

  testWidgets('KamoteApp shows the auth screen without a session', (tester) async {
    await tester.pumpWidget(KamoteApp(session: SessionController(), api: _offlineApi()));
    await tester.pump();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Home'), findsNothing);
  });
}
