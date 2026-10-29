import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('unset theme follows the phone', () async {
    SharedPreferences.setMockInitialValues({});
    final settings = SettingsController();
    await settings.load();
    expect(settings.themeMode, ThemeMode.system);
  });

  test('saved light and dark stay explicit', () async {
    SharedPreferences.setMockInitialValues({'quivro.theme': 'dark'});
    final dark = SettingsController();
    await dark.load();
    expect(dark.themeMode, ThemeMode.dark);

    SharedPreferences.setMockInitialValues({'quivro.theme': 'light'});
    final light = SettingsController();
    await light.load();
    expect(light.themeMode, ThemeMode.light);
  });

  testWidgets('system bars follow day, night, and the phone theme', (
    tester,
  ) async {
    final mode = ValueNotifier(ThemeMode.light);
    addTearDown(mode.dispose);
    tester.platformDispatcher.platformBrightnessTestValue = Brightness.dark;
    addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
    tester.view.padding = const FakeViewPadding(top: 24, bottom: 24);
    addTearDown(tester.view.resetPadding);

    await tester.pumpWidget(
      ValueListenableBuilder<ThemeMode>(
        valueListenable: mode,
        builder: (context, themeMode, _) => MaterialApp(
          theme: buildQuivroTheme(),
          darkTheme: buildQuivroDarkTheme(),
          themeMode: themeMode,
          builder: buildQuivroSystemBars,
          home: const Scaffold(),
        ),
      ),
    );
    for (final themeMode in [
      ThemeMode.light,
      ThemeMode.dark,
      ThemeMode.light,
      ThemeMode.system,
    ]) {
      mode.value = themeMode;
      await tester.pumpAndSettle();
      final night = themeMode != ThemeMode.light;
      final style = SystemChrome.latestStyle!;
      expect(
        style.systemNavigationBarColor,
        night ? const Color(0xFF0E1430) : Colors.white,
      );
      expect(style.systemNavigationBarContrastEnforced, isFalse);
      expect(style.systemNavigationBarDividerColor, Colors.transparent);
      expect(
        style.systemNavigationBarIconBrightness,
        night ? Brightness.light : Brightness.dark,
      );
      expect(style.statusBarColor, Colors.transparent);
      expect(
        style.statusBarIconBrightness,
        night ? Brightness.light : Brightness.dark,
      );
      expect(
        style.statusBarBrightness,
        night ? Brightness.dark : Brightness.light,
      );
    }
  });
}
