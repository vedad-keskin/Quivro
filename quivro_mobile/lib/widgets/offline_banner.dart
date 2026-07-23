import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/strings.dart';
import '../core/theme.dart';

/// Live connectivity chip, pinned in a corner near the avatar.
///
/// Combines two signals:
/// - `connectivity_plus`: is there a network at all (wifi/cellular)?
/// - Firebase `.info/connected`: can we actually reach the Realtime Database?
///
/// The two signals get different grace periods: losing the device network
/// entirely is a hard, reliable signal and gets a short grace. Firebase's
/// own socket briefly cycling — which is normal and can take several
/// seconds even on a perfectly fine connection (backgrounding, network
/// handoff, routine housekeeping) — gets a much longer grace so those
/// blips resolve silently instead of flashing an "offline" chip.
///
/// When the device network transitions from none to some, this also nudges
/// the Firebase Database client to retry immediately (`goOffline()` +
/// `goOnline()`), because its own exponential backoff can otherwise leave
/// it waiting long after the network is actually back.
///
/// Shows an amber "Offline" chip while disconnected, and a brief green
/// "Online" chip on reconnect (only once the recovered state has held
/// steady for a moment, to avoid flicker). Calls [onReconnected] each time
/// the connection is confirmed back.
class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key, this.onReconnected});

  final VoidCallback? onReconnected;

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

enum _BannerState { hidden, offline, backOnline }

class _OfflineBannerState extends State<OfflineBanner> {
  // Real network loss is reliable and should surface quickly.
  static const _hardOfflineGrace = Duration(seconds: 2);
  // Firebase-only disconnects are usually a normal, short-lived socket
  // recycle — give them room to resolve before alarming the user.
  static const _softReconnectGrace = Duration(seconds: 7);
  static const _onlineConfirmDelay = Duration(milliseconds: 1500);
  static const _backOnlineVisibleFor = Duration(seconds: 2);

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  StreamSubscription<DatabaseEvent>? _firebaseSub;
  Timer? _graceTimer;
  Timer? _confirmOnlineTimer;
  Timer? _backOnlineTimer;

  bool _networkOffline = false;
  bool _firebaseConnected = true;
  bool _wasOffline = false;
  bool? _networkWasOffline; // null until the first real reading arrives.
  bool? _pendingGraceIsHard;
  _BannerState _state = _BannerState.hidden;

  bool get _isOffline => _networkOffline || !_firebaseConnected;

  @override
  void initState() {
    super.initState();

    Connectivity().checkConnectivity().then((results) {
      if (!mounted) return;
      _handleConnectivity(results);
    });
    _connectivitySub = Connectivity().onConnectivityChanged.listen(
      _handleConnectivity,
    );

    _firebaseSub = FirebaseDatabase.instance
        .ref('.info/connected')
        .onValue
        .listen((event) {
          _firebaseConnected = event.snapshot.value == true;
          _evaluate();
        });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _firebaseSub?.cancel();
    _graceTimer?.cancel();
    _confirmOnlineTimer?.cancel();
    _backOnlineTimer?.cancel();
    super.dispose();
  }

  void _handleConnectivity(List<ConnectivityResult> results) {
    final offline = results.every((r) => r == ConnectivityResult.none);
    // Only a genuine none -> some transition counts as "regained" — not the
    // very first reading, which has no prior state to compare against.
    final regained = _networkWasOffline == true && !offline;
    _networkOffline = offline;
    _networkWasOffline = offline;
    if (regained) _nudgeFirebaseReconnect();
    _evaluate();
  }

  /// Firebase's client manages its own reconnection with exponential
  /// backoff. If the app was offline for a while, by the time the device's
  /// network actually returns the client can be deep into a long backoff
  /// wait and won't retry just because the OS says we're connected again.
  /// Forcing an offline/online cycle drops that backoff state and makes it
  /// attempt a fresh connection right away.
  Future<void> _nudgeFirebaseReconnect() async {
    try {
      await FirebaseDatabase.instance.goOffline();
      await FirebaseDatabase.instance.goOnline();
    } catch (_) {
      // Best-effort nudge — the SDK's own retry will eventually catch up.
    }
  }

  void _evaluate() {
    if (!mounted) return;

    if (_isOffline) {
      _backOnlineTimer?.cancel();
      _confirmOnlineTimer?.cancel();
      _confirmOnlineTimer = null;

      // Pick the grace period based on which signal is causing the outage.
      // If the cause escalates from "Firebase only" to "no network at all"
      // while a longer grace timer is already pending, restart with the
      // shorter one so real network loss is never masked by a stale wait.
      final isHard = _networkOffline;
      if (_graceTimer == null || _pendingGraceIsHard != isHard) {
        _graceTimer?.cancel();
        _pendingGraceIsHard = isHard;
        final grace = isHard ? _hardOfflineGrace : _softReconnectGrace;
        _graceTimer = Timer(grace, () {
          _graceTimer = null;
          _pendingGraceIsHard = null;
          if (!mounted || !_isOffline) return;
          setState(() {
            _wasOffline = true;
            _state = _BannerState.offline;
          });
        });
      }
      return;
    }

    // Both signals agree we're online.
    _graceTimer?.cancel();
    _graceTimer = null;
    _pendingGraceIsHard = null;

    if (!_wasOffline) {
      _confirmOnlineTimer?.cancel();
      _confirmOnlineTimer = null;
      if (_state != _BannerState.hidden) {
        setState(() => _state = _BannerState.hidden);
      }
      return;
    }

    // Require the recovered state to hold steady briefly before declaring
    // victory, so a signal that flaps right at the boundary doesn't flicker.
    _confirmOnlineTimer ??= Timer(_onlineConfirmDelay, () {
      _confirmOnlineTimer = null;
      if (!mounted || _isOffline) return;
      _wasOffline = false;
      widget.onReconnected?.call();
      setState(() => _state = _BannerState.backOnline);
      _backOnlineTimer?.cancel();
      _backOnlineTimer = Timer(_backOnlineVisibleFor, () {
        if (mounted) setState(() => _state = _BannerState.hidden);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeIn,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.85, end: 1).animate(animation),
          alignment: Alignment.topRight,
          child: child,
        ),
      ),
      child: switch (_state) {
        _BannerState.hidden => const SizedBox.shrink(key: ValueKey('hidden')),
        _BannerState.offline => _Pill(
          key: const ValueKey('offline'),
          icon: Icons.wifi_off_rounded,
          color: const Color(0xFFFFB020),
          text: context.strings.offline,
        ),
        _BannerState.backOnline => _Pill(
          key: const ValueKey('online'),
          icon: Icons.wifi_rounded,
          color: const Color(0xFF84CC16),
          text: context.strings.online,
        ),
      },
    );
  }
}

/// Compact corner chip — short label, small footprint, meant to sit near
/// the avatar without competing with the rest of the screen.
class _Pill extends StatelessWidget {
  const _Pill({
    super.key,
    required this.icon,
    required this.color,
    required this.text,
  });

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: palette.pill,
        borderRadius: BorderRadius.circular(99),
        boxShadow: [
          BoxShadow(
            color: palette.shadow,
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
