import 'package:flutter/material.dart';

import '../core/avatars.dart';
import '../core/theme.dart';
import 'brand_fx.dart';

/// Shared Hero for the full Quivro brand logo so it flies seamlessly from
/// the splash intro into the in-app headers instead of popping.
///
/// Both ends and the flight draw the same bitmap, so the morph is pure
/// position/scale with no crossfade. [child] lets the splash supply its
/// animated reveal of the same logo; it must fill the same box.
class QuivroWordmarkHero extends StatelessWidget {
  const QuivroWordmarkHero({super.key, required this.height, this.child});

  static const asset = 'assets/branding/brand_full.png';

  /// Width / height of [asset] (trimmed to its visible content).
  static const aspect = 1199 / 590;

  final double height;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: 'quivro-wordmark',
      flightShuttleBuilder: (_, _, _, _, _) => const _BrandImage(),
      child: SizedBox(
        height: height,
        width: height * aspect,
        child: child ?? const _BrandImage(),
      ),
    );
  }
}

/// The logo's three spark rays (cyan, yellow, magenta) as a tiny fan of
/// outlined pills.
class BrandSparks extends StatelessWidget {
  const BrandSparks({super.key, this.scale = 1});

  final double scale;

  @override
  Widget build(BuildContext context) {
    const colors = [brandCyan, showBulb, brandMagenta];
    const angles = [-0.5, 0.0, 0.5];
    final ink = showInk(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (var i = 0; i < 3; i++)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 1.5 * scale),
            child: Transform.rotate(
              angle: angles[i],
              child: Container(
                width: 5 * scale,
                height: (i == 1 ? 13 : 11) * scale,
                decoration: BoxDecoration(
                  color: colors[i],
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: ink, width: 1.5),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Header divider under the brand logo: the spark fan trailing into a
/// fading brand line.
class BrandSparkRule extends StatelessWidget {
  const BrandSparkRule({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const BrandSparks(),
        const SizedBox(width: 6),
        Container(
          width: 120,
          height: 3,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(99),
            gradient: LinearGradient(
              colors: [
                QuivroColors.purple,
                QuivroColors.purple.withValues(alpha: 0),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _BrandImage extends StatelessWidget {
  const _BrandImage();

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      QuivroWordmarkHero.asset,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      semanticLabel: 'Quivro',
    );
  }
}
