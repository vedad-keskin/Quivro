import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/bootstrap.dart';
import 'package:quivro_mobile/core/profile_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'first open is consumed before profile setup or news dismissal',
    () async {
      SharedPreferences.setMockInitialValues({});
      final store = ProfileStore();
      expect(await store.claimFirstOpenCoachMarks(), isTrue);
      expect(await ProfileStore().claimFirstOpenCoachMarks(), isFalse);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('quivro.firstOpenConsumed'), isTrue);
      expect(await store.load(), isNull);
    },
  );

  for (final previous in [
    {'quivro.nickname': 'Vedo'},
    {'quivro.news.seen': '[]'},
    {'quivro.firstOpenConsumed': true},
  ]) {
    test('returning app data suppresses coaching: $previous', () async {
      SharedPreferences.setMockInitialValues(previous);
      expect(await ProfileStore().claimFirstOpenCoachMarks(), isFalse);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('quivro.firstOpenConsumed'), isTrue);
    });
  }

  test(
    'malformed first-open preference suppresses optional coaching',
    () async {
      SharedPreferences.setMockInitialValues({
        'quivro.firstOpenConsumed': 'bad',
      });
      expect(await ProfileStore().claimFirstOpenCoachMarks(), isFalse);
    },
  );

  test('ordinary and fatal boot results do not opt into coaching', () {
    expect(const BootResult().showCoachMarks, isFalse);
    expect(
      BootResult(fatalError: StateError('boot failed')).showCoachMarks,
      isFalse,
    );
    expect(
      const BootResult(isOffline: true, showCoachMarks: true).showCoachMarks,
      isTrue,
    );
  });
}
