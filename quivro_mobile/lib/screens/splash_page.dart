import 'dart:async';
import 'dart:math' as math;

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/bootstrap.dart';
import '../core/strings.dart';
import '../widgets/wordmark.dart';

/// Branded animated loading screen.
///
/// Plays a choreographed intro (aurora background, elastic logo entrance,
/// letter-by-letter wordmark, shimmer progress bar with rotating taglines)
/// while [AppBootstrapper] initializes Firebase, the local profile and any
/// active room session. Navigates to the right screen when both the boot
/// work and a minimum splash duration have elapsed.
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  static const _minSplash = Duration(milliseconds: 3000);
  /// Brief pause before intro SFX so it sits closer to the wordmark reveal.
  static const _introSoundDelay = Duration(milliseconds: 200);
  static const _bg = Color(0xFF0A0E27);
  static const _blue = Color(0xFF2F7CF6);
  static const _purple = Color(0xFF7B3FF2);
  static const _logoAsset = 'assets/branding/logo_big.png';

  /// Slow ambient loop driving the aurora blobs, particles and shimmer bar.
  late final AnimationController _ambient = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 10),
  )..repeat();

  /// Gentle breathing pulse for the logo once it has landed.
  late final AnimationController _breath = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  );

  Timer? _taglineTimer;
  int _taglineIndex = 0;
  bool _bootFailed = false;
  bool _offlineNote = false;
  final AudioPlayer _introSound = AudioPlayer();

  /// The intro choreography only starts once the logo bitmap is decoded, so
  /// the entrance never animates a half-loaded image.
  bool _introReady = false;
  bool _precacheStarted = false;
  final _introStarted = Completer<void>();
  final _introStopwatch = Stopwatch();

  /// Set for a short "exit beat": the progress area and taglines fade out
  /// right before navigating, while the wordmark morphs via Hero.
  bool _exiting = false;

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
    precacheImage(const AssetImage(_logoAsset), context).whenComplete(() {
      if (mounted) _startIntro();
    });
  }

  /// Kicks off every timed piece of the choreography, measured from the
  /// moment the logo is actually ready to draw.
  void _startIntro() {
    setState(() => _introReady = true);
    _introStopwatch.start();
    _introStarted.complete();
    unawaited(_playIntroSound());

    // Haptic tick when the elastic logo entrance "lands".
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) HapticFeedback.mediumImpact();
    });

    // Breathing starts after the entrance settles.
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) _breath.repeat(reverse: true);
    });

    // Rotating playful taglines.
    _taglineTimer = Timer.periodic(const Duration(milliseconds: 1700), (_) {
      if (!mounted || _bootFailed) return;
      setState(() => _taglineIndex = _taglineIndex + 1);
    });
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
    _breath.dispose();
    _taglineTimer?.cancel();
    unawaited(_introSound.dispose());
    super.dispose();
  }

  Future<void> _boot() async {
    if (_bootFailed) setState(() => _bootFailed = false);

    final result = await AppBootstrapper().run();

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
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: _bg,
      ),
      child: Scaffold(
        backgroundColor: _bg,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Ambient aurora blobs + floating particles.
            AnimatedBuilder(
              animation: _ambient,
              builder: (context, _) =>
                  CustomPaint(painter: _AmbientPainter(_ambient.value)),
            ),
            // Content appears only once the logo bitmap is decoded, so the
            // whole choreography starts from a clean, fully-loaded frame.
            if (_introReady)
              SafeArea(
                child: Column(
                  children: [
                    const Spacer(flex: 5),
                    _fadeOnExit(_buildLogo()),
                    const SizedBox(height: 28),
                    QuivroWordmarkHero(child: _buildWordmark()),
                    const SizedBox(height: 10),
                    _fadeOnExit(
                      Text(
                            context.strings.tagline,
                            style: GoogleFonts.nunito(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white.withValues(alpha: 0.45),
                              letterSpacing: 0.4,
                            ),
                          )
                          .animate(delay: 1550.ms)
                          .fadeIn(duration: 500.ms)
                          .slideY(
                            begin: 0.4,
                            end: 0,
                            curve: Curves.easeOutCubic,
                          ),
                    ),
                    const Spacer(flex: 4),
                    _fadeOnExit(
                      SizedBox(
                        height: 132,
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 350),
                          switchInCurve: Curves.easeOutCubic,
                          child: _bootFailed
                              ? _BootErrorCard(onRetry: _boot)
                              : _buildProgress(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Fades [child] out during the exit beat (the wordmark is excluded — it
  /// stays visible and morphs into the next screen's header via Hero).
  Widget _fadeOnExit(Widget child) {
    return AnimatedOpacity(
      opacity: _exiting ? 0 : 1,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
      child: child,
    );
  }

  Widget _buildLogo() {
    return SizedBox(
      width: 230,
      height: 230,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Logo with elastic entrance, then breathing.
          AnimatedBuilder(
            animation: _breath,
            builder: (context, child) {
              final t = Curves.easeInOut.transform(_breath.value);
              return Transform.scale(scale: 1.0 + 0.035 * t, child: child);
            },
            child:
                Image.asset(
                      _logoAsset,
                      width: 148,
                      height: 148,
                      filterQuality: FilterQuality.high,
                    )
                    .animate()
                    .fadeIn(duration: 420.ms, curve: Curves.easeOut)
                    .scale(
                      begin: const Offset(0.35, 0.35),
                      end: const Offset(1, 1),
                      duration: 1100.ms,
                      curve: Curves.elasticOut,
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildWordmark() {
    const word = 'Quivro';
    return ShaderMask(
      shaderCallback: (bounds) => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Colors.white, Color(0xFFB9C6FF)],
      ).createShader(bounds),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < word.length; i++)
            Text(
                  word[i],
                  style: GoogleFonts.nunito(
                    fontSize: 44,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.0,
                  ),
                )
                .animate(delay: (1000 + i * 80).ms)
                .fadeIn(duration: 350.ms)
                .slideY(
                  begin: 0.6,
                  end: 0,
                  duration: 450.ms,
                  curve: Curves.easeOutCubic,
                ),
        ],
      ),
    );
  }

  Widget _buildProgress() {
    return Column(
      key: const ValueKey('progress'),
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Shimmer progress bar.
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: SizedBox(
            width: 168,
            height: 4,
            child: Stack(
              children: [
                Container(color: Colors.white.withValues(alpha: 0.10)),
                AnimatedBuilder(
                  animation: _ambient,
                  builder: (context, _) {
                    // ~1.4s sweep derived from the 10s ambient loop.
                    final t = (_ambient.value * 7) % 1.0;
                    return Align(
                      alignment: Alignment(-1.6 + 3.2 * t, 0),
                      child: Container(
                        width: 72,
                        height: 4,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(99),
                          gradient: const LinearGradient(
                            colors: [_blue, _purple],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ).animate(delay: 1300.ms).fadeIn(duration: 400.ms),
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
        ).animate(delay: 1300.ms).fadeIn(duration: 400.ms),
      ],
    );
  }
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
        ElevatedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded, size: 20),
          label: Text(context.strings.tryAgain),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.2, end: 0);
  }
}

/// Paints the slow-drifting aurora blobs and twinkling particles behind the
/// splash content. Driven by a single 0..1 looping value — cheap to repaint.
class _AmbientPainter extends CustomPainter {
  _AmbientPainter(this.t);

  final double t;

  static const _blue = Color(0xFF2F7CF6);
  static const _purple = Color(0xFF7B3FF2);
  static const _pink = Color(0xFFEC4899);

  @override
  void paint(Canvas canvas, Size size) {
    final angle = t * 2 * math.pi;

    _blob(
      canvas,
      Offset(
        size.width * (0.22 + 0.08 * math.sin(angle)),
        size.height * (0.20 + 0.05 * math.cos(angle * 0.8)),
      ),
      size.width * 0.62,
      _blue.withValues(alpha: 0.16),
    );
    _blob(
      canvas,
      Offset(
        size.width * (0.85 + 0.07 * math.cos(angle * 1.2)),
        size.height * (0.42 + 0.06 * math.sin(angle)),
      ),
      size.width * 0.55,
      _purple.withValues(alpha: 0.17),
    );
    _blob(
      canvas,
      Offset(
        size.width * (0.45 + 0.10 * math.sin(angle * 0.7)),
        size.height * (0.92 + 0.04 * math.cos(angle)),
      ),
      size.width * 0.60,
      _pink.withValues(alpha: 0.08),
    );

    _particles(canvas, size);
  }

  void _blob(Canvas canvas, Offset center, double radius, Color color) {
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, color.withValues(alpha: 0)],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, paint);
  }

  void _particles(Canvas canvas, Size size) {
    final paint = Paint();
    for (var i = 0; i < 18; i++) {
      // Deterministic pseudo-random layout per particle index.
      final seed = i * 37.0;
      final x = size.width * _frac(seed * 0.731 + 0.13);
      final speed = 0.05 + 0.06 * _frac(seed * 0.517);
      final y =
          size.height * (1.15 - _frac(_frac(seed * 0.911) + t * speed) * 1.3);
      final radius = 1.2 + 2.0 * _frac(seed * 0.293);
      final twinkle = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 3 + i * 2.1);
      paint.color = Colors.white.withValues(alpha: 0.05 + 0.14 * twinkle);
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  double _frac(double v) => v - v.floorToDouble();

  @override
  bool shouldRepaint(_AmbientPainter oldDelegate) => oldDelegate.t != t;
}
