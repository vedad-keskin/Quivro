import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/host_hint.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  for (final dark in [false, true]) {
    testWidgets(
      'hosting poster fits and uses a readable copy icon (dark: $dark)',
      (tester) async {
        SharedPreferences.setMockInitialValues({});
        tester.view.physicalSize = const Size(320, 700);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        final key = GlobalKey<HostHintState>();
        final anchor = GlobalKey();
        final progress = ValueNotifier<double>(1);
        await tester.pumpWidget(
          Settings(
            controller: SettingsController(),
            child: MaterialApp(
              theme: dark ? buildQuivroDarkTheme() : buildQuivroTheme(),
              home: Scaffold(
                body: Stack(
                  children: [
                    Align(
                      alignment: Alignment.bottomLeft,
                      child: HostTvChip(
                        key: anchor,
                        onTap: () => key.currentState!.expand(),
                      ),
                    ),
                    Positioned.fill(
                      child: HostHint(
                        key: key,
                        progress: progress,
                        anchorKey: anchor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(anchor));
        await tester.pumpAndSettle();
        expect(progress.value, 0);
        expect(find.text('quivro.org').hitTestable(), findsOneWidget);
        expect(
          tester.widget<Icon>(find.byIcon(Icons.copy_rounded)).color,
          (dark ? QuivroPalette.dark : QuivroPalette.light).text,
        );
        expect(tester.takeException(), isNull);
        final closed = key.currentState!.collapse();
        await tester.pumpAndSettle();
        await closed;
        expect(progress.value, 1);
        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getBool('quivro.hostHintSeen'), isTrue);
        await tester.pumpWidget(const SizedBox.shrink());
        progress.dispose();
      },
    );
  }
}
