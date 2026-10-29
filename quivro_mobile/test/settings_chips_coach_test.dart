import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/strings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/settings_chips.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  for (final language in AppLanguage.values) {
    testWidgets('scaled ${language.name} chips fit a narrow footer', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final semantics = tester.ensureSemantics();
      final settings = SettingsController();
      await settings.setLanguage(language);
      await settings.setThemeMode(ThemeMode.dark);
      final languageKey = GlobalKey();
      final themeKey = GlobalKey();
      await tester.pumpWidget(
        Settings(
          controller: settings,
          child: MaterialApp(
            theme: buildQuivroTheme(),
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: TextScaler.linear(2)),
              child: child!,
            ),
            home: Scaffold(
              body: Center(
                child: SizedBox(
                  width: 264,
                  child: SettingsChips(
                    languageKey: languageKey,
                    themeKey: themeKey,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      for (final key in [languageKey, themeKey]) {
        final bounds = tester.getRect(find.byKey(key));
        expect(bounds.left, greaterThanOrEqualTo(28));
        expect(bounds.right, lessThanOrEqualTo(292));
        expect(bounds.height, greaterThanOrEqualTo(48));
      }
      expect(
        tester.getSemantics(find.byKey(languageKey)).label,
        language.name.toUpperCase(),
      );
      expect(
        tester.getSemantics(find.byKey(themeKey)).label,
        AppStrings.forLanguage(language).themeNight,
      );
      semantics.dispose();
    });
  }

  testWidgets('coach targets keep real actions and report language dismissal', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final settings = SettingsController();
    await settings.setThemeMode(ThemeMode.light);
    final languageKey = GlobalKey();
    final themeKey = GlobalKey();
    final events = <bool>[];
    var languageEnabled = false;
    late StateSetter update;
    await tester.pumpWidget(
      Settings(
        controller: settings,
        child: MaterialApp(
          theme: buildQuivroTheme(),
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                update = setState;
                return Center(
                  child: SettingsChips(
                    languageKey: languageKey,
                    themeKey: themeKey,
                    languageEnabled: languageEnabled,
                    onLanguageSheetChanged: events.add,
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      tester.getSize(find.byKey(languageKey)).height,
      greaterThanOrEqualTo(48),
    );
    expect(
      tester.getSize(find.byKey(themeKey)).height,
      greaterThanOrEqualTo(48),
    );

    await tester.tap(find.byKey(languageKey), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(events, isEmpty);
    await tester.tap(find.byKey(themeKey));
    await tester.pumpAndSettle();
    expect(settings.themeMode, ThemeMode.dark);

    update(() => languageEnabled = true);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(languageKey));
    await tester.pumpAndSettle();
    expect(events, [true]);
    await tester.tap(find.text('Bosanski'));
    await tester.pumpAndSettle();
    expect(settings.language, AppLanguage.bs);
    expect(events, [true, false]);

    await tester.tap(find.byKey(languageKey));
    await tester.pumpAndSettle();
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(events, [true, false, true, false]);
    expect(tester.takeException(), isNull);
  });
}
