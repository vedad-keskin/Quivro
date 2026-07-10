import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/profile_store.dart';
import 'core/theme.dart';
import 'firebase_options.dart';
import 'screens/home_page.dart';
import 'screens/room_page.dart';
import 'screens/setup_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  final profile = await ProfileStore().load();
  runApp(QuivroApp(initialProfile: profile));
}

class QuivroApp extends StatefulWidget {
  const QuivroApp({super.key, this.initialProfile});

  final PlayerProfile? initialProfile;

  @override
  State<QuivroApp> createState() => _QuivroAppState();
}

class _QuivroAppState extends State<QuivroApp> {
  late final GoRouter _router = GoRouter(
    initialLocation: widget.initialProfile == null ? '/setup' : '/',
    routes: [
      GoRoute(
        path: '/setup',
        builder: (context, state) {
          final existing = state.extra is PlayerProfile
              ? state.extra as PlayerProfile
              : widget.initialProfile;
          return SetupPage(existing: existing);
        },
      ),
      GoRoute(
        path: '/',
        builder: (context, state) {
          final profile = state.extra is PlayerProfile
              ? state.extra as PlayerProfile
              : widget.initialProfile;
          if (profile == null) {
            return const SetupPage();
          }
          return HomePage(profile: profile);
        },
      ),
      GoRoute(
        path: '/room/:code',
        builder: (context, state) {
          final code = state.pathParameters['code'] ?? '';
          final extra = state.extra;
          if (extra is! Map) {
            return const SetupPage();
          }
          final playerId = '${extra['playerId']}';
          final profile = extra['profile'] as PlayerProfile;
          return RoomPage(
            code: code,
            playerId: playerId,
            profile: profile,
          );
        },
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Quivro',
      debugShowCheckedModeBanner: false,
      theme: buildQuivroTheme(),
      routerConfig: _router,
    );
  }
}
