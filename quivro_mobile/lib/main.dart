import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'core/profile_store.dart';
import 'core/settings.dart';
import 'core/theme.dart';
import 'screens/home_page.dart';
import 'screens/room_page.dart';
import 'screens/setup_page.dart';
import 'screens/splash_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // All heavy initialization (Firebase, profile, session resolve) happens on
  // the splash screen via AppBootstrapper, so the first frame paints fast.
  // Settings load in parallel: SharedPreferences only, resolves in
  // milliseconds and notifies the app when done.
  final settings = SettingsController();
  unawaited(settings.load());
  runApp(QuivroApp(settings: settings));
}

class QuivroApp extends StatefulWidget {
  const QuivroApp({super.key, required this.settings});

  final SettingsController settings;

  @override
  State<QuivroApp> createState() => _QuivroAppState();
}

class _QuivroAppState extends State<QuivroApp> {
  late final GoRouter _router = GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        pageBuilder: (context, state) =>
            NoTransitionPage(key: state.pageKey, child: const SplashPage()),
      ),
      GoRoute(
        path: '/setup',
        pageBuilder: (context, state) {
          final extra = state.extra;
          Widget page;
          if (extra is Map) {
            page = SetupPage(
              existing: extra['existing'] is PlayerProfile
                  ? extra['existing'] as PlayerProfile
                  : null,
              returnTo: extra['returnTo'] is String
                  ? extra['returnTo'] as String
                  : null,
              returnPlayerId: extra['returnPlayerId'] is String
                  ? extra['returnPlayerId'] as String
                  : null,
            );
          } else {
            page = SetupPage(existing: extra is PlayerProfile ? extra : null);
          }
          return _fadeThroughPage(key: state.pageKey, child: page);
        },
      ),
      GoRoute(
        path: '/',
        pageBuilder: (context, state) {
          final profile = state.extra is PlayerProfile
              ? state.extra as PlayerProfile
              : null;
          return _fadeThroughPage(
            key: state.pageKey,
            child: profile != null
                ? HomePage(profile: profile)
                : const _StoredProfileGate(),
          );
        },
      ),
      GoRoute(
        path: '/room/:code',
        pageBuilder: (context, state) {
          final code = (state.pathParameters['code'] ?? '').toUpperCase();
          final extra = state.extra;
          Widget page;
          if (extra is Map) {
            page = RoomPage(
              code: code,
              playerId: '${extra['playerId']}',
              profile: extra['profile'] as PlayerProfile,
            );
          } else {
            // No extra (e.g. setup "Cancel" edge case): resume from the
            // stored session if it matches this room.
            page = _StoredSessionGate(code: code);
          }
          return _fadeThroughPage(key: state.pageKey, child: page);
        },
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.settings,
      builder: (context, _) => Settings(
        controller: widget.settings,
        child: MaterialApp.router(
          title: 'Quivro',
          debugShowCheckedModeBanner: false,
          theme: buildQuivroTheme(),
          darkTheme: buildQuivroDarkTheme(),
          themeMode: widget.settings.themeMode,
          // Soft cross-fade when toggling day/night.
          themeAnimationDuration: const Duration(milliseconds: 300),
          themeAnimationCurve: Curves.easeInOut,
          locale: widget.settings.language.locale,
          supportedLocales: const [Locale('en'), Locale('bs')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          routerConfig: _router,
        ),
      ),
    );
  }
}

/// Fade-through transition used when leaving the splash screen (and between
/// top-level routes) so screen changes feel seamless.
CustomTransitionPage<void> _fadeThroughPage({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: key,
    child: child,
    transitionDuration: const Duration(milliseconds: 450),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final fade = CurvedAnimation(
        parent: animation,
        curve: const Interval(0.25, 1, curve: Curves.easeOut),
      );
      final scale = Tween<double>(
        begin: 0.98,
        end: 1,
      ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
      return FadeTransition(
        opacity: fade,
        child: ScaleTransition(scale: scale, child: child),
      );
    },
  );
}

/// Fallback for `/` when no profile was passed: loads it from local storage.
class _StoredProfileGate extends StatelessWidget {
  const _StoredProfileGate();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PlayerProfile?>(
      future: ProfileStore().load(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: SizedBox.shrink());
        }
        final profile = snapshot.data;
        if (profile == null) return const SetupPage();
        return HomePage(profile: profile);
      },
    );
  }
}

/// Fallback for `/room/:code` without navigation extras: resumes from the
/// stored active session when it matches, otherwise goes to setup.
class _StoredSessionGate extends StatelessWidget {
  const _StoredSessionGate({required this.code});

  final String code;

  static Future<(PlayerProfile?, ActiveRoomSession?)> _load() async {
    final store = ProfileStore();
    return (await store.load(), await store.loadActiveSession());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<(PlayerProfile?, ActiveRoomSession?)>(
      future: _load(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: SizedBox.shrink());
        }
        final (profile, session) = snapshot.data ?? (null, null);
        if (profile != null && session != null && session.code == code) {
          return RoomPage(
            code: session.code,
            playerId: session.playerId,
            profile: profile,
          );
        }
        return SetupPage(existing: profile);
      },
    );
  }
}
