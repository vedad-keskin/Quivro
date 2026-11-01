import 'package:flutter/material.dart';
import '../core/strings.dart';
import '../core/theme.dart';

const _hostWebsite = 'quivro.org';

class HostHomeBanner extends StatelessWidget {
  const HostHomeBanner({super.key, this.onClose});

  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final ink = showInk(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 280;
        final imageWidth = compact ? 160.0 : 180.0;
        final titleStyle = showDisplay(
          context,
          fontSize: compact ? 16 : 18,
          letterSpacing: 0.2,
          color: Colors.white,
        );
        return Semantics(
          container: true,
          explicitChildNodes: true,
          label:
              '${strings.hostBannerTitle} $_hostWebsite. '
              '${strings.hostBannerDescription}',
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Padding(
                padding: EdgeInsets.only(top: onClose == null ? 0 : 16),
                child: ExcludeSemantics(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        constraints: BoxConstraints(
                          minHeight: compact ? 78 : 82,
                        ),
                        decoration: showPanel(
                          ink: ink,
                          fill: showBulb,
                          shadow: const Offset(0, 4),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 7, 0, 7),
                          child: Row(
                            children: [
                              SizedBox(width: compact ? 80 : 104),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Text(
                                          strings.hostBannerTitle,
                                          textAlign: TextAlign.center,
                                          style: titleStyle.copyWith(
                                            foreground: Paint()
                                              ..color = ink
                                              ..style = PaintingStyle.stroke
                                              ..strokeWidth = 3,
                                          ),
                                        ),
                                        Text(
                                          strings.hostBannerTitle,
                                          textAlign: TextAlign.center,
                                          style: titleStyle,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      constraints: const BoxConstraints(
                                        minHeight: 32,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: showInkDay,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Flexible(
                                            child: Text(
                                              _hostWebsite,
                                              textAlign: TextAlign.center,
                                              style: showDisplay(
                                                context,
                                                fontSize: compact ? 15 : 16,
                                                letterSpacing: 0.2,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          const Icon(
                                            Icons.north_east,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        left: compact ? -24 : -15,
                        top: -12,
                        bottom: 3,
                        width: imageWidth,
                        child: IgnorePointer(
                          child: ClipRect(
                            child: OverflowBox(
                              alignment: Alignment.bottomLeft,
                              minWidth: imageWidth,
                              maxWidth: imageWidth,
                              minHeight: imageWidth * 2 / 3,
                              maxHeight: imageWidth * 2 / 3,
                              child: Transform.translate(
                                offset: Offset(0, compact ? 10 : 15),
                                child: Image.asset(
                                  'assets/branding/host_monitor.webp',
                                  width: imageWidth,
                                  height: imageWidth * 2 / 3,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (onClose != null)
                Positioned(
                  top: 0,
                  right: 0,
                  width: 48,
                  height: 48,
                  child: IconButton(
                    onPressed: onClose,
                    tooltip: strings.close,
                    padding: EdgeInsets.zero,
                    icon: Transform.translate(
                      offset: const Offset(0, -10),
                      child: Container(
                        key: const ValueKey('host-banner-close-face'),
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: showPanel(
                          ink: ink,
                          fill: context.palette.card,
                          radius: 8,
                          shadow: const Offset(0, 3),
                        ),
                        child: ExcludeSemantics(
                          child: Text(
                            '\u00d7',
                            textScaler: TextScaler.noScaling,
                            style: showDisplay(
                              context,
                              fontSize: 20,
                              color: context.palette.text,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class HostTvChip extends StatelessWidget {
  const HostTvChip({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final night = Theme.of(context).brightness == Brightness.dark;
    final label = context.strings.coachTitles[3];
    return Semantics(
      button: true,
      label: label,
      child: Tooltip(
        message: label,
        excludeFromSemantics: true,
        child: Container(
          width: 48,
          height: 48,
          decoration: showPanel(
            ink: showInk(context),
            fill: night ? context.palette.card : Colors.white,
            radius: 12,
            shadow: const Offset(0, 4),
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(12),
              child: Icon(
                Icons.tv,
                size: 16,
                color: night ? Colors.white : showInkDay,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
