import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/settings.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import 'quivro_snackbar.dart';

const _seenKey = 'quivro.hostHintSeen';
const _hostUrl = 'https://quivro.org';

/// TV chip, same padding and border as the language and theme chips.
class HostTvChip extends StatelessWidget {
  const HostTvChip({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Semantics(
      button: true,
      label: context.strings.hostHintTitle,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: showPanel(
            ink: showInk(context),
            fill: palette.card,
            radius: 12,
            shadow: const Offset(0, 4),
          ),
          child: Icon(
            Icons.tv,
            size: 16,
            color: context.settings.isNight ? Colors.white : showInkDay,
          ),
        ),
      ),
    );
  }
}

/// First visit shows where to create a room. Closing fades the poster and
/// slides the TV chip onto the row with the language and theme chips.
class HostHint extends StatefulWidget {
  const HostHint({super.key, required this.progress, required this.anchorKey});

  final ValueNotifier<double> progress;
  final GlobalKey anchorKey;

  @override
  State<HostHint> createState() => HostHintState();
}

class HostHintState extends State<HostHint>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  var _closing = false;

  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(
          vsync: this,
          duration: const Duration(milliseconds: 400),
        )..addListener(() {
          widget.progress.value = _controller.value;
          setState(() {});
        });
    _controller.value = 1;
    widget.progress.value = 1;
  }

  void expand() => _expand();

  Rect? _anchorRect() {
    final target =
        widget.anchorKey.currentContext?.findRenderObject() as RenderBox?;
    final overlay = context.findRenderObject() as RenderBox?;
    if (target == null ||
        overlay == null ||
        !target.attached ||
        !target.hasSize ||
        !overlay.attached) {
      return null;
    }
    final topLeft = overlay.globalToLocal(target.localToGlobal(Offset.zero));
    return topLeft & target.size;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _collapse() async {
    if (_closing || _controller.value >= 1) return;
    _closing = true;
    await _controller.animateTo(1, curve: Curves.easeInCubic);
    _closing = false;
    if (!mounted) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_seenKey, true);
  }

  void _expand() {
    if (_controller.value == 0) return;
    _controller.animateTo(0, curve: Curves.easeOutCubic);
  }

  Future<void> _copy() async {
    await Clipboard.setData(const ClipboardData(text: _hostUrl));
    if (!mounted) return;
    showQuivroSnack(context, context.strings.hostHintCopied);
  }

  @override
  Widget build(BuildContext context) {
    final t = _controller.value;
    final collapsed = t > 0.85;
    final strings = context.strings;
    final palette = context.palette;
    final anchor = _anchorRect();
    final chipWidth = anchor?.width ?? 44;
    final chipHeight = anchor?.height ?? 36;

    return LayoutBuilder(
      builder: (context, constraints) {
        const rowInset = 20.0;
        var cardW = math.min(constraints.maxWidth - 40, 340.0);
        var cardH = cardW * 1.5;
        final maxCardH = constraints.maxHeight - 24;
        if (cardH > maxCardH) {
          cardH = maxCardH;
          cardW = cardH / 1.5;
        }
        final cardLeft = (constraints.maxWidth - cardW) / 2;
        final cardTop = (constraints.maxHeight - cardH) / 2;
        // Sit inside the photo, clear of the 3px stroke.
        const chipInset = 18.0;
        final iconLeft = lerpDouble(
          cardLeft + cardW - chipInset - chipWidth,
          anchor?.left ?? rowInset,
          t,
        )!;
        final iconTop = lerpDouble(
          cardTop + chipInset,
          anchor?.top ?? constraints.maxHeight - rowInset - chipHeight,
          t,
        )!;

        return Stack(
          children: [
            if (t < 1)
              Positioned.fill(
                child: GestureDetector(
                  onTap: _collapse,
                  behavior: HitTestBehavior.opaque,
                  child: ColoredBox(
                    color: Colors.black.withValues(alpha: 0.55 * (1 - t)),
                  ),
                ),
              ),
            Positioned(
              left: cardLeft,
              top: cardTop,
              width: cardW,
              height: cardH,
              child: IgnorePointer(
                ignoring: t > 0.5,
                child: Opacity(
                  opacity: (1 - t).clamp(0.0, 1.0),
                  child: _card(strings, palette),
                ),
              ),
            ),
            if (t < 1)
              Positioned(
                left: iconLeft,
                top: iconTop,
                child: HostTvChip(onTap: collapsed ? _expand : _collapse),
              ),
          ],
        );
      },
    );
  }

  Widget _card(AppStrings strings, QuivroPalette palette) {
    final ink = showInk(context);
    return Container(
      decoration: showPanel(ink: ink, fill: palette.card, radius: 22),
      padding: const EdgeInsets.all(3),
      child: Column(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: Image.asset(
                'assets/branding/intro.png',
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
                alignment: Alignment.center,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(17, 16, 17, 13),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  strings.hostHintTitle.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: showDisplay(context, fontSize: 22),
                ),
                const SizedBox(height: 8),
                Text(
                  strings.hostHintBody,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                    color: palette.muted,
                  ),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: _copy,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'quivro.org',
                          style: showDisplay(context, fontSize: 26),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.copy_rounded, color: ink, size: 22),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: _collapse,
                  child: Container(
                    width: double.infinity,
                    height: 56,
                    alignment: Alignment.center,
                    decoration: showPanel(
                      ink: ink,
                      fill: showBulb,
                      radius: 14,
                      shadow: const Offset(0, 4),
                    ),
                    child: Text(
                      strings.hostHintGotIt.toUpperCase(),
                      style: showDisplay(
                        context,
                        fontSize: 22,
                        color: showInkDay,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
