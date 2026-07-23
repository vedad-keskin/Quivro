import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Languages the app UI can be displayed in.
enum AppLanguage {
  en(Locale('en'), 'English', 'assets/flags/en.png'),
  bs(Locale('bs'), 'Bosanski', 'assets/flags/bs.png');

  const AppLanguage(this.locale, this.nativeName, this.flagAsset);

  final Locale locale;
  final String nativeName;
  final String flagAsset;
}

/// App-wide user preferences: UI language and day/night theme.
///
/// Loaded once at startup (fast, SharedPreferences only) and kept alive for
/// the whole app run. Widgets read it through the [Settings] inherited
/// widget so they rebuild when a preference changes.
class SettingsController extends ChangeNotifier {
  static const _langKey = 'quivro.lang';
  static const _themeKey = 'quivro.theme';

  AppLanguage _language = AppLanguage.en;
  ThemeMode _themeMode = ThemeMode.light;
  bool _loaded = false;

  AppLanguage get language => _language;
  ThemeMode get themeMode => _themeMode;
  bool get isNight => _themeMode == ThemeMode.dark;

  /// Restores persisted choices. When the user never explicitly picked a
  /// language, falls back to the device language: Bosnian for bs/hr/sr
  /// locales (mutually intelligible), English otherwise.
  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    final prefs = await SharedPreferences.getInstance();

    final storedLang = prefs.getString(_langKey);
    if (storedLang != null) {
      _language = storedLang == 'bs' ? AppLanguage.bs : AppLanguage.en;
    } else {
      final device = PlatformDispatcher.instance.locale.languageCode;
      if (const {'bs', 'hr', 'sr'}.contains(device)) {
        _language = AppLanguage.bs;
      }
    }

    _themeMode = prefs.getString(_themeKey) == 'dark'
        ? ThemeMode.dark
        : ThemeMode.light;
    notifyListeners();
  }

  Future<void> setLanguage(AppLanguage language) async {
    if (_language == language) return;
    _language = language;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_langKey, language.name);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode == ThemeMode.dark ? 'dark' : 'light');
  }

  Future<void> toggleTheme() =>
      setThemeMode(isNight ? ThemeMode.light : ThemeMode.dark);
}

/// Exposes the [SettingsController] to the widget tree. Dependents rebuild
/// automatically whenever a preference changes.
class Settings extends InheritedNotifier<SettingsController> {
  const Settings({
    super.key,
    required SettingsController controller,
    required super.child,
  }) : super(notifier: controller);

  static SettingsController of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<Settings>()!.notifier!;
}

extension SettingsX on BuildContext {
  SettingsController get settings => Settings.of(this);
}
