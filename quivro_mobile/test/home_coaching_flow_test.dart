import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
// Reuse the installed FlutterFire test codec; no production dependency needed.
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/test.dart';
// ignore: depend_on_referenced_packages, implementation_imports
import 'package:firebase_database_platform_interface/src/pigeon/messages.pigeon.dart'
    as database_api;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/profile_store.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/strings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/screens/home_page.dart';
import 'package:quivro_mobile/widgets/home_coach_marks.dart';
import 'package:quivro_mobile/widgets/news_pile.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  final binding = TestWidgetsFlutterBinding.ensureInitialized();
  final messenger = binding.defaultBinaryMessenger;
  const databaseEvents = MethodChannel('test/quivro/database-info');
  const observe = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.firebase_database_platform_interface.FirebaseDatabaseHostApi.queryObserve',
    database_api.FirebaseDatabaseHostApi.pigeonChannelCodec,
  );
  const get = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.firebase_database_platform_interface.FirebaseDatabaseHostApi.queryGet',
    database_api.FirebaseDatabaseHostApi.pigeonChannelCodec,
  );
  var databaseReads = 0;

  setUpAll(() async {
    setupFirebaseCoreMocks();
    await Firebase.initializeApp();
  });

  setUp(() {
    databaseReads = 0;
    messenger.setMockDecodedMessageHandler<Object?>(observe, (_) async {
      return [databaseEvents.name];
    });
    messenger.setMockMethodCallHandler(databaseEvents, (_) async => null);
    messenger.setMockDecodedMessageHandler<Object?>(get, (_) async {
      databaseReads += 1;
      return [
        {
          'snapshot': {'key': 'ABC123', 'value': null, 'childKeys': []},
        },
      ];
    });
    messenger.setMockMethodCallHandler(
      const MethodChannel('dev.fluttercommunity.plus/connectivity'),
      (_) async => ['wifi'],
    );
    messenger.setMockMethodCallHandler(
      const MethodChannel('dev.fluttercommunity.plus/connectivity_status'),
      (_) async => null,
    );
  });

  Future<SettingsController> pumpHome(
    WidgetTester tester, {
    bool eligible = true,
    bool unreadNews = true,
  }) async {
    SharedPreferences.setMockInitialValues({
      if (!unreadNews)
        'quivro.news.seen': jsonEncode(
          newsDrops.map((drop) => drop.id).toList(),
        ),
    });
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final settings = SettingsController();
    await tester.pumpWidget(
      AnimatedBuilder(
        animation: settings,
        builder: (context, _) => Settings(
          controller: settings,
          child: MaterialApp(
            theme: buildQuivroTheme(),
            darkTheme: buildQuivroDarkTheme(),
            themeMode: settings.themeMode,
            home: HomePage(
              profile: const PlayerProfile(nickname: 'Vedo', avatar: 1),
              showCoachMarks: eligible,
            ),
          ),
        ),
      ),
    );
    return settings;
  }

  Finder getNext() => find.byKey(const ValueKey('home-coach-next'));

  Future<void> next(WidgetTester tester) async {
    await tester.tap(getNext());
    await tester.pumpAndSettle();
  }

  Future<void> finishEntrance(WidgetTester tester) async {
    // flutter_animate's delayed entrance timers do not keep pumpAndSettle busy.
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();
  }

  testWidgets('real home controls pause and resume the five-step tour', (
    tester,
  ) async {
    final settings = await pumpHome(tester);
    await finishEntrance(tester);
    expect(find.text('Cartoons are here').hitTestable(), findsOneWidget);
    expect(find.byType(HomeCoachMarks), findsNothing);

    await tester.tap(find.text('\u00d7').hitTestable());
    await finishEntrance(tester);
    expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);
    for (var i = 0; i < 5; i++) {
      expect(find.byKey(ValueKey('coach-dot-$i')), findsOneWidget);
    }

    await tester.tap(find.text('JOIN'), warnIfMissed: false);
    await tester.pump();
    expect(find.text(AppStrings.english.enterRoomCode), findsNothing);
    await tester.tap(find.byIcon(Icons.campaign));
    await tester.pumpAndSettle();
    expect(find.byType(HomeCoachMarks), findsNothing);
    expect(find.text('Cartoons are here').hitTestable(), findsOneWidget);
    await binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);

    await next(tester);
    expect(find.text(AppStrings.english.coachTitles[1]), findsOneWidget);
    final wasNight = settings.isNight;
    await tester.tap(find.text(wasNight ? 'Night' : 'Day'));
    await tester.pumpAndSettle();
    expect(settings.isNight, !wasNight);
    expect(find.text(AppStrings.english.coachTitles[1]), findsOneWidget);
    final nextLabel = find.descendant(
      of: getNext(),
      matching: find.text(AppStrings.english.newsNext.toUpperCase()),
    );
    expect(nextLabel.hitTestable(), findsOneWidget);
    expect(tester.widget<Text>(nextLabel).style!.color, showInkDay);

    await next(tester);
    await tester.tap(find.text('EN'));
    await tester.pumpAndSettle();
    expect(find.byType(HomeCoachMarks), findsNothing);
    await binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(settings.language, AppLanguage.en);
    expect(find.text(AppStrings.english.coachTitles[2]), findsOneWidget);
    await tester.tap(find.text('EN'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Bosanski'));
    await tester.pumpAndSettle();
    expect(settings.language, AppLanguage.bs);
    expect(find.text(AppStrings.bosnian.coachTitles[2]), findsOneWidget);

    await next(tester);
    expect(find.text(AppStrings.bosnian.coachTitles[3]), findsOneWidget);
    await tester.tap(find.byIcon(Icons.tv).hitTestable());
    await tester.pumpAndSettle();
    expect(find.byType(HomeCoachMarks), findsNothing);
    expect(
      find.text(AppStrings.bosnian.hostHintTitle.toUpperCase()),
      findsOneWidget,
    );
    await binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text(AppStrings.bosnian.coachTitles[3]), findsOneWidget);

    await next(tester);
    expect(find.text(AppStrings.bosnian.coachTitles[4]), findsOneWidget);
    final code = find.byType(TextField);
    expect(tester.widget<TextField>(code).controller!.text, isEmpty);
    await tester.tap(code);
    await tester.enterText(code, 'abc123');
    await tester.pumpAndSettle();
    await next(tester);
    expect(find.byType(HomeCoachMarks), findsNothing);
    expect(tester.widget<TextField>(code).controller!.text, 'ABC123');
    expect(databaseReads, 0, reason: 'Coaching must never attempt to join.');
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('news dismissal waits for home entrance to finish', (
    tester,
  ) async {
    await pumpHome(tester);
    await tester.pump();
    await tester.tap(find.text('\u00d7').hitTestable());
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.byType(HomeCoachMarks), findsNothing);
    await finishEntrance(tester);
    expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  for (final useBack in [false, true]) {
    testWidgets('no-news tour ends with ${useBack ? 'Back' : 'Skip'}', (
      tester,
    ) async {
      final settings = await pumpHome(tester, unreadNews: false);
      await finishEntrance(tester);
      expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);
      if (useBack) {
        await binding.handlePopRoute();
      } else {
        await tester.tap(find.byKey(const ValueKey('home-coach-skip')));
      }
      await tester.pumpAndSettle();
      expect(find.byType(HomeCoachMarks), findsNothing);
      await settings.toggleTheme();
      await tester.pumpAndSettle();
      expect(find.byType(HomeCoachMarks), findsNothing);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
    });
  }

  testWidgets('ordinary home entry never starts coaching', (tester) async {
    await pumpHome(tester, eligible: false, unreadNews: false);
    await finishEntrance(tester);
    expect(find.byType(HomeCoachMarks), findsNothing);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
