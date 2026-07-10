import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';

enum QuivroSnackKind { info, error, success }

void showQuivroSnack(
  BuildContext context,
  String message, {
  QuivroSnackKind kind = QuivroSnackKind.info,
}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.clearSnackBars();
  messenger.showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Colors.transparent,
      elevation: 0,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: EdgeInsets.zero,
      duration: const Duration(seconds: 3),
      content: _QuivroSnackCard(message: message, kind: kind),
    ),
  );
}

class _QuivroSnackCard extends StatelessWidget {
  const _QuivroSnackCard({required this.message, required this.kind});

  final String message;
  final QuivroSnackKind kind;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: QuivroColors.border, width: 2),
        boxShadow: [
          BoxShadow(
            color: QuivroColors.navy.withValues(alpha: 0.14),
            blurRadius: 40,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _AccentBar(kind: kind),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.nunito(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                height: 1.35,
                color: QuivroColors.navy,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AccentBar extends StatelessWidget {
  const _AccentBar({required this.kind});

  final QuivroSnackKind kind;

  @override
  Widget build(BuildContext context) {
    final decoration = switch (kind) {
      QuivroSnackKind.error => const BoxDecoration(
          color: Color(0xFFEC4899),
          borderRadius: BorderRadius.all(Radius.circular(99)),
        ),
      QuivroSnackKind.success => const BoxDecoration(
          color: Color(0xFF84CC16),
          borderRadius: BorderRadius.all(Radius.circular(99)),
        ),
      QuivroSnackKind.info => const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [QuivroColors.blue, QuivroColors.purple],
          ),
          borderRadius: BorderRadius.all(Radius.circular(99)),
        ),
    };

    return Container(
      width: 6,
      height: 36,
      decoration: decoration,
    );
  }
}
