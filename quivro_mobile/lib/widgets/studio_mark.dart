import 'package:flutter/material.dart';

/// Nightfall Studio wordmark. Navy art; invert it on a dark surface.
class StudioMark extends StatelessWidget {
  const StudioMark({super.key, this.forceInvert = false, this.height = 22});

  final bool forceInvert;
  final double height;

  static const asset = 'assets/branding/nightfall-wordmark.png';

  @override
  Widget build(BuildContext context) {
    final invert =
        forceInvert || Theme.of(context).brightness == Brightness.dark;
    final image = Image.asset(
      asset,
      height: height,
      opacity: const AlwaysStoppedAnimation(0.78),
    );
    if (!invert) return image;
    return ColorFiltered(
      colorFilter: const ColorFilter.matrix(<double>[
        -1, 0, 0, 0, 255,
        0, -1, 0, 0, 255,
        0, 0, -1, 0, 255,
        0, 0, 0, 1, 0,
      ]),
      child: image,
    );
  }
}
