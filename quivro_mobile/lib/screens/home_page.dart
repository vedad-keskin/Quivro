import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/profile_store.dart';
import '../core/room_repository.dart';
import '../core/settings.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import '../widgets/avatar_widgets.dart';
import '../widgets/credits_dialog.dart';
import '../widgets/host_hint.dart';
import '../widgets/home_coach_marks.dart';
import '../widgets/news_pile.dart';
import '../widgets/offline_banner.dart';
import '../widgets/quivro_snackbar.dart';
import '../widgets/settings_chips.dart';
import '../widgets/studio_mark.dart';
import '../widgets/wordmark.dart';

class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.profile,
    this.showCoachMarks = false,
  });

  final PlayerProfile profile;
  final bool showCoachMarks;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with SingleTickerProviderStateMixin {
  final _code = TextEditingController();
  final _codeFocus = FocusNode();
  final _newsKey = GlobalKey<NewsPileState>();
  final _hostBannerKey = GlobalKey();
  final _hostChipKey = GlobalKey();
  final _newsChipKey = GlobalKey();
  final _themeChipKey = GlobalKey();
  final _languageChipKey = GlobalKey();
  final _codeKey = GlobalKey();
  final _repo = RoomRepository();
  final _store = ProfileStore();
  late final AnimationController _hostAnimation;
  bool _hostExpanded = true;
  bool _hostAnimating = false;
  int _hostTransition = 0;
  late PlayerProfile _profile;
  bool _joining = false;
  bool _joinDown = false;
  bool _resumingSession = false;
  bool _homeReady = false;
  bool _newsReady = false;
  bool _newsOpen = true;
  bool _languageOpen = false;
  bool _coachFinished = false;
  bool _coachStartScheduled = false;
  int? _coachStep;
  Timer? _easterEggTimer;

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
    _hostAnimation = AnimationController(
      vsync: this,
      value: 1,
      duration: const Duration(milliseconds: 400),
    );
    _codeFocus.addListener(() {
      if (mounted) setState(() {});
    });
    _reloadProfile();
  }

  @override
  void didUpdateWidget(covariant HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _profile = widget.profile;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final expanded = context.settings.hostBannerExpanded;
    if (_hostExpanded != expanded) {
      _hostTransition++;
      _hostExpanded = expanded;
      _hostAnimating = false;
      _hostAnimation.value = expanded ? 1 : 0;
    }
  }

  Future<void> _reloadProfile() async {
    final latest = await _store.load();
    if (latest != null && mounted) {
      setState(() => _profile = latest);
    }
  }

  @override
  void dispose() {
    _easterEggTimer?.cancel();
    _hostTransition++;
    _hostAnimation.dispose();
    _codeFocus.dispose();
    _code.dispose();
    super.dispose();
  }

  bool get _tourPending => widget.showCoachMarks && !_coachFinished;

  bool get _coachVisible =>
      _coachStep != null && !_newsOpen && !_languageOpen && !_hostAnimating;

  GlobalKey get _coachTarget => [
    _newsChipKey,
    _themeChipKey,
    _languageChipKey,
    _hostExpanded ? _hostBannerKey : _hostChipKey,
    _codeKey,
  ][_coachStep!];

  void _markHomeReady() {
    if (!mounted || _homeReady) return;
    _homeReady = true;
    _maybeStartCoach();
  }

  void _maybeStartCoach() {
    if (!_tourPending ||
        _coachStep != null ||
        !_homeReady ||
        !_newsReady ||
        _newsOpen ||
        _languageOpen ||
        _hostAnimating ||
        _coachStartScheduled) {
      return;
    }
    _coachStartScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _coachStartScheduled = false;
      if (!mounted ||
          !_tourPending ||
          _newsOpen ||
          _languageOpen ||
          _hostAnimating) {
        return;
      }
      setState(() => _coachStep = 0);
      _revealCoachTarget();
    });
  }

  void _revealCoachTarget() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_coachVisible) return;
      final targetContext = _coachTarget.currentContext;
      if (targetContext != null) {
        Scrollable.ensureVisible(
          targetContext,
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : const Duration(milliseconds: 280),
          curve: Curves.easeInOutCubic,
          alignmentPolicy: ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
        );
      }
    });
  }

  void _onNewsVisibilityChanged(bool open) {
    if (!mounted) return;
    setState(() => _newsOpen = open);
    _maybeStartCoach();
    if (!open) _revealCoachTarget();
  }

  void _nextCoach() {
    if (_coachStep == 4) {
      _finishCoach();
      return;
    }
    setState(() => _coachStep = _coachStep! + 1);
    _revealCoachTarget();
  }

  void _setHostExpanded(bool expanded) {
    if (_hostExpanded == expanded && !_hostAnimating) return;
    final transition = ++_hostTransition;
    final reduce = MediaQuery.disableAnimationsOf(context);
    setState(() {
      _hostExpanded = expanded;
      _hostAnimating = !reduce;
    });
    unawaited(context.settings.setHostBannerExpanded(expanded));
    final destination = expanded ? 1.0 : 0.0;
    if (reduce) {
      _hostAnimation.value = destination;
      _maybeStartCoach();
      _revealCoachTarget();
      _revealHostFooter();
      return;
    }
    _hostAnimation
        .animateTo(destination, curve: Curves.easeInOutCubic)
        .whenCompleteOrCancel(() {
          if (!mounted || transition != _hostTransition) return;
          _finishHostMotion();
        });
  }

  void _finishHostMotion() {
    if (!_hostAnimating) return;
    setState(() => _hostAnimating = false);
    _maybeStartCoach();
    _revealCoachTarget();
    _revealHostFooter();
  }

  void _revealHostFooter() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_hostExpanded) return;
      final footer = _newsChipKey.currentContext;
      if (footer != null) {
        Scrollable.ensureVisible(
          footer,
          alignmentPolicy: ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
        );
      }
    });
  }

  void _finishCoach() {
    setState(() {
      _coachFinished = true;
      _coachStep = null;
    });
  }

  Future<void> _onTourBack() async {
    if (_newsOpen) {
      await _newsKey.currentState?.dismiss();
    } else {
      _finishCoach();
    }
  }

  Widget _tourControl({required Widget child, int? step}) {
    final excluded = _coachStep != null && _coachStep != step;
    return ExcludeFocus(
      excluding: excluded,
      child: ExcludeSemantics(excluding: excluded, child: child),
    );
  }

  Widget _footer() {
    final chip = 1 - _hostAnimation.value;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        SizedBox(
          width: 48,
          height: 48,
          child: chip > 0
              ? _tourControl(
                  step: 3,
                  child: IgnorePointer(
                    ignoring: _hostAnimating,
                    child: ExcludeFocus(
                      excluding: _hostAnimating,
                      child: ExcludeSemantics(
                        excluding: _hostAnimating,
                        child: Opacity(
                          opacity: chip,
                          child: Transform.translate(
                            offset: Offset(0, -12 * (1 - chip)),
                            child: HostTvChip(
                              key: _hostChipKey,
                              onTap: () => _setHostExpanded(true),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                )
              : null,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SettingsChips(
            singleRow: true,
            languageKey: _languageChipKey,
            themeKey: _themeChipKey,
            languageEnabled: _coachStep == null || _coachStep == 2,
            themeEnabled: _coachStep == null || _coachStep == 1,
            onLanguageSheetChanged: (open) {
              if (!mounted) return;
              setState(() => _languageOpen = open);
              if (!open) _revealCoachTarget();
            },
          ),
        ),
        const SizedBox(width: 8),
        _tourControl(
          step: 0,
          child: SizedBox(
            width: 48,
            child: NewsStamp(
              key: _newsChipKey,
              onTap: () => _newsKey.currentState?.openAll(),
            ),
          ),
        ),
      ],
    );
  }

  void _showCredits() {
    unawaited(CreditsDialog.show(context));
  }

  /// Called when the connection comes back: if the app booted offline with
  /// an active room session still stored, validate it now and hop back in.
  Future<void> _onReconnected() async {
    if (_resumingSession || _joining) return;
    _resumingSession = true;
    try {
      final session = await _repo.resolveActiveSession().timeout(
        const Duration(seconds: 4),
      );
      if (session == null || !mounted) return;
      showQuivroSnack(context, context.strings.rejoiningRoom);
      context.go(
        '/room/${session.code}',
        extra: {'playerId': session.playerId, 'profile': _profile},
      );
    } catch (_) {
      // Still flaky — the banner will reappear if we drop again.
    } finally {
      _resumingSession = false;
    }
  }

  Future<void> _join() async {
    if (_coachStep != null) return;
    final code = _code.text.trim().toUpperCase();
    if (code.length < 4) {
      showQuivroSnack(context, context.strings.enterRoomCode);
      return;
    }

    setState(() => _joining = true);
    try {
      final playerId = await _repo.joinRoom(
        code: code,
        name: _profile.nickname,
        avatar: _profile.avatar,
      );
      if (!mounted) return;
      context.go(
        '/room/$code',
        extra: {'playerId': playerId, 'profile': _profile},
      );
    } catch (e) {
      if (!mounted) return;
      final strings = context.strings;
      final text = e.toString();
      final message = text.contains('ROOM_NOT_FOUND')
          ? strings.roomNotFound
          : text.contains('ROOM_IN_PROGRESS')
          ? strings.gameInProgress
          : strings.couldNotJoin;
      showQuivroSnack(context, message, kind: QuivroSnackKind.error);
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final palette = context.palette;
    final safePadding = MediaQuery.paddingOf(context);
    return PopScope(
      canPop: !_tourPending,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _tourPending) unawaited(_onTourBack());
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 20,
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
                    return SingleChildScrollView(
                      clipBehavior: Clip.none,
                      padding: EdgeInsets.only(bottom: bottomInset),
                      keyboardDismissBehavior:
                          ScrollViewKeyboardDismissBehavior.onDrag,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minHeight: constraints.maxHeight,
                        ),
                        child: _CenteredHomeColumn(
                          centerOffset:
                              (safePadding.bottom - safePadding.top) / 2,
                          children: [
                            _tourControl(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Row(
                                    children: [
                                      const Expanded(
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: QuivroWordmarkHero(height: 56),
                                        ),
                                      ),
                                      GestureDetector(
                                            onTap: () => context.go(
                                              '/setup',
                                              extra: _profile,
                                            ),
                                            child: Container(
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: showInk(context),
                                                  width: 3,
                                                ),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: showInk(context),
                                                    offset: const Offset(3, 3),
                                                  ),
                                                ],
                                              ),
                                              child: AvatarBadge(
                                                index: _profile.avatar,
                                                size: 52,
                                              ),
                                            ),
                                          )
                                          .animate(delay: 250.ms)
                                          .fadeIn()
                                          .scale(
                                            begin: const Offset(0.6, 0.6),
                                            duration: 600.ms,
                                            curve: Curves.elasticOut,
                                          ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: const BrandSparkRule()
                                        .animate(delay: 280.ms)
                                        .scaleX(
                                          begin: 0,
                                          alignment: Alignment.centerLeft,
                                          duration: 450.ms,
                                          curve: Curves.easeOutCubic,
                                        )
                                        .fadeIn(duration: 200.ms),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    strings.playingAs(_profile.nickname),
                                    style: GoogleFonts.nunito(
                                      fontWeight: FontWeight.w700,
                                      color: palette.muted,
                                    ),
                                  ).animate(delay: 300.ms).fadeIn(),
                                ],
                              ),
                            ),
                            Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    _tourControl(
                                      child: Text(
                                        strings.joinARoom.toUpperCase(),
                                        textAlign: TextAlign.center,
                                        style: showDisplay(
                                          context,
                                          fontSize: 26,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    _tourControl(
                                      step: 4,
                                      child: Container(
                                        key: _codeKey,
                                        decoration: showPanel(
                                          ink: _codeFocus.hasFocus
                                              ? showBulb
                                              : showInk(context),
                                          fill: palette.card,
                                          radius: 18,
                                          shadow: const Offset(4, 4),
                                        ),
                                        child: TextField(
                                          controller: _code,
                                          focusNode: _codeFocus,
                                          textAlign: TextAlign.center,
                                          textCapitalization:
                                              TextCapitalization.characters,
                                          cursorColor: showBulb,
                                          style: showDisplay(
                                            context,
                                            fontSize: 28,
                                            letterSpacing: 8,
                                          ),
                                          inputFormatters: [
                                            FilteringTextInputFormatter.allow(
                                              RegExp(r'[A-Za-z0-9]'),
                                            ),
                                            LengthLimitingTextInputFormatter(6),
                                            _UpperCaseFormatter(),
                                          ],
                                          decoration: InputDecoration(
                                            hintText: strings.codeHint,
                                            filled: false,
                                            border: InputBorder.none,
                                            enabledBorder: InputBorder.none,
                                            focusedBorder: InputBorder.none,
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                                  vertical: 14,
                                                ),
                                            hintStyle: showDisplay(
                                              context,
                                              fontSize: 28,
                                              letterSpacing: 8,
                                              color: palette.muted,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                  ],
                                )
                                .animate(delay: 350.ms)
                                .fadeIn(duration: 400.ms)
                                .moveY(begin: 16, curve: Curves.easeOutCubic),
                            Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 10),
                                    _tourControl(
                                      child: GestureDetector(
                                        onTapDown: _joining
                                            ? null
                                            : (_) => setState(
                                                () => _joinDown = true,
                                              ),
                                        onTapUp: (_) {
                                          setState(() => _joinDown = false);
                                          if (!_joining) _join();
                                        },
                                        onTapCancel: () =>
                                            setState(() => _joinDown = false),
                                        child: AnimatedContainer(
                                          key: const ValueKey(
                                            'home-join-button',
                                          ),
                                          duration: const Duration(
                                            milliseconds: 80,
                                          ),
                                          height: 56,
                                          transform: Matrix4.translationValues(
                                            0,
                                            _joinDown && !_joining ? 6 : 0,
                                            0,
                                          ),
                                          alignment: Alignment.center,
                                          decoration: showPanel(
                                            ink: showInk(context),
                                            fill: _joining
                                                ? showBulb.withValues(
                                                    alpha: 0.5,
                                                  )
                                                : showBulb,
                                            radius: 16,
                                            shadow: Offset(
                                              0,
                                              _joinDown && !_joining ? 0 : 6,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                (_joining
                                                        ? strings.joining
                                                        : strings.join)
                                                    .toUpperCase(),
                                                style: showDisplay(
                                                  context,
                                                  fontSize: 24,
                                                  letterSpacing: 1,
                                                  color: showInkDay,
                                                ),
                                              ),
                                              if (!_joining) ...[
                                                const SizedBox(width: 8),
                                                const Icon(
                                                  Icons.play_arrow,
                                                  color: showInkDay,
                                                  size: 22,
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    _tourControl(
                                      child: TextButton(
                                        onPressed: () => context.go(
                                          '/setup',
                                          extra: _profile,
                                        ),
                                        child: Text(
                                          strings.editNicknameAvatar,
                                          style: GoogleFonts.nunito(
                                            fontWeight: FontWeight.w700,
                                            color: palette.muted,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    _tourControl(
                                      child: Center(
                                        child: GestureDetector(
                                          onLongPressStart: (_) {
                                            _easterEggTimer?.cancel();
                                            _easterEggTimer = Timer(
                                              const Duration(seconds: 2),
                                              () {
                                                if (mounted) _showCredits();
                                              },
                                            );
                                          },
                                          onLongPressEnd: (_) =>
                                              _easterEggTimer?.cancel(),
                                          onLongPressCancel: () =>
                                              _easterEggTimer?.cancel(),
                                          child: const StudioMark(),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                                .animate(delay: 350.ms)
                                .fadeIn(duration: 400.ms)
                                .moveY(begin: 16, curve: Curves.easeOutCubic),
                            AnimatedBuilder(
                                  animation: _hostAnimation,
                                  child: _tourControl(
                                    step: 3,
                                    child: HostHomeBanner(
                                      key: _hostBannerKey,
                                      onClose: () => _setHostExpanded(false),
                                    ),
                                  ),
                                  builder: (context, banner) {
                                    final progress = _hostAnimation.value;
                                    if (_hostAnimating && _hostExpanded) {
                                      _revealHostFooter();
                                    }
                                    return Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        if (progress > 0)
                                          IgnorePointer(
                                            ignoring: _hostAnimating,
                                            child: ExcludeFocus(
                                              excluding: _hostAnimating,
                                              child: ExcludeSemantics(
                                                excluding: _hostAnimating,
                                                child: Align(
                                                  alignment:
                                                      Alignment.bottomLeft,
                                                  heightFactor: progress,
                                                  child: Opacity(
                                                    opacity: progress,
                                                    child: Transform.translate(
                                                      offset: Offset(
                                                        -24 * (1 - progress),
                                                        24 * (1 - progress),
                                                      ),
                                                      child: Transform.scale(
                                                        alignment: Alignment
                                                            .bottomLeft,
                                                        scale:
                                                            0.4 +
                                                            0.6 * progress,
                                                        child: banner,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        SizedBox(height: 16 * progress),
                                        _footer(),
                                      ],
                                    );
                                  },
                                )
                                .animate(
                                  delay: 550.ms,
                                  onComplete: (_) => _markHomeReady(),
                                )
                                .fadeIn(duration: 400.ms),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 6, right: 16),
                  child: OfflineBanner(onReconnected: _onReconnected),
                ),
              ),
              Positioned.fill(
                child: NewsPile(
                  key: _newsKey,
                  onVisibilityChanged: _onNewsVisibilityChanged,
                  onReady: () {
                    _newsReady = true;
                    _maybeStartCoach();
                  },
                ),
              ),
              if (_coachVisible)
                Positioned.fill(
                  child: HomeCoachMarks(
                    step: _coachStep!,
                    targetKey: _coachTarget,
                    onNext: _nextCoach,
                    onSkip: _finishCoach,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CenteredHomeColumn extends Column {
  const _CenteredHomeColumn({
    required super.children,
    required this.centerOffset,
  }) : super(
         crossAxisAlignment: CrossAxisAlignment.stretch,
         mainAxisAlignment: MainAxisAlignment.spaceBetween,
       );

  final double centerOffset;

  @override
  RenderFlex createRenderObject(BuildContext context) =>
      _CenteredHomeRenderFlex(
        centerOffset,
        textDirection: Directionality.of(context),
      );

  @override
  void updateRenderObject(
    BuildContext context,
    covariant _CenteredHomeRenderFlex renderObject,
  ) {
    super.updateRenderObject(context, renderObject);
    renderObject.centerOffset = centerOffset;
  }
}

class _CenteredHomeRenderFlex extends RenderFlex {
  _CenteredHomeRenderFlex(this._centerOffset, {required super.textDirection})
    : super(
        direction: Axis.vertical,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
      );

  double _centerOffset;

  set centerOffset(double value) {
    if (_centerOffset == value) return;
    _centerOffset = value;
    markNeedsLayout();
  }

  @override
  void performLayout() {
    super.performLayout();
    final header = firstChild!;
    final codeGroup = childAfter(header)!;
    final joinGroup = childAfter(codeGroup)!;
    final footer = childAfter(joinGroup)!;
    final codeData = codeGroup.parentData! as FlexParentData;
    final joinData = joinGroup.parentData! as FlexParentData;
    final footerData = footer.parentData! as FlexParentData;
    final formHeight = codeGroup.size.height + joinGroup.size.height;
    // Both groups include half the gap, so their boundary is its midpoint.
    // The minimum height is the viewport, even when the content must scroll.
    // Account for unequal system insets to center on the actual screen.
    final top =
        (constraints.minHeight / 2 + _centerOffset - codeGroup.size.height)
            .clamp(
              header.size.height,
              (footerData.offset.dy - formHeight).clamp(
                header.size.height,
                double.infinity,
              ),
            );
    codeData.offset = Offset(codeData.offset.dx, top);
    joinData.offset = Offset(joinData.offset.dx, top + codeGroup.size.height);
  }
}

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
