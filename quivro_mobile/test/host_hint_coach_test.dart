import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/strings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/home_coach_marks.dart';
import 'package:quivro_mobile/widgets/host_hint.dart';

void main() {
  for (final dark in [false, true]) {
    testWidgets('hosting coach spotlights the banner (dark: $dark)', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final target = GlobalKey();
      var next = 0;
      await tester.pumpWidget(
        Settings(
          controller: SettingsController(),
          child: MaterialApp(
            theme: dark ? buildQuivroDarkTheme() : buildQuivroTheme(),
            home: Scaffold(
              body: Stack(
                children: [
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.all(28),
                      child: HostHomeBanner(key: target),
                    ),
                  ),
                  Positioned.fill(
                    child: HomeCoachMarks(
                      step: 3,
                      targetKey: target,
                      onNext: () => next++,
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
      final banner = find.byType(HostHomeBanner);
      final rect = tester.getRect(banner);
      final card = tester.getRect(
        find.byKey(const ValueKey('home-coach-card')),
      );
      expect(card.overlaps(rect), isFalse);
      final painter = tester
          .widget<CustomPaint>(find.byKey(const ValueKey('home-coach-scrim')))
          .painter!;
      expect(painter.hitTest(rect.center), isFalse);
      expect(painter.hitTest(rect.topLeft + const Offset(30, -6)), isFalse);
      expect(find.text(AppStrings.english.coachBodies[3]), findsOneWidget);
      await tester.tap(banner, warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(find.byType(HomeCoachMarks), findsOneWidget);
      expect(find.byIcon(Icons.copy_rounded), findsNothing);
      await tester.tap(find.byKey(const ValueKey('home-coach-next')));
      await tester.pumpAndSettle();
      expect(next, 1);
      expect(tester.takeException(), isNull);
    });
  }
}
