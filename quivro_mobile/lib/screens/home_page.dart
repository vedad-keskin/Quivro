import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/profile_store.dart';
import '../core/room_repository.dart';
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

class _HomePageState extends State<HomePage> {
  final _code = TextEditingController();
  final _codeFocus = FocusNode();
  final _hostHintKey = GlobalKey<HostHintState>();
  final _newsKey = GlobalKey<NewsPileState>();
  final _hostChipKey = GlobalKey();
  final _newsChipKey = GlobalKey();
  final _themeChipKey = GlobalKey();
  final _languageChipKey = GlobalKey();
  final _codeKey = GlobalKey();
  final _hostProgress = ValueNotifier<double>(1);
  final _repo = RoomRepository();
  final _store = ProfileStore();
  late PlayerProfile _profile;
  bool _joining = false;
  bool _joinDown = false;
  bool _resumingSession = false;
  bool _homeReady = false;
  bool _newsReady = false;
  bool _newsOpen = true;
  bool _hostOpen = false;
  bool _languageOpen = false;
  bool _coachFinished = false;
  bool _coachStartScheduled = false;
  int? _coachStep;
  Timer? _easterEggTimer;

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
    _hostProgress.addListener(_onHostProgress);
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

  Future<void> _reloadProfile() async {
    final latest = await _store.load();
    if (latest != null && mounted) {
      setState(() => _profile = latest);
    }
  }

  @override
  void dispose() {
    _easterEggTimer?.cancel();
    _hostProgress.dispose();
    _codeFocus.dispose();
    _code.dispose();
    super.dispose();
  }

  bool get _tourPending => widget.showCoachMarks && !_coachFinished;

  bool get _coachVisible =>
      _coachStep != null && !_newsOpen && !_hostOpen && !_languageOpen;

  GlobalKey get _coachTarget => [
    _newsChipKey,
    _themeChipKey,
    _languageChipKey,
    _hostChipKey,
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
        _hostOpen ||
        _languageOpen ||
        _coachStartScheduled) {
      return;
    }
    _coachStartScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _coachStartScheduled = false;
      if (!mounted ||
          !_tourPending ||
          _newsOpen ||
          _hostOpen ||
          _languageOpen) {
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

  void _onHostProgress() {
    final open = _hostProgress.value < 1;
    if (!mounted || open == _hostOpen) return;
    setState(() => _hostOpen = open);
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

  void _finishCoach() {
    setState(() {
      _coachFinished = true;
      _coachStep = null;
    });
  }

  Future<void> _onTourBack() async {
    if (_newsOpen) {
      await _newsKey.currentState?.dismiss();
    } else if (_hostOpen) {
      await _hostHintKey.currentState?.collapse();
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final host = _tourControl(
          step: 3,
          child: ValueListenableBuilder<double>(
            valueListenable: _hostProgress,
            builder: (context, progress, _) => Opacity(
              opacity: progress >= 1 ? 1 : 0,
              child: IgnorePointer(
                ignoring: progress < 1,
                child: HostTvChip(
                  key: _hostChipKey,
                  onTap: () => _hostHintKey.currentState?.expand(),
                ),
              ),
            ),
          ),
        );
        final settings = SettingsChips(
          languageKey: _languageChipKey,
          themeKey: _themeChipKey,
          languageEnabled: _coachStep == null || _coachStep == 2,
          themeEnabled: _coachStep == null || _coachStep == 1,
          onLanguageSheetChanged: (open) {
            if (!mounted) return;
            setState(() => _languageOpen = open);
            if (!open) _revealCoachTarget();
          },
        );
        final news = _tourControl(
          step: 0,
          child: NewsStamp(
            key: _newsChipKey,
            onTap: () => _newsKey.currentState?.openAll(),
          ),
        );
        if (constraints.maxWidth < 300) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(child: settings),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [host, news],
              ),
            ],
          );
        }
        return Row(
          children: [
            host,
            Expanded(child: Center(child: settings)),
            news,
          ],
        );
      },
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
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                                    const SizedBox(height: 20),
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
                                .slideY(
                                  begin: 0.06,
                                  curve: Curves.easeOutCubic,
                                ),
                            _footer()
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
                child: HostHint(
                  key: _hostHintKey,
                  progress: _hostProgress,
                  anchorKey: _hostChipKey,
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

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
