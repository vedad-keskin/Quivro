import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'avatars.dart';

/// Semantic color tokens that differ between day and night themes.
///
/// Brand accents (blue, purple, pink, the answer-tile colors) stay identical
/// in both modes — only the neutrals and tinted chip fills adapt.
class QuivroPalette extends ThemeExtension<QuivroPalette> {
  const QuivroPalette({
    required this.text,
    required this.muted,
    required this.border,
    required this.surface,
    required this.card,
    required this.chipBlue,
    required this.chipPurple,
    required this.chipPink,
    required this.pill,
    required this.shadow,
  });

  /// Primary body text (navy in day, near-white at night).
  final Color text;

  /// Secondary / hint text.
  final Color muted;

  /// Hairline borders around inputs, cards and list tiles.
  final Color border;

  /// Subtle page/section background one step off the scaffold.
  final Color surface;

  /// Elevated card / input fill.
  final Color card;

  /// Tinted chip fills (countdown, badges, leaderboard highlights).
  final Color chipBlue;
  final Color chipPurple;
  final Color chipPink;

  /// High-contrast pill background (connectivity chip).
  final Color pill;

  /// Drop shadow color.
  final Color shadow;

  static const light = QuivroPalette(
    text: QuivroColors.navy,
    muted: Color(0xFF64748B),
    border: Color(0xFFE2E8F0),
    surface: Color(0xFFF8FAFC),
    card: Colors.white,
    chipBlue: Color(0xFFE0F2FE),
    chipPurple: Color(0xFFF5F3FF),
    chipPink: Color(0xFFFCE7F3),
    pill: QuivroColors.navy,
    shadow: Color(0x1F1E293B),
  );

  static const dark = QuivroPalette(
    text: Color(0xFFF1F5F9),
    muted: Color(0xFF94A3B8),
    border: Color(0xFF2E3A54),
    surface: Color(0xFF141B33),
    card: Color(0xFF1B2440),
    chipBlue: Color(0xFF17304F),
    chipPurple: Color(0xFF29254E),
    chipPink: Color(0xFF3B1B36),
    pill: Color(0xFF334155),
    shadow: Color(0x66000000),
  );

  @override
  QuivroPalette copyWith({
    Color? text,
    Color? muted,
    Color? border,
    Color? surface,
    Color? card,
    Color? chipBlue,
    Color? chipPurple,
    Color? chipPink,
    Color? pill,
    Color? shadow,
  }) {
    return QuivroPalette(
      text: text ?? this.text,
      muted: muted ?? this.muted,
      border: border ?? this.border,
      surface: surface ?? this.surface,
      card: card ?? this.card,
      chipBlue: chipBlue ?? this.chipBlue,
      chipPurple: chipPurple ?? this.chipPurple,
      chipPink: chipPink ?? this.chipPink,
      pill: pill ?? this.pill,
      shadow: shadow ?? this.shadow,
    );
  }

  @override
  QuivroPalette lerp(ThemeExtension<QuivroPalette>? other, double t) {
    if (other is! QuivroPalette) return this;
    return QuivroPalette(
      text: Color.lerp(text, other.text, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      border: Color.lerp(border, other.border, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      card: Color.lerp(card, other.card, t)!,
      chipBlue: Color.lerp(chipBlue, other.chipBlue, t)!,
      chipPurple: Color.lerp(chipPurple, other.chipPurple, t)!,
      chipPink: Color.lerp(chipPink, other.chipPink, t)!,
      pill: Color.lerp(pill, other.pill, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
    );
  }
}

extension QuivroPaletteX on BuildContext {
  QuivroPalette get palette => Theme.of(this).extension<QuivroPalette>()!;
}

ThemeData buildQuivroTheme() => _buildTheme(
  brightness: Brightness.light,
  palette: QuivroPalette.light,
  scaffold: Colors.white,
);

ThemeData buildQuivroDarkTheme() => _buildTheme(
  brightness: Brightness.dark,
  palette: QuivroPalette.dark,
  scaffold: const Color(0xFF0E1430),
);

ThemeData _buildTheme({
  required Brightness brightness,
  required QuivroPalette palette,
  required Color scaffold,
}) {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: QuivroColors.blue,
      brightness: brightness,
    ),
    scaffoldBackgroundColor: scaffold,
  );

  return base.copyWith(
    extensions: [palette],
    textTheme: GoogleFonts.nunitoTextTheme(
      base.textTheme,
    ).apply(bodyColor: palette.text, displayColor: palette.text),
    appBarTheme: AppBarTheme(
      backgroundColor: scaffold,
      foregroundColor: palette.text,
      elevation: 0,
      titleTextStyle: GoogleFonts.nunito(
        fontWeight: FontWeight.w800,
        fontSize: 22,
        color: palette.text,
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: palette.card,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: palette.card,
      hintStyle: GoogleFonts.nunito(
        fontWeight: FontWeight.w700,
        color: palette.muted,
      ),
      labelStyle: GoogleFonts.nunito(
        fontWeight: FontWeight.w700,
        color: palette.muted,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: palette.border, width: 2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: palette.border, width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: QuivroColors.blue, width: 2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: QuivroColors.blue,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.nunito(
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: palette.text,
        side: const BorderSide(color: Color(0xFFEC4899), width: 2),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.nunito(
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: palette.card,
      contentTextStyle: GoogleFonts.nunito(
        fontWeight: FontWeight.w700,
        fontSize: 15,
        color: palette.text,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: palette.border, width: 2),
      ),
      elevation: 8,
    ),
  );
}
