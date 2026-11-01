import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('hosting banner starts expanded without a stored preference', () async {
    SharedPreferences.setMockInitialValues({});
    final settings = SettingsController();
    addTearDown(settings.dispose);
    expect(settings.hostBannerExpanded, isTrue);
    await settings.load();
    expect(settings.hostBannerExpanded, isTrue);
  });

  for (final expanded in [false, true]) {
    test('hosting banner restores stored expanded=$expanded', () async {
      SharedPreferences.setMockInitialValues({
        'quivro.hostBannerExpanded': expanded,
      });
      final settings = SettingsController();
      addTearDown(settings.dispose);
      await settings.load();
      expect(settings.hostBannerExpanded, expanded);
    });
  }

  test(
    'hosting banner choices update immediately and survive reloads',
    () async {
      SharedPreferences.setMockInitialValues({});
      final settings = SettingsController();
      addTearDown(settings.dispose);
      await settings.load();
      var notifications = 0;
      settings.addListener(() => notifications++);

      for (final expanded in [false, true]) {
        final saving = settings.setHostBannerExpanded(expanded);
        expect(settings.hostBannerExpanded, expanded);
        expect(notifications, expanded ? 2 : 1);
        await saving;
        final restored = SettingsController();
        await restored.load();
        expect(restored.hostBannerExpanded, expanded);
        restored.dispose();
      }
    },
  );

  for (final chosen in [false, true]) {
    test('explicit expanded=$chosen survives a pending restore', () async {
      SharedPreferences.setMockInitialValues({
        'quivro.hostBannerExpanded': !chosen,
      });
      final settings = SettingsController();
      addTearDown(settings.dispose);
      final restoring = settings.load();
      final saving = settings.setHostBannerExpanded(chosen);
      expect(settings.hostBannerExpanded, chosen);
      await Future.wait([restoring, saving]);
      expect(settings.hostBannerExpanded, chosen);

      final restored = SettingsController();
      addTearDown(restored.dispose);
      await restored.load();
      expect(restored.hostBannerExpanded, chosen);
    });
  }
}
