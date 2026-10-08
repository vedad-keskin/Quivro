import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/profile_store.dart';
import 'package:quivro_mobile/core/room_models.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/screens/room_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpBoard(
    WidgetTester tester, {
    required RoomState room,
    required String playerId,
    Brightness brightness = Brightness.light,
    Size size = const Size(360, 740),
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      Settings(
        controller: SettingsController(),
        child: MaterialApp(
          theme: brightness == Brightness.dark
              ? buildQuivroDarkTheme()
              : buildQuivroTheme(),
          home: finishedLeaderboardPreview(
            room: room,
            playerId: playerId,
            profile: const PlayerProfile(nickname: 'Dee', avatar: 1),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 800));
  }

  RoomState roomOf({
    required List<RoomPlayer> players,
    List<LastWinner> winners = const [],
  }) {
    return RoomState(
      code: 'ABC123',
      phase: 'finished',
      createdAt: 0,
      currentIndex: 0,
      totalQuestions: 5,
      players: {for (final player in players) player.id: player},
      answers: const {},
      lastWinners: winners,
    );
  }

  RoomPlayer player(
    String id,
    String name,
    int score, {
    int wins = 0,
    int avatar = 0,
  }) {
    return RoomPlayer(
      id: id,
      name: name,
      score: score,
      avatar: avatar,
      joinedAt: 0,
      wins: wins,
    );
  }

  testWidgets('one player keeps the score on the spotlight', (tester) async {
    final ada = player('ada', 'Ada', 91, avatar: 2);
    await pumpBoard(
      tester,
      playerId: 'ada',
      room: roomOf(
        players: [ada],
        winners: [LastWinner(playerId: 'ada', name: 'Ada', avatar: 2)],
      ),
    );

    expect(find.text('Ada'), findsOneWidget);
    expect(find.text('91'), findsOneWidget);
    expect(find.text('PLAY AGAIN'), findsOneWidget);
    expect(find.text('HOME'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('a tie lists every winner and a podium when two played', (
    tester,
  ) async {
    await pumpBoard(
      tester,
      playerId: 'bea',
      room: roomOf(
        players: [
          player('ada', 'Ada', 80, avatar: 1),
          player('bea', 'Bea', 80, wins: 2, avatar: 3),
        ],
        winners: [
          LastWinner(playerId: 'ada', name: 'Ada', avatar: 1),
          LastWinner(playerId: 'bea', name: 'Bea', avatar: 3),
        ],
      ),
    );

    expect(find.text('Ada'), findsWidgets);
    expect(find.text('Bea'), findsWidgets);
    expect(find.text('Tied winners:'), findsOneWidget);
    expect(find.text('2W'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('ranks after third stay in the list, including you', (
    tester,
  ) async {
    await pumpBoard(
      tester,
      playerId: 'dee',
      brightness: Brightness.dark,
      room: roomOf(
        players: [
          player('ada', 'Ada', 50),
          player('bea', 'Bea', 40),
          player('cal', 'Cal', 30),
          player('dee', 'Dee', 20, wins: 1),
          player('eve', 'Eve', 10),
        ],
        winners: [LastWinner(playerId: 'ada', name: 'Ada', avatar: 0)],
      ),
    );

    expect(find.text('Dee'), findsOneWidget);
    expect(find.text('Eve', skipOffstage: false), findsOneWidget);
    expect(find.text('4'), findsOneWidget);
    expect(find.text('5', skipOffstage: false), findsOneWidget);
    expect(find.text('1W'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('day podium fits a narrow phone', (tester) async {
    await pumpBoard(
      tester,
      playerId: 'ada',
      size: const Size(320, 640),
      room: roomOf(
        players: [
          player('ada', 'Alexandria', 91, wins: 3),
          player('bea', 'Christopher', 82),
          player('cal', 'Montgomery', 73),
        ],
        winners: [LastWinner(playerId: 'ada', name: 'Alexandria', avatar: 0)],
      ),
    );

    expect(tester.takeException(), isNull);
  });

  testWidgets('second place stays silver and marks you', (tester) async {
    await pumpBoard(
      tester,
      playerId: 'bea',
      room: roomOf(
        players: [
          player('ada', 'Ada', 90),
          player('bea', 'Bea', 70),
          player('cal', 'Cal', 50),
        ],
      ),
    );

    expect(find.text('YOU'), findsOneWidget);
    final block = tester.widget<Container>(
      find.byKey(const Key('podium-self')),
    );
    expect((block.decoration! as BoxDecoration).color, const Color(0xFFCFD6E4));
    expect(tester.takeException(), isNull);
  });
}
