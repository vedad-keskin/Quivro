import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/settings.dart';
import '../core/strings.dart';
import '../core/theme.dart';

/// Compact language + day/night selectors, shown side by side on Home and
/// Setup. Language opens a bottom sheet; theme toggles in place.
class SettingsChips extends StatelessWidget {
  const SettingsChips({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: const [_LanguageChip(), SizedBox(width: 10), _ThemeChip()],
    );
  }
}

class _LanguageChip extends StatelessWidget {
  const _LanguageChip();

  @override
  Widget build(BuildContext context) {
    final language = context.settings.language;
    return _Chip(
      onTap: () => _showLanguageSheet(context),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _FlagImage(asset: language.flagAsset),
          const SizedBox(width: 7),
          Text(
            language.name.toUpperCase(),
            style: GoogleFonts.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: context.palette.text,
            ),
          ),
          const SizedBox(width: 2),
          Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 16,
            color: context.palette.muted,
          ),
        ],
      ),
    );
  }

  void _showLanguageSheet(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.palette.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: sheetContext.palette.border,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                sheetContext.strings.chooseLanguage,
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: sheetContext.palette.text,
                ),
              ),
              const SizedBox(height: 16),
              for (final option in AppLanguage.values) ...[
                _LanguageOption(option: option),
                if (option != AppLanguage.values.last)
                  const SizedBox(height: 10),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageOption extends StatelessWidget {
  const _LanguageOption({required this.option});

  final AppLanguage option;

  @override
  Widget build(BuildContext context) {
    final selected = context.settings.language == option;
    final palette = context.palette;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.settings.setLanguage(option);
        Navigator.of(context).pop();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? palette.chipBlue : palette.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? QuivroColors.blue : palette.border,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            _FlagImage(asset: option.flagAsset, width: 28, height: 19),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                option.nativeName,
                style: GoogleFonts.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: palette.text,
                ),
              ),
            ),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 180),
              opacity: selected ? 1 : 0,
              child: Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [QuivroColors.blue, QuivroColors.purple],
                  ),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  size: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThemeChip extends StatelessWidget {
  const _ThemeChip();

  @override
  Widget build(BuildContext context) {
    final settings = context.settings;
    final night = settings.isNight;
    final strings = context.strings;
    return _Chip(
      onTap: () {
        HapticFeedback.lightImpact();
        settings.toggleTheme();
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            transitionBuilder: (child, animation) => RotationTransition(
              turns: Tween<double>(begin: 0.75, end: 1).animate(animation),
              child: FadeTransition(opacity: animation, child: child),
            ),
            child: Icon(
              night ? Icons.nightlight_round : Icons.wb_sunny_rounded,
              key: ValueKey(night),
              size: 16,
              color: night ? const Color(0xFF93C5FD) : const Color(0xFFF59E0B),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            night ? strings.themeNight : strings.themeDay,
            style: GoogleFonts.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: context.palette.text,
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.onTap, required this.child});

  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: palette.card,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: palette.border, width: 2),
        ),
        child: child,
      ),
    );
  }
}

class _FlagImage extends StatelessWidget {
  const _FlagImage({required this.asset, this.width = 21, this.height = 14});

  final String asset;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(3),
      child: Image.asset(
        asset,
        width: width,
        height: height,
        fit: BoxFit.cover,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}
