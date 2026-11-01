import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/strings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/home_coach_marks.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets(
    'dots, explicit navigation, and only the real target is tappable',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var targetTaps = 0;
      var outsideTaps = 0;
      var nextTaps = 0;
      var skipTaps = 0;
      final target = GlobalKey();
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        Settings(
          controller: SettingsController(),
          child: MaterialApp(
            theme: buildQuivroDarkTheme(),
            home: Scaffold(
              body: Stack(
                children: [
                  Positioned(
                    top: 20,
                    left: 20,
                    child: TextButton(
                      onPressed: () => outsideTaps++,
                      child: const Text('Outside'),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    right: 20,
                    child: SizedBox(
                      key: target,
                      width: 64,
                      height: 48,
                      child: TextButton(
                        onPressed: () => targetTaps++,
                        child: const Text('Target'),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: HomeCoachMarks(
                      step: 0,
                      targetKey: target,
                      onNext: () => nextTaps++,
                      onSkip: () => skipTaps++,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);
      expect(find.bySemanticsLabel('Step 1 of 5'), findsOneWidget);
      for (var i = 0; i < 5; i++) {
        final dot = tester.widget<Container>(
          find.byKey(ValueKey('coach-dot-$i')),
        );
        final fill = (dot.decoration! as BoxDecoration).color;
        expect(fill == showBulb, i == 0);
      }
      await tester.tap(find.text('Target'));
      await tester.tapAt(tester.getCenter(find.text('Outside')));
      await tester.tap(find.byKey(const ValueKey('home-coach-next')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('home-coach-skip')));
      expect(targetTaps, 1);
      expect(outsideTaps, 0);
      expect(nextTaps, 1);
      expect(skipTaps, 1);
      final targetRect = tester.getRect(find.byKey(target));
      final scrim = find.byKey(const ValueKey('home-coach-scrim'));
      final card = tester.getRect(
        find.byKey(const ValueKey('home-coach-card')),
      );
      final skip = tester.getRect(
        find.byKey(const ValueKey('home-coach-skip')),
      );
      expect(skip.right, closeTo(card.right - 21, 1));
      final shadowPoint = targetRect.bottomCenter + const Offset(0, 2);
      expect(
        tester.renderObject(scrim),
        paints..path(
          includes: [targetRect.topLeft, const Offset(10, 10)],
          excludes: [
            targetRect.center,
            targetRect.topLeft + const Offset(5, 3),
            shadowPoint,
          ],
          style: PaintingStyle.fill,
        ),
      );
      final painter = tester.widget<CustomPaint>(scrim).painter!;
      expect(painter.hitTest(targetRect.center), isFalse);
      expect(painter.hitTest(shadowPoint), isTrue);
      expect(find.byKey(const ValueKey('home-coach-highlight')), findsNothing);
      expect(card.overlaps(targetRect), isFalse);
      expect(tester.takeException(), isNull);
      semantics.dispose();
    },
  );

  testWidgets('Next fades between steps and ignores repeated taps', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final targets = [GlobalKey(), GlobalKey()];
    var step = 0;
    var nextTaps = 0;
    await tester.pumpWidget(
      Settings(
        controller: SettingsController(),
        child: MaterialApp(
          theme: buildQuivroDarkTheme(),
          home: StatefulBuilder(
            builder: (context, setState) => Scaffold(
              body: Stack(
                children: [
                  Positioned(
                    top: 40,
                    left: 30,
                    child: SizedBox(key: targets[0], width: 64, height: 48),
                  ),
                  Positioned(
                    bottom: 40,
                    right: 30,
                    child: SizedBox(key: targets[1], width: 64, height: 48),
                  ),
                  Positioned.fill(
                    child: HomeCoachMarks(
                      step: step,
                      targetKey: targets[step == 0 ? 0 : 1],
                      onNext: () => setState(() {
                        nextTaps++;
                        step++;
                      }),
                      onSkip: () {},
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final transition = find.byKey(const ValueKey('home-coach-transition'));
    final next = find.byKey(const ValueKey('home-coach-next'));
    final card = find.byKey(const ValueKey('home-coach-card'));
    double opacity() => tester.widget<FadeTransition>(transition).opacity.value;
    final originalTop = tester.getTopLeft(card).dy;
    await tester.tap(next);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 80));
    expect(nextTaps, 0);
    expect(opacity(), allOf(greaterThan(0), lessThan(1)));
    expect(tester.getTopLeft(card).dy, lessThan(originalTop));
    expect(find.text(AppStrings.english.coachTitles[0]), findsOneWidget);
    expect(find.byKey(const ValueKey('home-coach-scrim')), findsOneWidget);
    await tester.tap(next);
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump();
    expect(nextTaps, 1);
    expect(find.text(AppStrings.english.coachTitles[1]), findsOneWidget);
    expect(opacity(), 0);
    final painter = tester
        .widget<CustomPaint>(find.byKey(const ValueKey('home-coach-scrim')))
        .painter!;
    expect(painter.hitTest(tester.getCenter(find.byKey(targets[1]))), isFalse);
    await tester.pump(const Duration(milliseconds: 80));
    expect(opacity(), allOf(greaterThan(0), lessThan(1)));
    await tester.tap(next);
    expect(nextTaps, 1);
    await tester.pumpAndSettle();
    expect(opacity(), 1);
    await tester.tap(next);
    await tester.pumpAndSettle();
    expect(nextTaps, 2);
    expect(tester.takeException(), isNull);
  });

  for (final skip in [true, false]) {
    testWidgets('pending Next is cancelled by ${skip ? 'Skip' : 'disposal'}', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      final target = GlobalKey();
      var visible = true;
      var nextTaps = 0;
      var skipTaps = 0;
      await tester.pumpWidget(
        Settings(
          controller: SettingsController(),
          child: MaterialApp(
            theme: buildQuivroTheme(),
            home: StatefulBuilder(
              builder: (context, setState) => Scaffold(
                body: Stack(
                  children: [
                    Positioned(
                      bottom: 40,
                      right: 30,
                      child: SizedBox(key: target, width: 64, height: 48),
                    ),
                    if (visible)
                      Positioned.fill(
                        child: HomeCoachMarks(
                          step: 0,
                          targetKey: target,
                          onNext: () => nextTaps++,
                          onSkip: () => setState(() {
                            skipTaps++;
                            visible = false;
                          }),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('home-coach-next')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 80));
      if (skip) {
        await tester.tap(find.byKey(const ValueKey('home-coach-skip')));
      } else {
        await tester.pumpWidget(const SizedBox.shrink());
      }
      await tester.pumpAndSettle();
      expect(nextTaps, 0);
      expect(skipTaps, skip ? 1 : 0);
      expect(find.byType(HomeCoachMarks), findsNothing);
      expect(tester.takeException(), isNull);
    });
  }

  for (final dark in [false, true]) {
    testWidgets('narrow large-text code step remains usable (dark: $dark)', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final settings = SettingsController();
      await settings.setLanguage(AppLanguage.bs);
      final target = GlobalKey();
      final code = TextEditingController();
      addTearDown(code.dispose);
      var finished = false;
      await tester.pumpWidget(
        Settings(
          controller: settings,
          child: MaterialApp(
            theme: dark ? buildQuivroDarkTheme() : buildQuivroTheme(),
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.linear(2),
                disableAnimations: true,
              ),
              child: child!,
            ),
            home: Scaffold(
              body: Stack(
                children: [
                  Positioned(
                    top: 300,
                    left: 20,
                    right: 20,
                    child: SizedBox(
                      key: target,
                      height: 64,
                      child: TextField(controller: code),
                    ),
                  ),
                  Positioned.fill(
                    child: HomeCoachMarks(
                      step: 4,
                      targetKey: target,
                      onNext: () => finished = true,
                      onSkip: () {},
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(code.text, isEmpty);
      expect(find.text(AppStrings.bosnian.coachTitles[4]), findsOneWidget);
      expect(find.text('U REDU').hitTestable(), findsOneWidget);
      await tester.tap(find.byType(TextField));
      await tester.enterText(find.byType(TextField), 'ABC123');
      tester.view.viewInsets = const FakeViewPadding(bottom: 250);
      addTearDown(tester.view.resetViewInsets);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      final card = tester.getRect(
        find.byKey(const ValueKey('home-coach-card')),
      );
      final targetRect = tester.getRect(find.byKey(target));
      expect(
        tester.renderObject(find.byKey(const ValueKey('home-coach-scrim'))),
        paints..path(
          includes: [targetRect.topLeft + const Offset(6, 4)],
          excludes: [
            targetRect.center,
            targetRect.centerRight + const Offset(2, 0),
            targetRect.bottomCenter + const Offset(0, 2),
          ],
          style: PaintingStyle.fill,
        ),
      );
      expect(card.overlaps(targetRect), isFalse);
      expect(card.top, greaterThanOrEqualTo(0));
      expect(card.bottom, lessThanOrEqualTo(450));
      await tester.tap(find.byKey(const ValueKey('home-coach-next')));
      expect(finished, isTrue);
      expect(code.text, 'ABC123');
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets(
    'spotlight follows its target while the underlying page scrolls',
    (tester) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final target = GlobalKey();
      final scroll = ScrollController();
      addTearDown(scroll.dispose);
      await tester.pumpWidget(
        Settings(
          controller: SettingsController(),
          child: MaterialApp(
            theme: buildQuivroTheme(),
            home: Scaffold(
              body: Stack(
                children: [
                  SingleChildScrollView(
                    controller: scroll,
                    child: Column(
                      children: [
                        const SizedBox(height: 600),
                        SizedBox(key: target, width: 250, height: 60),
                        const SizedBox(height: 600),
                      ],
                    ),
                  ),
                  Positioned.fill(
                    child: HomeCoachMarks(
                      step: 1,
                      targetKey: target,
                      onNext: () {},
                      onSkip: () {},
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      scroll.jumpTo(200);
      await tester.pumpAndSettle();
      final targetRect = tester.getRect(find.byKey(target));
      expect(
        tester.renderObject(find.byKey(const ValueKey('home-coach-scrim'))),
        paints..path(
          includes: [targetRect.center + const Offset(0, 200)],
          excludes: [targetRect.center],
        ),
      );
      expect(tester.takeException(), isNull);
    },
  );
}
