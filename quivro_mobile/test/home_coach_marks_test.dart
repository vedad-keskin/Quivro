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
