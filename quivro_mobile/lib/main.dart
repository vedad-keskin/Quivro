import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/profile_store.dart';
import 'core/room_repository.dart';
import 'core/theme.dart';
import 'firebase_options.dart';
import 'screens/home_page.dart';
import 'screens/room_page.dart';
import 'screens/setup_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  final store = ProfileStore();
  final profile = await store.load();
  ActiveRoomSession? session;
  if (profile != null) {
    session = await RoomRepository(profileStore: store).resolveActiveSession();
  }
  runApp(QuivroApp(initialProfile: profile, initialSession: session));
}

class QuivroApp extends StatefulWidget {
  const QuivroApp({super.key, this.initialProfile, this.initialSession});

  final PlayerProfile? initialProfile;
  final ActiveRoomSession? initialSession;

  @override
  State<QuivroApp> createState() => _QuivroAppState();
}

class _QuivroAppState extends State<QuivroApp> {
  late final GoRouter _router = GoRouter(
    initialLocation: _initialLocation(),
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
          final code = (state.pathParameters['code'] ?? '').toUpperCase();
          final extra = state.extra;
          if (extra is Map) {
            final playerId = '${extra['playerId']}';
            final profile = extra['profile'] as PlayerProfile;
            return RoomPage(
              code: code,
              playerId: playerId,
              profile: profile,
            );
          }
          // Cold-start rejoin: session validated in main().
          final session = widget.initialSession;
          final profile = widget.initialProfile;
          if (session != null &&
              profile != null &&
              session.code == code) {
            return RoomPage(
              code: session.code,
              playerId: session.playerId,
              profile: profile,
            );
          }
          return const SetupPage();
        },
      ),
    ],
  );

  String _initialLocation() {
    if (widget.initialProfile == null) return '/setup';
    final session = widget.initialSession;
    if (session != null) return '/room/${session.code}';
    return '/';
  }

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
