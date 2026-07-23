import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/strings.dart';

const _bgColor = Color(0xFF0A0E27);

/// Team credits dialog — Nightfall-style framed starfield scroller,
/// opened via the Home version-label easter egg.
class CreditsDialog extends StatelessWidget {
  const CreditsDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Team Credits',
      barrierColor: Colors.black87,
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (context, anim1, anim2) => const CreditsDialog(),
      transitionBuilder: (context, anim1, anim2, child) {
        return ScaleTransition(
          scale: CurvedAnimation(parent: anim1, curve: Curves.easeOutBack),
          child: FadeTransition(opacity: anim1, child: child),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final maxHeight = MediaQuery.sizeOf(context).height * 0.85;

    final titleStyle = GoogleFonts.nunito(
      color: const Color(0xFFE0E1DD),
      fontSize: 22,
      fontWeight: FontWeight.w900,
      height: 1.2,
    );
    final subtitleStyle = GoogleFonts.nunito(
      color: const Color(0xFF64748B),
      fontSize: 12,
      fontWeight: FontWeight.w800,
      letterSpacing: 2,
    );
    final closeStyle = GoogleFonts.nunito(
      color: const Color(0xFFE0E1DD),
      fontSize: 13,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.2,
    );

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 30, vertical: 16),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.black,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                offset: const Offset(8, 8),
                blurRadius: 0,
              ),
            ],
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: Color(0xFF778DA9),
              border: Border.symmetric(
                vertical: BorderSide(color: Color(0xFF415A77), width: 4),
                horizontal: BorderSide(color: Color(0xFFE0E1DD), width: 4),
              ),
            ),
            padding: const EdgeInsets.all(4),
            child: ClipRect(
              child: Container(
                color: _bgColor,
                child: Stack(
                  children: [
                    const Positioned.fill(
                      child: RepaintBoundary(child: _CreditsStarfield()),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 32,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          RepaintBoundary(
                            child: Column(
                              children: [
                                Text(
                                  'NIGHTFALL PROJECT',
                                  style: titleStyle,
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  height: 3,
                                  width: 64,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        QuivroColors.blue,
                                        QuivroColors.purple,
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(99),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  strings.creditsTitle.toUpperCase(),
                                  style: subtitleStyle,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            height: 240,
                            child: _CreditsScroller(
                              entries: [
                                _CreditEntry(
                                  label: strings.creditsLeadDev.toUpperCase(),
                                  name: 'Vedad Keskin',
                                  labelColor: QuivroColors.blue,
                                ),
                                _CreditEntry(
                                  label: strings.creditsQuestionCurator
                                      .toUpperCase(),
                                  name: 'Mom',
                                  labelColor: QuivroColors.purple,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          RepaintBoundary(
                            child: TextButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: const Color(0xFFE0E1DD),
                                  ),
                                ),
                                child: Text(
                                  strings.close.toUpperCase(),
                                  style: closeStyle,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      right: 14,
                      bottom: 10,
                      child: Text(
                        'v1.0.1',
                        style: GoogleFonts.nunito(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF64748B).withValues(alpha: 0.75),
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CreditEntry {
  _CreditEntry({
    required this.label,
    required this.name,
    required Color labelColor,
  }) : labelStyle = GoogleFonts.nunito(
         color: labelColor,
         fontSize: 11,
         fontWeight: FontWeight.w800,
         letterSpacing: 1.4,
       ),
       nameStyle = GoogleFonts.nunito(
         color: Colors.white,
         fontSize: 22,
         fontWeight: FontWeight.w800,
       );

  final String label;
  final String name;
  final TextStyle labelStyle;
  final TextStyle nameStyle;
}

class _CreditsScroller extends StatefulWidget {
  const _CreditsScroller({required this.entries});

  final List<_CreditEntry> entries;

  @override
  State<_CreditsScroller> createState() => _CreditsScrollerState();
}

class _CreditsScrollerState extends State<_CreditsScroller>
    with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  Duration _lastElapsed = Duration.zero;

  double _scrollOffset = 0;
  double _currentSpeed = _defaultSpeed;
  static const double _defaultSpeed = 35.0;
  double _targetSpeed = _defaultSpeed;
  bool _isDragging = false;
  bool _isPaused = false;
  bool _initialDelay = true;

  static const double _entryHeight = 72.0;
  static const double _entrySpacing = 20.0;
  static const double _entryTotalHeight = _entryHeight + _entrySpacing;

  // Repeat the short credit list so the loop still feels full.
  static const int _loopCopies = 4;

  List<_CreditEntry> get _credits {
    final out = <_CreditEntry>[];
    for (var i = 0; i < _loopCopies; i++) {
      out.addAll(widget.entries);
    }
    return out;
  }

  double get _totalContentHeight => _credits.length * _entryTotalHeight;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick)..start();
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _initialDelay = false);
    });
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _onTick(Duration elapsed) {
    final dt = (elapsed - _lastElapsed).inMicroseconds / 1000000.0;
    _lastElapsed = elapsed;

    if (dt > 0.1 || dt <= 0) return;
    if (_isDragging || _isPaused || _initialDelay) return;

    final lerpFactor = (dt * 3.0).clamp(0.0, 1.0);
    _currentSpeed += (_targetSpeed - _currentSpeed) * lerpFactor;

    setState(() {
      _scrollOffset += _currentSpeed * dt;
      _wrapOffset();
    });
  }

  void _wrapOffset() {
    final total = _totalContentHeight;
    while (_scrollOffset >= total) {
      _scrollOffset -= total;
    }
    while (_scrollOffset < 0) {
      _scrollOffset += total;
    }
  }

  void _onTap() {
    setState(() {
      if (_isPaused) {
        _isPaused = false;
        _targetSpeed = _defaultSpeed;
        _currentSpeed = _defaultSpeed * 0.3;
      } else {
        _isPaused = true;
        _currentSpeed = 0;
        _targetSpeed = 0;
      }
    });
  }

  void _onDragStart(DragStartDetails details) {
    _isDragging = true;
    _isPaused = false;
  }

  void _onDragUpdate(DragUpdateDetails details) {
    setState(() {
      _scrollOffset -= details.delta.dy;
      _wrapOffset();
    });
  }

  void _onDragEnd(DragEndDetails details) {
    _isDragging = false;
    final vy = -details.velocity.pixelsPerSecond.dy;
    if (vy.abs() > 50) {
      _currentSpeed = vy.clamp(-300.0, 300.0);
    } else {
      _currentSpeed = _defaultSpeed;
    }
    _targetSpeed = _defaultSpeed;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportHeight = constraints.maxHeight;

        return RepaintBoundary(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: _onTap,
            onVerticalDragStart: _onDragStart,
            onVerticalDragUpdate: _onDragUpdate,
            onVerticalDragEnd: _onDragEnd,
            child: SizedBox(
              height: viewportHeight,
              width: double.infinity,
              child: ClipRect(
                child: Stack(
                  clipBehavior: Clip.hardEdge,
                  children: [
                    ..._buildCreditWidgets(viewportHeight),
                    Positioned.fill(
                      child: IgnorePointer(
                        child: CustomPaint(painter: _ScanlinePainter()),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildCreditWidgets(double viewportHeight) {
    final widgets = <Widget>[];
    final centerY = viewportHeight / 2;
    final credits = _credits;
    final total = _totalContentHeight;

    for (var i = 0; i < credits.length; i++) {
      var basePos = (i * _entryTotalHeight - _scrollOffset) % total;
      if (basePos < 0) basePos += total;

      for (final wrapOffset in [0.0, -total]) {
        final pos = basePos + wrapOffset;

        if (pos > viewportHeight + _entryHeight ||
            pos + _entryHeight < -_entryHeight) {
          continue;
        }

        final entryCenterY = pos + _entryHeight / 2;
        final distFromCenter = (entryCenterY - centerY).abs();
        final maxDist = viewportHeight / 2 + _entryHeight;
        final normalizedDist = (distFromCenter / maxDist).clamp(0.0, 1.0);
        final opacity = (1.0 - normalizedDist * 0.6).clamp(0.0, 1.0);

        widgets.add(
          Positioned(
            top: pos,
            left: 0,
            right: 0,
            height: _entryHeight,
            child: Opacity(
              opacity: opacity,
              child: _buildCreditEntry(credits[i]),
            ),
          ),
        );
      }
    }

    return widgets;
  }

  Widget _buildCreditEntry(_CreditEntry credit) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(credit.label, style: credit.labelStyle),
        const SizedBox(height: 8),
        Text(credit.name, style: credit.nameStyle),
      ],
    );
  }
}

class _ScanlinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black.withValues(alpha: 0.06);

    for (double y = 0; y < size.height; y += 4) {
      canvas.drawRect(Rect.fromLTWH(0, y, size.width, 1), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Soft drifting starfield behind the credits — Quivro navy with blue/purple
/// tinted stars.
class _CreditsStarfield extends StatefulWidget {
  const _CreditsStarfield();

  @override
  State<_CreditsStarfield> createState() => _CreditsStarfieldState();
}

class _CreditsStarfieldState extends State<_CreditsStarfield>
    with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  double _elapsed = 0;
  final List<_Star> _stars = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();

    for (var i = 0; i < 50; i++) {
      _stars.add(
        _Star(
          x: _random.nextDouble(),
          y: _random.nextDouble(),
          size: _random.nextBool() ? 2 : 3,
          speed: 0.02 + _random.nextDouble() * 0.05,
          tint: _random.nextBool() ? QuivroColors.blue : QuivroColors.purple,
        ),
      );
    }

    _ticker = createTicker((elapsed) {
      setState(() {
        _elapsed = elapsed.inMilliseconds / 1000.0;
      });
    })..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _StarPainter(_stars, _elapsed),
      size: Size.infinite,
    );
  }
}

class _Star {
  const _Star({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.tint,
  });

  final double x;
  final double y;
  final double size;
  final double speed;
  final Color tint;
}

class _StarPainter extends CustomPainter {
  _StarPainter(this.stars, this.elapsed);

  final List<_Star> stars;
  final double elapsed;

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [_bgColor, Color(0xFF000000)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    for (final star in stars) {
      final currentY = (star.y + elapsed * star.speed) % 1.0;
      final paint = Paint()..color = star.tint.withValues(alpha: 0.35);
      canvas.drawRect(
        Rect.fromLTWH(
          star.x * size.width,
          currentY * size.height,
          star.size,
          star.size,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_StarPainter oldDelegate) =>
      oldDelegate.elapsed != elapsed;
}
