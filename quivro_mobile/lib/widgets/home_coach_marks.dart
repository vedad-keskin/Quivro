import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/strings.dart';
import '../core/theme.dart';

/// The five home hints use the real control underneath the spotlight.
class HomeCoachMarks extends StatefulWidget {
  const HomeCoachMarks({
    super.key,
    required this.step,
    required this.targetKey,
    required this.onNext,
    required this.onSkip,
  }) : assert(step >= 0 && step < 5);

  final int step;
  final GlobalKey targetKey;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  State<HomeCoachMarks> createState() => _HomeCoachMarksState();
}

class _HomeCoachMarksState extends State<HomeCoachMarks>
    with WidgetsBindingObserver {
  Rect? _target;
  ScrollPosition? _scroll;
  bool _measurePending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didUpdateWidget(covariant HomeCoachMarks oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.targetKey != oldWidget.targetKey) _target = null;
  }

  @override
  void didChangeMetrics() => _scheduleMeasure();

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scroll?.removeListener(_scheduleMeasure);
    super.dispose();
  }

  void _scheduleMeasure() {
    if (_measurePending) return;
    _measurePending = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _measurePending = false;
      if (!mounted) return;
      final targetContext = widget.targetKey.currentContext;
      final target = targetContext?.findRenderObject();
      final overlay = context.findRenderObject();
      if (target is! RenderBox ||
          overlay is! RenderBox ||
          !target.attached ||
          !target.hasSize ||
          !overlay.hasSize) {
        return;
      }
      final scroll = Scrollable.maybeOf(targetContext!)?.position;
      if (_scroll != scroll) {
        _scroll?.removeListener(_scheduleMeasure);
        _scroll = scroll;
        _scroll?.addListener(_scheduleMeasure);
      }
      final rect = MatrixUtils.transformRect(
        target.getTransformTo(overlay),
        Offset.zero & target.size,
      );
      if (rect != _target) setState(() => _target = rect);
    });
  }

  @override
  Widget build(BuildContext context) {
    _scheduleMeasure();
    final target = _target;
    if (target == null) {
      return const AbsorbPointer(child: SizedBox.expand());
    }
    final targetShape = RRect.fromRectAndRadius(
      target,
      Radius.circular(widget.step == 4 ? 18 : 12),
    );
    return LayoutBuilder(
      builder: (context, constraints) {
        const margin = 16.0;
        const gap = 18.0;
        final size = constraints.biggest;
        final aboveSpace = math.max(0.0, target.top - gap - margin);
        final belowSpace = math.max(
          0.0,
          size.height - target.bottom - gap - margin,
        );
        final above = aboveSpace >= belowSpace;
        final width = math.min(400.0, math.max(0.0, size.width - margin * 2));
        final cardLeft = (size.width - width) / 2;
        final pointerX = (target.center.dx - cardLeft).clamp(26.0, width - 26);
        return Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: ExcludeSemantics(
                child: GestureDetector(
                  behavior: HitTestBehavior.deferToChild,
                  onTap: () {},
                  child: CustomPaint(
                    key: const ValueKey('home-coach-scrim'),
                    painter: _SpotlightPainter(
                      target: targetShape,
                      shadow: widget.step == 4
                          ? const Offset(4, 4)
                          : const Offset(0, 4),
                      color: showInkNight.withValues(alpha: 0.68),
                    ),
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: CustomSingleChildLayout(
                delegate: _CoachLayout(
                  target: target,
                  above: above,
                  width: width,
                  maxHeight: above ? aboveSpace : belowSpace,
                ),
                child: _CoachCard(
                  step: widget.step,
                  above: above,
                  pointerX: pointerX,
                  onNext: widget.onNext,
                  onSkip: widget.onSkip,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SpotlightPainter extends CustomPainter {
  const _SpotlightPainter({
    required this.target,
    required this.shadow,
    required this.color,
  });

  final RRect target;
  final Offset shadow;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final spotlight = Path.combine(
      PathOperation.union,
      Path()..addRRect(target),
      Path()..addRRect(target.shift(shadow)),
    );
    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Offset.zero & size),
        spotlight,
      ),
      Paint()..color = color,
    );
  }

  // Reveal the native shadow without making the surrounding space interactive.
  @override
  bool hitTest(Offset position) => !target.contains(position);

  @override
  bool shouldRepaint(_SpotlightPainter oldDelegate) =>
      target != oldDelegate.target ||
      shadow != oldDelegate.shadow ||
      color != oldDelegate.color;
}

class _CoachLayout extends SingleChildLayoutDelegate {
  const _CoachLayout({
    required this.target,
    required this.above,
    required this.width,
    required this.maxHeight,
  });

  final Rect target;
  final bool above;
  final double width;
  final double maxHeight;

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) =>
      BoxConstraints(minWidth: width, maxWidth: width, maxHeight: maxHeight);

  @override
  Offset getPositionForChild(Size size, Size childSize) => Offset(
    (size.width - childSize.width) / 2,
    above ? target.top - 18 - childSize.height : target.bottom + 18,
  );

  @override
  bool shouldRelayout(_CoachLayout oldDelegate) =>
      target != oldDelegate.target ||
      above != oldDelegate.above ||
      width != oldDelegate.width ||
      maxHeight != oldDelegate.maxHeight;
}

class _CoachCard extends StatelessWidget {
  const _CoachCard({
    required this.step,
    required this.above,
    required this.pointerX,
    required this.onNext,
    required this.onSkip,
  });

  final int step;
  final bool above;
  final double pointerX;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final palette = context.palette;
    final ink = showInk(context);
    final title = Text(
      strings.coachTitles[step],
      style: showDisplay(context, fontSize: 25, letterSpacing: 0.3),
    );
    final body = Text(
      strings.coachBodies[step],
      style: GoogleFonts.nunito(
        color: palette.muted,
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.35,
      ),
    );
    final header = Row(
      children: [
        Expanded(
          child: ExcludeSemantics(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < 5; i++)
                  Container(
                    key: ValueKey('coach-dot-$i'),
                    width: 10,
                    height: 10,
                    margin: const EdgeInsets.only(right: 7),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: i == step
                          ? showBulb
                          : palette.muted.withValues(alpha: 0.45),
                    ),
                  ),
              ],
            ),
          ),
        ),
        Flexible(
          child: Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              key: const ValueKey('home-coach-skip'),
              onPressed: onSkip,
              style: TextButton.styleFrom(
                minimumSize: const Size(48, 48),
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  strings.coachSkip.toUpperCase(),
                  style: showDisplay(
                    context,
                    fontSize: 16,
                    color: palette.muted,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
    final next = Align(
      alignment: Alignment.centerRight,
      child: Semantics(
        button: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            key: const ValueKey('home-coach-next'),
            onTap: onNext,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              constraints: const BoxConstraints(minWidth: 108, minHeight: 48),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: showPanel(
                ink: ink,
                fill: showBulb,
                radius: 12,
                shadow: const Offset(0, 4),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  (step == 4 ? strings.newsGotIt : strings.newsNext)
                      .toUpperCase(),
                  style: showDisplay(context, fontSize: 18, color: showInkDay),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return Semantics(
      container: true,
      explicitChildNodes: true,
      liveRegion: true,
      label: strings.coachStep(step + 1),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            key: const ValueKey('home-coach-card'),
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
            decoration: showPanel(
              ink: ink,
              fill: palette.card,
              radius: 22,
            ).copyWith(border: Border.all(color: palette.border, width: 3)),
            child: LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxHeight < 140) {
                  return SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        header,
                        title,
                        const SizedBox(height: 8),
                        body,
                        const SizedBox(height: 12),
                        next,
                      ],
                    ),
                  );
                }
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    header,
                    Flexible(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [title, const SizedBox(height: 8), body],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    next,
                  ],
                );
              },
            ),
          ),
          Positioned(
            left: pointerX - 12,
            top: above ? null : -12,
            bottom: above ? -12 : null,
            child: IgnorePointer(
              child: CustomPaint(
                size: const Size(24, 12),
                painter: _PointerPainter(down: above, ink: ink),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PointerPainter extends CustomPainter {
  const _PointerPainter({required this.down, required this.ink});
  final bool down;
  final Color ink;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, down ? 0 : size.height)
      ..lineTo(size.width / 2, down ? size.height : 0)
      ..lineTo(size.width, down ? 0 : size.height)
      ..close();
    canvas.drawPath(path, Paint()..color = showBulb);
    canvas.drawPath(
      path,
      Paint()
        ..color = ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(_PointerPainter oldDelegate) =>
      down != oldDelegate.down || ink != oldDelegate.ink;
}
