import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import '../core/avatars.dart';
import '../core/theme.dart';

const brandCyan = Color(0xFF22D3EE);
const brandMagenta = Color(0xFFE040FB);

/// The cue's one-shot effects: charge glow, shockwave ring and the three
/// spark slashes (the brand's spark rays, swiping like claws).
class BrandBurstPainter extends CustomPainter {
  BrandBurstPainter({
    required this.ms,
    required this.cue,
    required this.focus,
    required this.logoWidth,
    this.tint = Colors.white,
  });

  final double ms;
  final double cue;
  final Offset focus;
  final double logoWidth;

  /// Shockwave colour; swap for a dark ink on light backgrounds.
  final Color tint;

  double _seg(double from, double to, [Curve curve = Curves.linear]) =>
      curve.transform(((ms - from) / (to - from)).clamp(0.0, 1.0));

  @override
  void paint(Canvas canvas, Size size) {
    _glow(canvas);
    _slashes(canvas, size);
    _shockwave(canvas, size);
  }

  void _glow(Canvas canvas) {
    final double alpha;
    final double radius;
    if (ms < cue) {
      final charge = _seg(0, cue, Curves.easeIn);
      final pulse = 0.5 + 0.5 * math.sin(ms * ms / 40000);
      alpha = 0.12 + 0.45 * charge * (0.55 + 0.45 * pulse);
      radius = 95 + 45 * charge;
    } else {
      final settle = _seg(cue, cue + 700, Curves.easeOutCubic);
      alpha = lerpDouble(0.85, 0.32, settle)!;
      radius = lerpDouble(150, logoWidth * 0.62, settle)!;
    }
    canvas.drawCircle(
      focus,
      radius,
      Paint()
        ..shader = RadialGradient(
          colors: [
            brandCyan.withValues(alpha: alpha),
            QuivroColors.purple.withValues(alpha: alpha * 0.55),
            QuivroColors.purple.withValues(alpha: 0),
          ],
          stops: const [0, 0.5, 1],
        ).createShader(Rect.fromCircle(center: focus, radius: radius)),
    );
  }

  void _slashes(Canvas canvas, Size size) {
    const colors = [brandCyan, showBulb, brandMagenta];
    // "/" diagonal through the logo, bottom-left to top-right.
    final dir = Offset(size.width * 0.6, -size.height * 0.42);
    final normal = Offset(-dir.dy, dir.dx) / dir.distance;
    final outline = Paint()
      ..color = showInkNight
      ..strokeWidth = 22
      ..strokeCap = StrokeCap.round;
    final fill = Paint()
      ..strokeWidth = 13
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < 3; i++) {
      final start = cue + i * 45;
      final head = _seg(start, start + 170, Curves.easeOutCubic);
      final tail = _seg(start + 110, start + 400, Curves.easeInCubic);
      if (head <= 0 || tail >= 1) continue;
      final base = focus + normal * (i - 1) * 30;
      final a = base - dir;
      final b = base + dir;
      final p0 = Offset.lerp(a, b, tail)!;
      final p1 = Offset.lerp(a, b, head)!;
      canvas.drawLine(p0, p1, outline);
      canvas.drawLine(p0, p1, fill..color = colors[i]);
    }
  }

  void _shockwave(Canvas canvas, Size size) {
    if (ms < cue) return;
    final p = _seg(cue, cue + 600, Curves.easeOutCubic);
    if (p >= 1) return;
    canvas.drawCircle(
      focus,
      60 + p * size.longestSide * 0.75,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1 + 17 * (1 - p)
        ..color = tint.withValues(alpha: 0.6 * (1 - p)),
    );
  }

  @override
  bool shouldRepaint(BrandBurstPainter oldDelegate) =>
      oldDelegate.ms != ms || oldDelegate.focus != focus;
}

/// Paints the slow-drifting aurora blobs, the rotating sunburst behind the
/// logo and twinkling particles (pulled toward the Q while it charges).
/// Driven by a single 0..1 looping value — cheap to repaint.
class BrandAmbientPainter extends CustomPainter {
  BrandAmbientPainter({
    required this.t,
    required this.focus,
    required this.pull,
    required this.sunburst,
    this.tint = Colors.white,
  });

  final double t;
  final Offset focus;
  final double pull;
  final double sunburst;

  /// Sunburst and particle colour; swap for a dark ink on light backgrounds.
  final Color tint;

  static const _pink = Color(0xFFEC4899);
  static const _rays = 14;

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
      showBulb.withValues(alpha: 0.16),
    );
    _blob(
      canvas,
      Offset(
        size.width * (0.85 + 0.07 * math.cos(angle * 1.2)),
        size.height * (0.42 + 0.06 * math.sin(angle)),
      ),
      size.width * 0.55,
      QuivroColors.purple.withValues(alpha: 0.17),
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

    if (sunburst > 0) _sunburst(canvas, size);
    _particles(canvas, size);
  }

  void _blob(Canvas canvas, Offset center, double radius, Color color) {
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, color.withValues(alpha: 0)],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, paint);
  }

  void _sunburst(Canvas canvas, Size size) {
    final radius = size.longestSide * 0.7;
    // Two rays per loop keeps the rotation seamless across the 10s repeat.
    final rotation = t * 2 * (2 * math.pi / _rays);
    const wedge = math.pi / _rays;
    final path = Path();
    for (var i = 0; i < _rays; i++) {
      final a = rotation + i * 2 * wedge;
      path
        ..moveTo(focus.dx, focus.dy)
        ..lineTo(
          focus.dx + radius * math.cos(a),
          focus.dy + radius * math.sin(a),
        )
        ..lineTo(
          focus.dx + radius * math.cos(a + wedge),
          focus.dy + radius * math.sin(a + wedge),
        )
        ..close();
    }
    canvas.drawPath(
      path,
      Paint()
        ..shader = RadialGradient(
          colors: [
            tint.withValues(alpha: 0.07 * sunburst),
            tint.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromCircle(center: focus, radius: radius)),
    );
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
      paint.color = tint.withValues(alpha: 0.05 + 0.14 * twinkle);
      canvas.drawCircle(
        Offset.lerp(Offset(x, y), focus, pull * 0.35)!,
        radius,
        paint,
      );
    }
  }

  double _frac(double v) => v - v.floorToDouble();

  @override
  bool shouldRepaint(BrandAmbientPainter oldDelegate) =>
      oldDelegate.t != t ||
      oldDelegate.pull != pull ||
      oldDelegate.sunburst != sunburst ||
      oldDelegate.tint != tint ||
      oldDelegate.focus != focus;
}
