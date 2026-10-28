import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/avatars.dart';
import '../core/bootstrap.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import '../widgets/brand_fx.dart';
import '../widgets/studio_mark.dart';
import '../widgets/wordmark.dart';

/// Branded animated intro ("charge and burst").
///
/// Opens on the same Q the native splash shows, charges it up, and on the
/// audio cue bursts into the full brand logo (flash, shockwave, three spark
/// slashes, letter-by-letter reveal). Meanwhile [AppBootstrapper] initializes
/// Firebase, the local profile and any active room session; once both are
/// done the logo flies via Hero into the next screen's header.
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  static const _minSplash = Duration(milliseconds: 3000);

  /// Brief pause before intro SFX so its hit lands on [_cue].
  static const _introSoundDelay = Duration(milliseconds: 200);

  /// Intro time (ms) where the hit in `into_splash.mp3` lands. Everything in
  /// the burst is keyed off this; nudge it if the sound file changes.
  static const _cue = 1000.0;
  static const _introMs = 2200;
  static const _letterGap = 80.0;

  /// Reveal edge (fraction of brand_full width, at mid-height) after each
  /// step: Q + sparks, u, i, v, r, o. The last overshoots 1 so the slanted
  /// edge clears the "o" completely.
  static const _letterStops = [0.375, 0.488, 0.558, 0.695, 0.785, 1.05];

  static const _bg = Color(0xFF0A0E27);
  static const _qAsset = 'assets/branding/brand_q.png';

  /// Matches the native splash icon (500px source rendered at 4x).
  static const _qHeight = 125.0;

  /// Slow ambient loop driving the aurora, particles, sunburst and shimmer.
  late final AnimationController _ambient = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 10),
  )..repeat();

  /// One-shot timeline for the whole intro choreography.
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: _introMs),
  )..addListener(_onIntroTick);

  Timer? _taglineTimer;
  int _taglineIndex = 0;
  int _hapticStep = -1;
  bool _bootDone = false;
  bool _bootFailed = false;
  bool _offlineNote = false;
  final AudioPlayer _introSound = AudioPlayer();

  /// The intro only starts once both logo bitmaps are decoded, so neither
  /// the opening Q nor the burst ever draws a half-loaded image.
  bool _introReady = false;
  bool _precacheStarted = false;
  final _introStarted = Completer<void>();
  final _introStopwatch = Stopwatch();

  /// Set for a short "exit beat": everything but the logo fades out right
  /// before navigating, while the logo flies via Hero.
  bool _exiting = false;

  double get _ms => _intro.value * _introMs;

  /// Progress (0..1) of the intro between [from] and [to] ms.
  double _seg(double from, double to, [Curve curve = Curves.linear]) =>
      curve.transform(((_ms - from) / (to - from)).clamp(0.0, 1.0));

  @override
  void initState() {
    super.initState();
    _boot();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_precacheStarted) return;
    _precacheStarted = true;
    Future.wait([
      precacheImage(const AssetImage(_qAsset), context),
      precacheImage(const AssetImage(QuivroWordmarkHero.asset), context),
    ]).whenComplete(() {
      if (mounted) _startIntro();
    });
  }

  void _startIntro() {
    setState(() => _introReady = true);
    _introStopwatch.start();
    _introStarted.complete();
    _intro.forward();
    unawaited(_playIntroSound());

    _taglineTimer = Timer.periodic(const Duration(milliseconds: 1700), (_) {
      if (!mounted || _bootFailed) return;
      setState(() => _taglineIndex = _taglineIndex + 1);
    });
  }

  /// Heavy thump on the cue, then a light tick per revealed letter.
  void _onIntroTick() {
    if (_ms < _cue) return;
    final step = ((_ms - _cue) / _letterGap).floor().clamp(
      0,
      _letterStops.length - 1,
    );
    if (step <= _hapticStep) return;
    _hapticStep = step;
    step == 0 ? HapticFeedback.heavyImpact() : HapticFeedback.selectionClick();
  }

  Future<void> _playIntroSound() async {
    try {
      await Future.delayed(_introSoundDelay);
      if (!mounted) return;
      await _introSound.setReleaseMode(ReleaseMode.stop);
      await _introSound.setSource(AssetSource('sounds/into_splash.mp3'));
      await _introSound.resume();
    } catch (_) {
      // Ignore audio failures — splash must continue.
    }
  }

  @override
  void dispose() {
    _ambient.dispose();
    _intro.dispose();
    _taglineTimer?.cancel();
    unawaited(_introSound.dispose());
    super.dispose();
  }

  Future<void> _boot() async {
    if (_bootFailed) setState(() => _bootFailed = false);

    final result = await AppBootstrapper().run();
    if (mounted) setState(() => _bootDone = true);

    // Let the intro play out even on fast devices — measured from when the
    // intro actually started, not from boot kickoff.
    await _introStarted.future;
    final elapsed = _introStopwatch.elapsed;
    final remaining = _minSplash - elapsed;
    if (remaining > Duration.zero) {
      await Future.delayed(remaining);
    }
    if (!mounted) return;

    if (result.isFatal) {
      setState(() => _bootFailed = true);
      return;
    }

    if (result.isOffline) {
      // Brief heads-up before landing; Home shows a live banner after.
      setState(() => _offlineNote = true);
      await Future.delayed(const Duration(milliseconds: 1100));
      if (!mounted) return;
    }

    // Exit beat: fade the transient pieces, then hand off to the Hero.
    setState(() => _exiting = true);
    await Future.delayed(const Duration(milliseconds: 280));
    if (!mounted) return;

    final location = result.initialLocation;
    if (location.startsWith('/room/')) {
      context.go(
        location,
        extra: {
          'playerId': result.session!.playerId,
          'profile': result.profile,
        },
      );
    } else if (location == '/') {
      context.go('/', extra: result.profile);
    } else {
      context.go('/setup');
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final focus = size.center(Offset.zero);
    final logoW = math.min(size.width * 0.8, 340.0);
    final logoH = logoW / QuivroWordmarkHero.aspect;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: _bg,
      ),
      child: Scaffold(
        backgroundColor: _bg,
        // No SafeArea around the logo: it must sit at the exact screen
        // centre, where the native splash drew the Q.
        body: AnimatedBuilder(
          animation: Listenable.merge([_ambient, _intro]),
          builder: (context, _) => Stack(
            fit: StackFit.expand,
            children: [
              // Fades in from the bare native-splash colour.
              _fadeOnExit(
                Opacity(
                  opacity: _seg(0, 500),
                  child: CustomPaint(
                    painter: BrandAmbientPainter(
                      t: _ambient.value,
                      focus: focus,
                      pull:
                          _seg(0, _cue, Curves.easeIn) *
                          (1 - _seg(_cue, _cue + 400, Curves.easeOut)),
                      sunburst: _seg(_cue + 150, _cue + 900, Curves.easeOut),
                    ),
                  ),
                ),
              ),
              if (_introReady) ...[
                _fadeOnExit(
                  CustomPaint(
                    painter: BrandBurstPainter(
                      ms: _ms,
                      cue: _cue,
                      focus: focus,
                      logoWidth: logoW,
                    ),
                  ),
                ),
                Center(child: _buildLogo(logoH)),
                // Flash sits above the logo so it hides the Q -> logo swap.
                IgnorePointer(
                  child: ColoredBox(
                    color: Colors.white.withValues(
                      alpha: _ms < _cue
                          ? 0
                          : 0.85 * (1 - _seg(_cue, _cue + 260, Curves.easeOut)),
                    ),
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  top: focus.dy + logoH / 2 + 22,
                  child: _fadeOnExit(_buildCredits()),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: MediaQuery.paddingOf(context).bottom + 24,
                  height: 132,
                  child: _fadeOnExit(
                    Opacity(
                      opacity: _seg(_cue + 700, _cue + 1100),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 350),
                        switchInCurve: Curves.easeOutCubic,
                        child: _bootFailed
                            ? _BootErrorCard(onRetry: _boot)
                            : AnimatedOpacity(
                                opacity: !_bootDone || _offlineNote ? 1 : 0,
                                duration: const Duration(milliseconds: 300),
                                child: _buildProgress(),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// Fades [child] out during the exit beat (the logo is excluded — it stays
  /// visible and flies into the next screen's header via Hero).
  Widget _fadeOnExit(Widget child) {
    return AnimatedOpacity(
      opacity: _exiting ? 0 : 1,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
      child: child,
    );
  }

  /// The charging Q until the cue, then the full logo revealed letter by
  /// letter with an elastic pop.
  Widget _buildLogo(double logoH) {
    final charge = _seg(0, _cue, Curves.easeIn);
    final hit = _ms < _cue ? 0.0 : _seg(_cue, _cue + 120);
    final pop = _seg(_cue, _cue + 700, Curves.elasticOut);
    // Wobble speeds up as the charge builds.
    final wobble = math.sin(_ms * _ms / 60000);

    return Stack(
      alignment: Alignment.center,
      children: [
        if (hit < 1)
          Opacity(
            opacity: 1 - hit,
            child: Transform.rotate(
              angle: 0.05 * charge * wobble,
              child: Transform.scale(
                scale: 1 - 0.08 * charge + 0.5 * hit,
                child: Image.asset(
                  _qAsset,
                  height: _qHeight,
                  filterQuality: FilterQuality.high,
                ),
              ),
            ),
          ),
        Transform.scale(
          scale: 0.82 + 0.18 * pop,
          child: QuivroWordmarkHero(
            height: logoH,
            child: ClipPath(
              clipper: _RevealClipper(_revealFraction()),
              child: Image.asset(
                QuivroWordmarkHero.asset,
                fit: BoxFit.contain,
                filterQuality: FilterQuality.high,
              ),
            ),
          ),
        ),
      ],
    );
  }

  double _revealFraction() {
    var f = 0.0;
    for (var i = 0; i < _letterStops.length; i++) {
      final start = _cue + i * _letterGap;
      if (_ms < start) break;
      f = lerpDouble(
        i == 0 ? 0 : _letterStops[i - 1],
        _letterStops[i],
        _seg(start, start + 120, Curves.easeOutBack),
      )!;
    }
    return f;
  }

  Widget _buildCredits() {
    final p = _seg(_cue + 450, _cue + 950, Curves.easeOutCubic);
    final p2 = _seg(_cue + 600, _cue + 1100, Curves.easeOutCubic);
    return Column(
      children: [
        Opacity(
          opacity: p,
          child: Transform.translate(
            offset: Offset(0, 10 * (1 - p)),
            child: Text(
              context.strings.tagline,
              style: GoogleFonts.nunito(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.white.withValues(alpha: 0.72),
                letterSpacing: 0.3,
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Opacity(
          opacity: p2,
          child: Transform.translate(
            offset: Offset(0, 10 * (1 - p2)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  context.strings.madeBy,
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
                const SizedBox(width: 8),
                const StudioMark(forceInvert: true),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProgress() {
    // ~1.4s sweep derived from the 10s ambient loop.
    final sweep = (_ambient.value * 7) % 1.0;
    return Column(
      key: const ValueKey('progress'),
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          width: 168,
          height: 12,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: showInkNight, width: 2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: Align(
              alignment: Alignment(-1.6 + 3.2 * sweep, 0),
              child: Container(
                width: 72,
                height: 12,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [QuivroColors.blue, QuivroColors.purple],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Rotating tagline / offline note.
        SizedBox(
          height: 22,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.5),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: Text(
              _offlineNote
                  ? context.strings.offlineContinuing
                  : context.strings.splashTaglines[_taglineIndex %
                        context.strings.splashTaglines.length],
              key: ValueKey(_offlineNote ? -1 : _taglineIndex),
              style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: _offlineNote
                    ? const Color(0xFFFFB020)
                    : Colors.white.withValues(alpha: 0.40),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Reveals the logo up to [fraction] of its width with an edge slanted like
/// the italic wordmark, so each step uncovers exactly one letter.
class _RevealClipper extends CustomClipper<Path> {
  _RevealClipper(this.fraction);

  final double fraction;

  @override
  Path getClip(Size size) {
    if (fraction <= 0) return Path();
    final slant = size.height * 0.06;
    final x = size.width * fraction;
    return Path()
      ..moveTo(0, 0)
      ..lineTo(x + slant, 0)
      ..lineTo(x - slant, size.height)
      ..lineTo(0, size.height)
      ..close();
  }

  @override
  bool shouldReclip(_RevealClipper oldClipper) =>
      oldClipper.fraction != fraction;
}

/// Friendly fatal-error state with a retry button. Shown only when core
/// initialization itself fails (distinct from being offline).
class _BootErrorCard extends StatelessWidget {
  const _BootErrorCard({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('error'),
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          context.strings.bootErrorTitle,
          style: GoogleFonts.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Colors.white.withValues(alpha: 0.9),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          context.strings.bootErrorBody,
          style: GoogleFonts.nunito(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: onRetry,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: showPanel(
              ink: showInkNight,
              fill: showBulb,
              radius: 14,
              shadow: const Offset(0, 4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.refresh_rounded, size: 20, color: showInkDay),
                const SizedBox(width: 8),
                Text(
                  context.strings.tryAgain,
                  style: showDisplay(context, fontSize: 18, color: showInkDay),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
