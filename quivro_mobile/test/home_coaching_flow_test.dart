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
import 'package:quivro_mobile/widgets/host_hint.dart';
import 'package:quivro_mobile/widgets/news_pile.dart';
import 'package:quivro_mobile/widgets/settings_chips.dart';
import 'package:quivro_mobile/widgets/studio_mark.dart';
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
    bool reduceMotion = false,
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
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(disableAnimations: reduceMotion),
              child: child!,
            ),
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
    expect(
      tester
          .widget<HomeCoachMarks>(find.byType(HomeCoachMarks))
          .targetKey
          .currentWidget,
      isA<HostHomeBanner>(),
    );
    await tester.tap(find.byType(HostHomeBanner), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text(AppStrings.bosnian.coachTitles[3]), findsOneWidget);
    expect(find.byIcon(Icons.copy_rounded), findsNothing);
    expect(find.byIcon(Icons.tv), findsNothing);

    expect(
      AppStrings.english.coachBodies[3],
      AppStrings.english.hostBannerDescription,
    );
    expect(
      AppStrings.bosnian.coachBodies[3],
      AppStrings.bosnian.hostBannerDescription,
    );
    await tester.tap(find.byTooltip(AppStrings.bosnian.close));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 150));
    expect(find.byType(HostHomeBanner), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.byType(HostHomeBanner), findsNothing);
    expect(find.byType(HostTvChip), findsOneWidget);
    expect(
      tester
          .widget<HomeCoachMarks>(find.byType(HomeCoachMarks))
          .targetKey
          .currentWidget,
      isA<HostTvChip>(),
    );
    await tester.tap(find.byType(HostTvChip));
    await tester.pumpAndSettle();
    expect(find.byType(HostHomeBanner), findsOneWidget);
    expect(find.byType(HostTvChip), findsNothing);
    expect(
      tester
          .widget<HomeCoachMarks>(find.byType(HomeCoachMarks))
          .targetKey
          .currentWidget,
      isA<HostHomeBanner>(),
    );

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

  testWidgets(
    'join controls center on the screen independently of the footer',
    (tester) async {
      for (final size in const [
        Size(360, 844),
        Size(390, 844),
        Size(430, 932),
      ]) {
        await pumpHome(tester, eligible: false, unreadNews: false);
        tester.view.physicalSize = size;
        await finishEntrance(tester);
        final top = tester
            .getTopLeft(find.text(AppStrings.english.joinARoom.toUpperCase()))
            .dy;
        final bottom = tester.getBottomLeft(find.byType(StudioMark)).dy;
        expect(
          (top + bottom) / 2,
          closeTo(size.height / 2, 1),
          reason: '$size top=$top bottom=$bottom',
        );
        expect(
          bottom,
          lessThan(tester.getTopLeft(find.byType(HostHomeBanner)).dy),
        );
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox.shrink());
      }
    },
  );

  testWidgets(
    'banner above the navbar stays informational and preserves joining',
    (tester) async {
      await pumpHome(tester, eligible: false, unreadNews: false);
      tester.view.physicalSize = const Size(320, 568);
      await finishEntrance(tester);
      final banner = find.byType(HostHomeBanner);
      await tester.ensureVisible(banner);
      expect(tester.getSize(find.byType(NewsStamp)).width, 48);
      expect(
        tester.getRect(banner).bottom,
        lessThan(tester.getRect(find.byType(SettingsChips)).top),
      );
      await tester.tap(banner, warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.copy_rounded), findsNothing);
      expect(find.byIcon(Icons.tv), findsNothing);
      expect(find.byType(HomeCoachMarks), findsNothing);

      final code = find.byType(TextField);
      await tester.ensureVisible(code);
      await tester.tap(code);
      tester.view.viewInsets = const FakeViewPadding(bottom: 220);
      addTearDown(tester.view.resetViewInsets);
      await tester.pumpAndSettle();
      await tester.enterText(code, 'abc123');
      expect(tester.widget<TextField>(code).controller!.text, 'ABC123');
      expect(databaseReads, 0);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
    },
  );

  testWidgets('banner collapses and reopens with reduced motion supported', (
    tester,
  ) async {
    for (final size in const [Size(320, 568), Size(390, 844)]) {
      for (final reduceMotion in [false, true]) {
        await pumpHome(
          tester,
          eligible: false,
          unreadNews: false,
          reduceMotion: reduceMotion,
        );
        tester.view.physicalSize = size;
        await finishEntrance(tester);
        await tester.ensureVisible(find.byType(HostHomeBanner));
        await tester.ensureVisible(find.byType(SettingsChips));
        final footerPositions = [
          tester.getRect(find.text('EN')),
          tester.getRect(find.text('Day')),
          tester.getRect(find.byType(NewsStamp)),
        ];
        await tester.tap(find.byTooltip(AppStrings.english.close));
        await tester.pump();
        if (reduceMotion) {
          expect(find.byType(HostHomeBanner), findsNothing);
        } else {
          await tester.pump(const Duration(milliseconds: 150));
          expect(find.byType(HostHomeBanner), findsOneWidget);
        }
        await tester.pumpAndSettle();
        expect(
          tester.takeException(),
          isNull,
          reason: 'collapse, reduced=$reduceMotion',
        );
        expect(find.byType(HostHomeBanner), findsNothing);
        final chip = find.byType(HostTvChip);
        expect(chip, findsOneWidget);
        expect(
          [
            tester.getRect(find.text('EN')),
            tester.getRect(find.text('Day')),
            tester.getRect(find.byType(NewsStamp)),
          ],
          footerPositions,
          reason: 'Banner toggling must not move footer controls.',
        );
        expect(tester.getRect(chip).left, closeTo(28, 1));
        expect(
          tester.getRect(chip).bottom,
          closeTo(tester.getRect(find.byType(NewsStamp)).bottom, 1),
        );
        final chipBox = tester.renderObject<RenderBox>(chip);
        final shadowPoint = chipBox.localToGlobal(
          Offset(chipBox.size.width / 2, chipBox.size.height + 2),
        );
        for (
          RenderObject child = chipBox;
          child.parent is RenderObject;
          child = child.parent!
        ) {
          final parent = child.parent!;
          final clip = parent.describeApproximatePaintClip(child);
          if (clip != null && parent is RenderBox) {
            expect(
              clip.contains(parent.globalToLocal(shadowPoint)),
              isTrue,
              reason: 'The TV button bottom shadow must remain visible.',
            );
          }
        }
        await tester.tap(chip);
        await tester.pumpAndSettle();
        expect(
          tester.takeException(),
          isNull,
          reason: 'expand, reduced=$reduceMotion',
        );
        expect(find.byType(HostHomeBanner), findsOneWidget);
        expect(chip, findsNothing);
        expect([
          tester.getRect(find.text('EN')),
          tester.getRect(find.text('Day')),
          tester.getRect(find.byType(NewsStamp)),
        ], footerPositions);
        expect(find.byIcon(Icons.copy_rounded), findsNothing);
        expect(find.byType(HomeCoachMarks), findsNothing);

        // Navigating away during collapse must cancel pending animation work.
        await tester.tap(find.byTooltip(AppStrings.english.close));
        await tester.pump(const Duration(milliseconds: 100));
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
    }
  });
}
