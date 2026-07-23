import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_core/firebase_core.dart';
import '../firebase_options.dart';
import 'profile_store.dart';
import 'room_repository.dart';

/// Outcome of the app bootstrap sequence.
///
/// Never carries a "half broken" state: [fatalError] is only set when core
/// init (Firebase) failed and the app cannot work at all. Offline is not
/// fatal — the app continues with cached data and [isOffline] set.
class BootResult {
  const BootResult({
    this.profile,
    this.session,
    this.isOffline = false,
    this.fatalError,
  });

  final PlayerProfile? profile;
  final ActiveRoomSession? session;
  final bool isOffline;
  final Object? fatalError;

  bool get isFatal => fatalError != null;

  /// Route the splash screen should land on once boot completes.
  String get initialLocation {
    if (profile == null) return '/setup';
    if (session != null) return '/room/${session!.code}';
    return '/';
  }
}

/// Runs every startup task the app needs before showing the first real
/// screen, while the splash animation plays.
///
/// Guarantees:
/// - Never throws. Offline / timeout degrade gracefully into [BootResult].
/// - The RTDB session check is bounded by [sessionTimeout] so a dead
///   connection can never hang the splash screen.
class AppBootstrapper {
  AppBootstrapper({this.sessionTimeout = const Duration(seconds: 4)});

  final Duration sessionTimeout;

  Future<BootResult> run() async {
    // 1. Firebase core — required for everything else. A failure here is the
    //    only truly fatal outcome (and is rare: it does not need network).
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } on FirebaseException catch (e) {
      // Hot-restart / retry can hit "already exists" — that's fine.
      if (e.code != 'duplicate-app') {
        return BootResult(fatalError: e);
      }
    } catch (e) {
      return BootResult(fatalError: e);
    }

    // 2. Local profile — SharedPreferences, works fully offline.
    final store = ProfileStore();
    PlayerProfile? profile;
    try {
      profile = await store.load();
    } catch (_) {
      profile = null;
    }

    // 3. Quick network check so we can skip the RTDB round-trip entirely
    //    when there is clearly no connection.
    final hasNetwork = await _hasNetwork();

    // 4. Active room session — the only step that needs the network.
    //    Bounded by a timeout; on failure we keep the stored session in
    //    prefs (Home retries once connection returns) and continue.
    ActiveRoomSession? session;
    var offline = !hasNetwork;
    if (profile != null && hasNetwork) {
      try {
        session = await RoomRepository(
          profileStore: store,
        ).resolveActiveSession().timeout(sessionTimeout);
      } catch (_) {
        session = null;
        offline = true;
      }
    }

    return BootResult(profile: profile, session: session, isOffline: offline);
  }

  Future<bool> _hasNetwork() async {
    try {
      final results = await Connectivity().checkConnectivity().timeout(
        const Duration(seconds: 2),
      );
      return results.any((r) => r != ConnectivityResult.none);
    } catch (_) {
      // If the plugin itself fails, assume online and let the RTDB
      // timeout be the safety net.
      return true;
    }
  }
}
