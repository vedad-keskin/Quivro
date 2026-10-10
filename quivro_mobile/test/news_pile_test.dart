import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/news_pile.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  for (final reduce in [false, true]) {
    testWidgets('news reuses cards and navigates (reduced motion: $reduce)', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final key = GlobalKey<NewsPileState>();
      await tester.pumpWidget(
        Settings(
          controller: SettingsController(),
          child: MaterialApp(
            theme: reduce ? buildQuivroDarkTheme() : buildQuivroTheme(),
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context).copyWith(disableAnimations: reduce),
              child: child!,
            ),
            home: Scaffold(body: NewsPile(key: key)),
          ),
        ),
      );
      await tester.pumpAndSettle();

      Future<void> step(String label) async {
        await tester.tap(find.text(label).hitTestable());
        await tester.pump();
        final titles = find.text('Lock Up is here');
        final before = tester.widgetList(titles).toList();
        await tester.pump(const Duration(milliseconds: 80));
        final after = tester.widgetList(titles).toList();
        expect(after.length, before.length);
        for (var i = 0; i < before.length; i++) {
          expect(
            identical(before[i], after[i]),
            isTrue,
            reason: 'Card content must not rebuild on animation frames',
          );
        }
        await tester.pumpAndSettle();
      }

      await step('NEXT');
      expect(find.text('Lock Up is here').hitTestable(), findsOneWidget);
      await step('PREVIOUS');
      expect(find.text('Double it is here').hitTestable(), findsOneWidget);

      final title = find.text('Double it is here').hitTestable();
      final beforeDrag = tester.widget(title);
      final restingCenter = tester.getCenter(title);
      final gesture = await tester.startGesture(restingCenter);
      await gesture.moveBy(const Offset(-30, 0));
      await tester.pump();
      await gesture.moveBy(const Offset(-20, 0));
      await tester.pump();
      expect(
        identical(tester.widget(title), beforeDrag),
        isTrue,
        reason: 'Dragging must reuse card content too',
      );
      await gesture.cancel();
      await tester.pumpAndSettle();
      expect(find.text('Double it is here').hitTestable(), findsOneWidget);
      expect(
        (tester.getCenter(title) - restingCenter).distance,
        lessThan(0.01),
      );

      await tester.fling(title, const Offset(-150, 0), 800);
      await tester.pumpAndSettle();
      expect(find.text('Lock Up is here').hitTestable(), findsOneWidget);
      await step('NEXT');
      await step('NEXT');
      expect(find.text('50/50 is here').hitTestable(), findsOneWidget);
      await tester.tap(find.text('GOT IT').hitTestable());
      await tester.pumpAndSettle();
      expect(find.text('50/50 is here'), findsNothing);
      final prefs = await SharedPreferences.getInstance();
      expect(
        jsonDecode(prefs.getString('quivro.news.seen')!),
        newsDrops.map((drop) => drop.id).toList(),
      );
      key.currentState!.openAll();
      await tester.pumpAndSettle();
      expect(find.text('Double it is here').hitTestable(), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('bosnian news nav stays on one row on a narrow phone', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final controller = SettingsController();
    await controller.setLanguage(AppLanguage.bs);
    await tester.pumpWidget(
      Settings(
        controller: controller,
        child: MaterialApp(
          theme: buildQuivroTheme(),
          home: const Scaffold(body: NewsPile()),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final prevText = find.text('PRETHODNO').hitTestable();
    final nextText = find.text('SLJEDEĆE').hitTestable();
    final row = tester.renderObject<RenderBox>(
      find.ancestor(of: prevText, matching: find.byType(Row)),
    );
    Offset centerInRow(Finder text) {
      final box = tester.renderObject<RenderBox>(text);
      return row.globalToLocal(box.localToGlobal(box.size.center(Offset.zero)));
    }

    final prev = centerInRow(prevText);
    final next = centerInRow(nextText);
    expect((prev.dy - next.dy).abs(), lessThan(1));
    expect(next.dx, greaterThan(prev.dx));
    expect(tester.takeException(), isNull);
  });
}
