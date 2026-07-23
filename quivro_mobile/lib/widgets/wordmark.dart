import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';

/// Shared Hero wrapper for the "Quivro" wordmark so it morphs smoothly
/// between the splash screen and the in-app headers instead of popping.
///
/// During the flight the wordmark is drawn with the brand blue-to-purple
/// gradient, which stays readable over both the dark splash background and
/// the light home background mid-transition.
class QuivroWordmarkHero extends StatelessWidget {
  const QuivroWordmarkHero({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: 'quivro-wordmark',
      flightShuttleBuilder:
          (flightContext, animation, direction, fromContext, toContext) =>
              const _FlightWordmark(),
      child: Material(type: MaterialType.transparency, child: child),
    );
  }
}

class _FlightWordmark extends StatelessWidget {
  const _FlightWordmark();

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: FittedBox(
        fit: BoxFit.contain,
        alignment: Alignment.centerLeft,
        child: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [QuivroColors.blue, QuivroColors.purple],
          ).createShader(bounds),
          child: Text(
            'Quivro',
            style: GoogleFonts.nunito(
              fontSize: 44,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              height: 1.0,
            ),
          ),
        ),
      ),
    );
  }
}
