import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/settings.dart';
import 'package:quivro_mobile/core/strings.dart';
import 'package:quivro_mobile/core/theme.dart';
import 'package:quivro_mobile/widgets/host_hint.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('hosting banner fits small screens and stays informational', (
    tester,
  ) async {
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    tester.view.devicePixelRatio = 1;
    SharedPreferences.setMockInitialValues({});

    for (final size in const [
      Size(320, 568),
      Size(360, 640),
      Size(390, 844),
      Size(430, 932),
    ]) {
      tester.view.physicalSize = size;
      for (final language in AppLanguage.values) {
        final settings = SettingsController();
        await settings.setLanguage(language);
        final strings = AppStrings.forLanguage(language);
        for (final dark in [false, true]) {
          for (final scale in [1.0, 1.3, 2.0]) {
            final description =
                '$size ${language.name} dark:$dark scale:$scale';
            await tester.pumpWidget(
              Settings(
                controller: settings,
                child: MaterialApp(
                  theme: dark ? buildQuivroDarkTheme() : buildQuivroTheme(),
                  builder: (context, child) => MediaQuery(
                    data: MediaQuery.of(
                      context,
                    ).copyWith(textScaler: TextScaler.linear(scale)),
                    child: child!,
                  ),
                  home: Scaffold(
                    body: SingleChildScrollView(
                      padding: const EdgeInsets.all(28),
                      child: const HostHomeBanner(),
                    ),
                  ),
                ),
              ),
            );
            await tester.pumpAndSettle();
            final banner = find.byType(HostHomeBanner);
            expect(tester.takeException(), isNull, reason: description);
            expect(
              tester.getSize(banner).width,
              size.width - 56,
              reason: description,
            );
            if (scale == 1) {
              // Flutter's test font is wider than the app's Lilita face.
              expect(
                tester.getSize(banner).height,
                inInclusiveRange(78, 160),
                reason: description,
              );
            }
            expect(
              tester.getSemantics(
                find
                    .descendant(of: banner, matching: find.byType(Semantics))
                    .first,
              ),
              matchesSemantics(
                label:
                    '${strings.hostBannerTitle} quivro.org. '
                    '${strings.hostBannerDescription}',
                isButton: false,
                hasTapAction: false,
              ),
              reason: description,
            );
            expect(find.byIcon(Icons.north_east), findsOneWidget);
            expect(find.byIcon(Icons.language), findsNothing);
            await tester.tap(banner, warnIfMissed: false);
            expect(tester.takeException(), isNull, reason: description);
          }
        }
        await tester.pumpWidget(const SizedBox.shrink());
        settings.dispose();
      }
    }
  });

  testWidgets(
    'hosting banner close stays reachable without making body a button',
    (tester) async {
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      tester.view.physicalSize = const Size(320, 568);
      tester.view.devicePixelRatio = 1;
      SharedPreferences.setMockInitialValues({});

      for (final language in AppLanguage.values) {
        final settings = SettingsController();
        await settings.setLanguage(language);
        final strings = AppStrings.forLanguage(language);
        for (final scale in [1.0, 2.0]) {
          final description = '${language.name} scale:$scale';
          var closes = 0;
          await tester.pumpWidget(
            Settings(
              controller: settings,
              child: MaterialApp(
                key: ValueKey(description),
                theme: buildQuivroTheme(),
                builder: (context, child) {
                  final nativeMediaQuery = MediaQuery.of(context);
                  return MediaQuery(
                    data: nativeMediaQuery.copyWith(
                      textScaler: TextScaler.linear(scale),
                    ),
                    child: child!,
                  );
                },
                home: Scaffold(
                  body: SingleChildScrollView(
                    padding: const EdgeInsets.all(28),
                    child: HostHomeBanner(onClose: () => closes++),
                  ),
                ),
              ),
            ),
          );
          await tester.pumpAndSettle();
          final banner = find.byType(HostHomeBanner);
          final close = find.byTooltip(strings.close);
          final bannerRect = tester.getRect(banner);
          final closeRect = tester.getRect(close);
          expect(closeRect.size, const Size(48, 48), reason: description);
          expect(closeRect.top, bannerRect.top, reason: description);
          expect(closeRect.right, bannerRect.right, reason: description);
          final closeFace = find.byKey(
            const ValueKey('host-banner-close-face'),
          );
          final face = tester.widget<Container>(closeFace);
          final faceContext = tester.element(closeFace);
          expect(tester.getSize(closeFace), const Size(28, 28));
          expect(
            face.decoration,
            showPanel(
              ink: showInk(faceContext),
              fill: faceContext.palette.card,
              radius: 8,
              shadow: const Offset(0, 3),
            ),
            reason: '$description matches outlined app controls',
          );
          expect(
            bannerRect.contains(closeRect.bottomLeft),
            isTrue,
            reason: description,
          );
          final yellowCard = find.descendant(
            of: banner,
            matching: find.byWidgetPredicate(
              (widget) =>
                  widget is Container &&
                  widget.decoration is BoxDecoration &&
                  (widget.decoration! as BoxDecoration).color == showBulb,
            ),
          );
          expect(
            tester.getTopLeft(yellowCard).dy - bannerRect.top,
            16,
            reason: description,
          );
          expect(
            tester.getSemantics(close),
            matchesSemantics(
              tooltip: strings.close,
              isButton: true,
              hasEnabledState: true,
              isEnabled: true,
              isFocusable: true,
              hasTapAction: true,
              hasFocusAction: true,
            ),
            reason: description,
          );
          await tester.tap(find.text('quivro.org'));
          await tester.tap(find.text(strings.hostBannerTitle).last);
          expect(closes, 0, reason: description);
          await tester.tap(close);
          await tester.pump();
          expect(closes, 1, reason: description);

          FocusManager.instance.primaryFocus?.unfocus();
          await tester.pump();
          await tester.sendKeyEvent(LogicalKeyboardKey.tab);
          await tester.pump();
          await tester.sendKeyEvent(LogicalKeyboardKey.enter);
          await tester.pump();
          expect(closes, 2, reason: '$description keyboard activation');
          expect(tester.takeException(), isNull, reason: description);
        }
        await tester.pumpWidget(const SizedBox.shrink());
        settings.dispose();
      }
    },
  );
}
