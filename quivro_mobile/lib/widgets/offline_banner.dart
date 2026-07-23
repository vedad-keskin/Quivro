import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/net_probe.dart';
import '../core/strings.dart';
import '../core/theme.dart';

/// Live connectivity chip, pinned in a corner near the avatar.
///
/// Combines three signals:
/// - `connectivity_plus`: is there a network at all (wifi/cellular)?
/// - Firebase `.info/connected`: can we reach the Realtime Database?
/// - An active internet probe, consulted only when the two disagree.
///
/// The probe exists because Firebase's signal is *not* trustworthy as an
/// offline indicator on this screen: the RTDB client deliberately closes
/// its socket after ~60s of inactivity when only synthetic `.info/*`
/// listeners are attached (which is all Home ever subscribes to), and
/// `.info/connected` then reports `false` indefinitely even though the
/// internet is fine. So "Firebase down + device network up" is treated as
/// merely *suspect*: the chip only appears if a real reachability probe
/// (HTTPS 204 check) also fails — which additionally catches captive
/// portals, where wifi is connected but the internet is not.
///
/// Losing the device network entirely remains a hard, reliable signal with
/// a short grace period.
///
/// The Firebase client is nudged out of its exponential backoff
/// (`goOffline()` + `goOnline()`) when the device network transitions from
/// none to some, and when a probe succeeds right after probes had been
/// failing (a real outage just ended). Plain idle disconnects are *not*
/// nudged, so Home doesn't loop reconnect/idle-drop churn.
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
  // Firebase-down-but-probe-failed outages get a bit more room to resolve
  // before alarming the user.
  static const _softReconnectGrace = Duration(seconds: 7);
  static const _onlineConfirmDelay = Duration(milliseconds: 1500);
  static const _backOnlineVisibleFor = Duration(seconds: 2);
  // While Firebase claims disconnected (and the device network is up),
  // re-verify actual reachability: quickly while probes are failing (an
  // outage is in progress), relaxed while they succeed (Firebase is just
  // idle) to keep steady-state network chatter minimal.
  static const _probeRetryInterval = Duration(seconds: 10);
  static const _probeIdleInterval = Duration(seconds: 30);
  static const _probeTimeout = Duration(seconds: 3);

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  StreamSubscription<DatabaseEvent>? _firebaseSub;
  Timer? _graceTimer;
  Timer? _confirmOnlineTimer;
  Timer? _backOnlineTimer;
  Timer? _probeTimer;

  bool _networkOffline = false;
  bool _firebaseConnected = true;
  bool _wasOffline = false;
  bool? _networkWasOffline; // null until the first real reading arrives.
  bool? _pendingGraceIsHard;
  _BannerState _state = _BannerState.hidden;

  bool _probing = false;
  // Last probe verdict; optimistic until a probe actually fails, so a
  // Firebase idle-disconnect alone can never flash the chip.
  bool _probeOk = true;
  // A probe has failed since Firebase went down — i.e. this was (or still
  // is) a real outage, not just an idle socket.
  bool _probeHadFailed = false;

  bool get _isOffline => _networkOffline || (!_firebaseConnected && !_probeOk);

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
          if (_firebaseConnected) {
            // Firebase itself confirms reachability — probes are moot.
            _probeOk = true;
            _probeHadFailed = false;
          }
          _syncProbeLoop();
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
    _probeTimer?.cancel();
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
    _syncProbeLoop();
    _evaluate();
  }

  bool get _suspect => !_firebaseConnected && !_networkOffline;

  /// Starts or stops the reachability probe loop so it runs exactly while
  /// the state is "suspect": Firebase down but the device network up.
  void _syncProbeLoop() {
    if (!_suspect) {
      _probeTimer?.cancel();
      _probeTimer = null;
      return;
    }
    // A pending timer or an in-flight probe will keep the loop alive.
    if (_probeTimer != null || _probing) return;
    _scheduleProbe(Duration.zero);
  }

  void _scheduleProbe(Duration delay) {
    _probeTimer?.cancel();
    _probeTimer = Timer(delay, _runProbe);
  }

  Future<void> _runProbe() async {
    _probeTimer = null;
    if (_probing) return;
    _probing = true;
    final ok = await probeInternet(timeout: _probeTimeout);
    _probing = false;
    if (!mounted) return;
    // Discard stale results: the suspect state may have ended (Firebase
    // reconnected / network dropped) while the probe was in flight.
    if (!_suspect) return;

    if (ok && _probeHadFailed) {
      // A real outage just ended — kick Firebase out of its backoff so the
      // room session can resume promptly. (Plain idle disconnects never
      // reach this: their probes succeed from the start.)
      _probeHadFailed = false;
      unawaited(_nudgeFirebaseReconnect());
    } else if (!ok) {
      _probeHadFailed = true;
    }
    _probeOk = ok;
    _evaluate();
    _scheduleProbe(ok ? _probeIdleInterval : _probeRetryInterval);
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

    // Online: network present and either Firebase confirms it or the
    // reachability probe does.
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
