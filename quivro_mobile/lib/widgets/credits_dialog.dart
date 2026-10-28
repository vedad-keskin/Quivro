import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import 'brand_fx.dart';
import 'studio_mark.dart';
import 'wordmark.dart';

const _pink = Color(0xFFEC4899);

/// Team credits as a full-screen stage in the intro's visual language:
/// the brand logo bursts in, then sticker cards slam in one by one. Tapping
/// the logo replays the burst with the intro hit. Opened by a two-second
/// hold on the home Nightfall mark.
class CreditsDialog extends StatefulWidget {
  const CreditsDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Team Credits',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 350),
      pageBuilder: (context, anim1, anim2) => const CreditsDialog(),
      transitionBuilder: (context, anim1, anim2, child) {
        return FadeTransition(
          opacity: anim1,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.94, end: 1).animate(
              CurvedAnimation(parent: anim1, curve: Curves.easeOutCubic),
            ),
            child: child,
          ),
        );
      },
    );
  }

  @override
  State<CreditsDialog> createState() => _CreditsDialogState();
}

class _CreditsDialogState extends State<CreditsDialog>
    with TickerProviderStateMixin {
  static const _cue = 250.0;
  static const _stageMs = 1600;
  static const _burstMs = 900;
  static const _cardsAt = 600.0;
  static const _cardGap = 180.0;
  static const _logoWidth = 210.0;
  static const _logoTop = 36.0;

  /// Where the hit sits inside `into_splash.mp3` (the splash starts it 800ms
  /// before its cue).
  static const _soundHit = Duration(milliseconds: 800);

  late final AnimationController _ambient = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 10),
  )..repeat();

  /// One-shot entrance: background, title, cards, footer.
  late final AnimationController _stage = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: _stageMs),
  )..addListener(_onStageTick);

  /// Logo pop + burst; separate so tapping the logo can replay just this.
  late final AnimationController _burst = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: _burstMs),
  );

  final AudioPlayer _hit = AudioPlayer();
  bool _burstFired = false;
  int _cardsLanded = 0;

  double get _ms => _stage.value * _stageMs;
  double get _burstT => _burst.value * _burstMs;

  double _seg(double t, double from, double to, [Curve c = Curves.linear]) =>
      c.transform(((t - from) / (to - from)).clamp(0.0, 1.0));

  @override
  void initState() {
    super.initState();
    _stage.forward();
  }

  void _onStageTick() {
    if (!_burstFired && _ms >= _cue) {
      _burstFired = true;
      _fireBurst();
    }
    final landed = ((_ms - _cardsAt) / _cardGap).floor() + 1;
    if (landed > _cardsLanded && landed <= 2) {
      _cardsLanded = landed;
      HapticFeedback.selectionClick();
    }
  }

  void _fireBurst() {
    HapticFeedback.heavyImpact();
    _burst.forward(from: 0);
  }

  Future<void> _replay() async {
    _fireBurst();
    try {
      await _hit.stop();
      await _hit.setSource(AssetSource('sounds/into_splash.mp3'));
      await _hit.seek(_soundHit);
      await _hit.resume();
    } catch (_) {
      // Easter egg audio is optional.
    }
  }

  @override
  void dispose() {
    _ambient.dispose();
    _stage.dispose();
    _burst.dispose();
    unawaited(_hit.dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final padding = MediaQuery.paddingOf(context);
    final width = MediaQuery.sizeOf(context).width;
    const logoH = _logoWidth / QuivroWordmarkHero.aspect;
    final focus = Offset(width / 2, padding.top + _logoTop + logoH / 2);
    final cards = [
      (strings.creditsLeadDev, 'Vedad Keskin', brandCyan),
      (strings.creditsQuestionCurator, strings.creditsMom, _pink),
    ];
    final night = Theme.of(context).brightness == Brightness.dark;
    final fxTint = night ? Colors.white : QuivroColors.purple;

    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: AnimatedBuilder(
        animation: Listenable.merge([_ambient, _stage, _burst]),
        builder: (context, _) => Stack(
          fit: StackFit.expand,
          children: [
            // Tapping the empty stage closes, like the old barrier did.
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Opacity(
                opacity: _seg(_ms, 0, _cue),
                child: CustomPaint(
                  painter: BrandAmbientPainter(
                    t: _ambient.value,
                    focus: focus,
                    pull: 0,
                    sunburst: _seg(_ms, _cue + 100, _cue + 700, Curves.easeOut),
                    tint: fxTint,
                  ),
                ),
              ),
            ),
            if (_burstFired)
              IgnorePointer(
                child: CustomPaint(
                  painter: BrandBurstPainter(
                    ms: _burstT,
                    cue: 0,
                    focus: focus,
                    logoWidth: _logoWidth,
                    tint: fxTint,
                  ),
                ),
              ),
            Padding(
              padding: padding + const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                children: [
                  const SizedBox(height: _logoTop),
                  _buildLogo(logoH),
                  const SizedBox(height: 18),
                  _rise(
                    _seg(_ms, 450, 800, Curves.easeOutCubic),
                    Text(
                      strings.creditsTitle.toUpperCase(),
                      style: showDisplay(
                        context,
                        fontSize: 24,
                        letterSpacing: 2,
                        color: night ? Colors.white : showInkDay,
                        shadows: [
                          Shadow(
                            color: night ? showInkNight : showBulb,
                            offset: const Offset(3, 3),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (var i = 0; i < cards.length; i++) ...[
                          if (i > 0) const SizedBox(height: 22),
                          _slam(
                            i,
                            width,
                            _CreditCard(
                              role: cards[i].$1,
                              name: cards[i].$2,
                              color: cards[i].$3,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  _rise(
                    _seg(_ms, 1100, 1450, Curves.easeOutCubic),
                    _buildFooter(context),
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

  Widget _buildLogo(double logoH) {
    final pop = _seg(_burstT, 0, 700, Curves.elasticOut);
    return GestureDetector(
      onTap: _replay,
      child: Opacity(
        opacity: _burstFired ? 1 : 0,
        child: Transform.scale(
          scale: 0.7 + 0.3 * pop,
          child: Image.asset(
            QuivroWordmarkHero.asset,
            width: _logoWidth,
            height: logoH,
            filterQuality: FilterQuality.high,
            semanticLabel: 'Quivro',
          ),
        ),
      ),
    );
  }

  /// Fade + small upward slide driven by [p].
  Widget _rise(double p, Widget child) {
    return Opacity(
      opacity: p,
      child: Transform.translate(offset: Offset(0, 14 * (1 - p)), child: child),
    );
  }

  /// Card [i] flies in from alternating sides and lands on a slight tilt.
  Widget _slam(int i, double width, Widget card) {
    final start = _cardsAt + i * _cardGap;
    final p = _seg(_ms, start, start + 650, Curves.elasticOut);
    final side = i.isEven ? -1.0 : 1.0;
    const tilt = 2.5 * math.pi / 180;
    return Opacity(
      opacity: _seg(_ms, start, start + 120),
      child: Transform.translate(
        offset: Offset(side * width * (1 - p), 0),
        child: Transform.rotate(
          angle: lerpDouble(side * 0.3, -side * tilt, p)!,
          child: card,
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    final strings = context.strings;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              strings.madeBy,
              style: GoogleFonts.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.palette.muted,
              ),
            ),
            const SizedBox(width: 8),
            const StudioMark(),
            const SizedBox(width: 10),
            Text(
              'v1.4.4',
              style: GoogleFonts.nunito(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: context.palette.muted,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            height: 52,
            width: double.infinity,
            alignment: Alignment.center,
            decoration: showPanel(
              ink: showInk(context),
              fill: showBulb,
              radius: 16,
              shadow: const Offset(0, 5),
            ),
            child: Text(
              strings.close.toUpperCase(),
              style: showDisplay(context, fontSize: 22, color: showInkDay),
            ),
          ),
        ),
      ],
    );
  }
}

/// Sticker-style credit card: role chip, big name, spark accent.
class _CreditCard extends StatelessWidget {
  const _CreditCard({
    required this.role,
    required this.name,
    required this.color,
  });

  final String role;
  final String name;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final ink = showInk(context);
    final night = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      decoration: showPanel(
        ink: ink,
        fill: context.palette.card,
        radius: 22,
        shadow: Offset(5, 5),
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: showPanel(
                  ink: ink,
                  fill: color,
                  radius: 99,
                  shadow: const Offset(0, 3),
                ),
                child: Text(
                  role.toUpperCase(),
                  style: GoogleFonts.nunito(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                    color: showInkDay,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: showDisplay(
                  context,
                  fontSize: 30,
                  letterSpacing: 0.4,
                  color: context.palette.text,
                  shadows: night
                      ? const [
                          Shadow(color: showInkNight, offset: Offset(2, 2)),
                        ]
                      : null,
                ),
              ),
            ],
          ),
          const Positioned(top: 0, right: 0, child: BrandSparks(scale: 1.3)),
        ],
      ),
    );
  }
}
