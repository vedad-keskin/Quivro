import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
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
}
