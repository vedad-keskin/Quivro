import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_models.dart';
import '../core/room_repository.dart';
import '../core/sfx.dart';
import '../widgets/avatar_widgets.dart';
import '../widgets/quivro_snackbar.dart';

class RoomPage extends StatefulWidget {
  const RoomPage({
    super.key,
    required this.code,
    required this.playerId,
    required this.profile,
  });

  final String code;
  final String playerId;
  final PlayerProfile profile;

  @override
  State<RoomPage> createState() => _RoomPageState();
}

class _RoomPageState extends State<RoomPage> with WidgetsBindingObserver {
  final _repo = RoomRepository();
  final _sfx = Sfx();
  late final Stream<RoomState?> _stream;
  late PlayerProfile _profile;
  bool _submitting = false;
  int? _picked;
  int _trackedQuestion = -1;
  bool _optingIn = false;
  bool _exitingClosedRoom = false;
  bool _sawRoom = false;
  bool _manualLeave = false;

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
    WidgetsBinding.instance.addObserver(this);
    _stream = _repo.watchRoom(widget.code);
    unawaited(_sfx.preload());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_sfx.dispose());
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_revalidateSession());
    }
  }

  Future<void> _revalidateSession() async {
    if (_exitingClosedRoom || !mounted) return;
    final ok = await _repo.validateActiveSession(
      code: widget.code,
      playerId: widget.playerId,
    );
    if (!ok && mounted && !_exitingClosedRoom) {
      _handleRoomEnded(message: 'This room has ended');
    }
  }

  /// Forced exit (room closed, kicked, connection lost) — keep Firebase player
  /// so accidental kills can still resume when applicable.
  Future<void> _leaveToHome({bool showClosed = false, String? message}) async {
    await _repo.clearActiveSession();
    if (!mounted) return;
    if (showClosed) {
      showQuivroSnack(context, 'Room closed');
    } else if (message != null) {
      showQuivroSnack(context, message);
    }
    context.go('/', extra: _profile);
  }

  /// Intentional Leave / Quit / Home — remove player from Firebase.
  Future<void> _leaveRoomManually() async {
    if (_exitingClosedRoom) return;
    _exitingClosedRoom = true;
    _manualLeave = true;
    await _repo.leaveRoom(code: widget.code, playerId: widget.playerId);
    if (!mounted) return;
    context.go('/', extra: _profile);
  }

  Future<void> _confirmQuitGame() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Leave this game?',
          style: GoogleFonts.nunito(fontWeight: FontWeight.w800),
        ),
        content: Text(
          'You will be removed from the room.',
          style: GoogleFonts.nunito(fontWeight: FontWeight.w600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Leave',
              style: GoogleFonts.nunito(
                fontWeight: FontWeight.w800,
                color: const Color(0xFFEC4899),
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _leaveRoomManually();
    }
  }

  void _openSetup() {
    context.go('/setup', extra: {
      'existing': _profile,
      'returnTo': '/room/${widget.code}',
      'returnPlayerId': widget.playerId,
    });
  }

  void _handleRoomClosed() {
    _handleRoomEnded(showClosed: true);
  }

  void _handleRoomEnded({bool showClosed = false, String? message}) {
    if (_exitingClosedRoom) return;
    _exitingClosedRoom = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_leaveToHome(showClosed: showClosed, message: message));
    });
  }

  void _handleStaleRoom() {
    _handleRoomEnded(message: 'This room has ended');
  }

  void _handleConnectionError() {
    if (_exitingClosedRoom) return;
    _exitingClosedRoom = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_leaveToHome(message: 'Connection lost'));
    });
  }

  Future<void> _answer(RoomState room, int choice) async {
    if (room.phase != 'question' || _submitting) return;
    if (!AnswerSubmissionPolicy.canSubmit(
      room: room,
      playerId: widget.playerId,
      questionIndex: room.currentIndex,
      choice: choice,
      nowMs: _repo.nowMs(),
    )) {
      return;
    }

    final currentChoice = _picked ?? room.choiceOf(widget.playerId);
    setState(() => _picked = choice);
    if (currentChoice == choice) return;

    setState(() => _submitting = true);
    unawaited(_sfx.playGuess());
    try {
      await _repo.submitAnswer(
        code: widget.code,
        questionIndex: room.currentIndex,
        playerId: widget.playerId,
        choice: choice,
      );
    } catch (_) {
      if (mounted) {
        showQuivroSnack(context, 'Could not send answer', kind: QuivroSnackKind.error);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _optInRematch() async {
    if (_optingIn) return;
    setState(() => _optingIn = true);
    try {
      await _repo.setRematchReady(
        code: widget.code,
        playerId: widget.playerId,
      );
    } catch (_) {
      if (mounted) {
        showQuivroSnack(context, 'Could not join rematch', kind: QuivroSnackKind.error);
      }
    } finally {
      if (mounted) setState(() => _optingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<RoomState?>(
      stream: _stream,
      builder: (context, snap) {
        if (snap.hasError) {
          _handleConnectionError();
          return Scaffold(
            body: Center(child: Text('Connection error: ${snap.error}')),
          );
        }
        final room = snap.data;
        if (room == null) {
          final waiting = snap.connectionState == ConnectionState.waiting && !_sawRoom;
          if (!waiting) {
            _handleRoomClosed();
          }
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(waiting ? 'Connecting…' : 'Room closed'),
                ],
              ),
            ),
          );
        }

        _sawRoom = true;

        final self = room.player(widget.playerId);
        // Removed from the room (e.g. rematch started without opting in).
        if (self == null) {
          if (_manualLeave) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted || _exitingClosedRoom) return;
            _handleRoomEnded(message: 'Round started without you');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Prefer live Firebase name/avatar when present.
        final liveProfile = PlayerProfile(
          nickname: self.name,
          avatar: self.avatar,
        );
        if (liveProfile != _profile) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _profile = liveProfile);
          });
        }

        if (RoomSessionPolicy.isStalePlayState(room, _repo.nowMs())) {
          _handleStaleRoom();
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('This room has ended'),
                ],
              ),
            ),
          );
        }

        if (room.currentIndex != _trackedQuestion) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            setState(() {
              _trackedQuestion = room.currentIndex;
              _picked = room.choiceOf(widget.playerId);
            });
          });
        }

        if (room.phase == 'lobby') {
          return _LobbyView(
            code: widget.code,
            profile: _profile,
            onLeave: () => unawaited(_leaveRoomManually()),
            onEditProfile: _openSetup,
          );
        }

        if (room.phase == 'finished') {
          return _FinishedView(
            room: room,
            playerId: widget.playerId,
            profile: _profile,
            optedIn: room.isRematchReady(widget.playerId),
            optingIn: _optingIn,
            onPlayAgain: _optInRematch,
            onHome: () => unawaited(_leaveRoomManually()),
            onEditProfile: _openSetup,
          );
        }

        if (room.currentQuestion == null) {
          // Transient state during host transitions — Firebase may deliver
          // the phase change before the currentQuestion payload arrives.
          // Show a brief loading indicator; the next snapshot will carry
          // the real question data.
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final picked = _picked ?? room.choiceOf(widget.playerId);

        return _PlayView(
          room: room,
          profile: _profile,
          picked: picked,
          onPick: (i) => _answer(room, i),
          nowMs: _repo.nowMs,
          onQuit: () => unawaited(_confirmQuitGame()),
        );
      },
    );
  }
}

class _LobbyView extends StatelessWidget {
  const _LobbyView({
    required this.code,
    required this.profile,
    required this.onLeave,
    required this.onEditProfile,
  });

  final String code;
  final PlayerProfile profile;
  final VoidCallback onLeave;
  final VoidCallback onEditProfile;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Quivro',
                          style: GoogleFonts.nunito(
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.only(top: 6),
                          height: 4,
                          width: 64,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [QuivroColors.blue, QuivroColors.purple],
                            ),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: onEditProfile,
                    child: AvatarBadge(index: profile.avatar, size: 52),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Playing as ${profile.nickname}',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              const Spacer(),
              Text(
                'Room',
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              Text(
                code,
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 42,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 8,
                  color: QuivroColors.blue,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Waiting for the host to start…',
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onLeave,
                child: Text(
                  'Leave',
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w700,
                    color: QuivroColors.muted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlayView extends StatefulWidget {
  const _PlayView({
    required this.room,
    required this.profile,
    required this.picked,
    required this.onPick,
    required this.nowMs,
    required this.onQuit,
  });

  final RoomState room;
  final PlayerProfile profile;
  final int? picked;
  final ValueChanged<int> onPick;
  final int Function() nowMs;
  final VoidCallback onQuit;

  @override
  State<_PlayView> createState() => _PlayViewState();
}

class _PlayViewState extends State<_PlayView> {
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    _tick = Timer.periodic(const Duration(milliseconds: 200), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final room = widget.room;
    final q = room.currentQuestion!;
    final isReveal = room.phase == 'reveal';
    final now = widget.nowMs();
    final waitingForTv =
        room.phase == 'question' && now < q.answerOpensAt;
    final locked = room.phase != 'question' ||
        waitingForTv ||
        now > q.endsAt;

    return Scaffold(
      backgroundColor: QuivroColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  AvatarBadge(index: widget.profile.avatar, size: 40),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Q ${q.index + 1} / ${q.total}',
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          '${q.category} · ${q.difficulty}',
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.w700,
                            color: QuivroColors.muted,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: widget.onQuit,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Quit',
                      style: GoogleFonts.nunito(
                        fontWeight: FontWeight.w800,
                        color: QuivroColors.muted,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  if (room.phase == 'question' && !waitingForTv)
                    _Countdown(
                      endsAt: q.endsAt,
                      durationMs: q.durationMs,
                      nowMs: widget.nowMs,
                    )
                  else
                    Container(
                      width: 56,
                      height: 56,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F3FF),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(
                          color: QuivroColors.purple,
                          width: 3,
                        ),
                      ),
                      child: Text(
                        waitingForTv
                            ? 'TV'
                            : (isReveal ? 'Locked' : room.phase),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          height: 1.1,
                          color: QuivroColors.purple,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                waitingForTv
                    ? 'Look at the TV…'
                    : room.phase == 'question'
                        ? 'Tap another answer to change'
                        : 'Answers locked',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w800,
                  color: waitingForTv
                      ? QuivroColors.purple
                      : room.phase == 'question'
                          ? QuivroColors.blue
                          : QuivroColors.purple,
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                child: Column(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: _AnswerTile(
                              index: 0,
                              selected: widget.picked == 0,
                              enabled: !locked,
                              onTap: () => widget.onPick(0),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AnswerTile(
                              index: 1,
                              selected: widget.picked == 1,
                              enabled: !locked,
                              onTap: () => widget.onPick(1),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: _AnswerTile(
                              index: 2,
                              selected: widget.picked == 2,
                              enabled: !locked,
                              onTap: () => widget.onPick(2),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AnswerTile(
                              index: 3,
                              selected: widget.picked == 3,
                              enabled: !locked,
                              onTap: () => widget.onPick(3),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnswerTile extends StatefulWidget {
  const _AnswerTile({
    required this.index,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final int index;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  State<_AnswerTile> createState() => _AnswerTileState();
}

class _AnswerTileState extends State<_AnswerTile> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (!widget.enabled || _pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final base = answerColors[widget.index];
    final fill = widget.selected
        ? Color.lerp(base, Colors.white, 0.08)!
        : base;
    final dimmed = !widget.enabled && !widget.selected;

    return SizedBox.expand(
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: GestureDetector(
          onTapDown: widget.enabled ? (_) => _setPressed(true) : null,
          onTapUp: widget.enabled
              ? (_) {
                  _setPressed(false);
                  widget.onTap();
                }
              : null,
          onTapCancel: widget.enabled ? () => _setPressed(false) : null,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 180),
            opacity: dimmed ? 0.55 : 1,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                color: fill,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  width: 3,
                  color: widget.selected
                      ? Colors.white
                      : Colors.transparent,
                ),
                boxShadow: [
                  BoxShadow(
                    color: QuivroColors.navy.withValues(alpha: 0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(21),
                child: Stack(
                  children: [
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.55),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          answerLabels[widget.index],
                          style: GoogleFonts.nunito(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: QuivroColors.navy,
                          ),
                        ),
                      ),
                    ),
                    Center(
                      child: Text(
                        answerLabels[widget.index],
                        style: GoogleFonts.nunito(
                          fontSize: 64,
                          fontWeight: FontWeight.w900,
                          color: QuivroColors.navy,
                        ),
                      ),
                    ),
                    Positioned(
                      right: 12,
                      bottom: 12,
                      child: AnimatedScale(
                        scale: widget.selected ? 1.0 : 0.8,
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutBack,
                        child: AnimatedOpacity(
                          opacity: widget.selected ? 1 : 0,
                          duration: const Duration(milliseconds: 180),
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.check_rounded,
                              size: 18,
                              color: QuivroColors.navy,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Countdown extends StatefulWidget {
  const _Countdown({
    required this.endsAt,
    required this.durationMs,
    required this.nowMs,
  });

  final int endsAt;
  final int durationMs;
  final int Function() nowMs;

  @override
  State<_Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<_Countdown> {
  Timer? _timer;
  int _left = 0;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(milliseconds: 200), (_) => _tick());
  }

  @override
  void didUpdateWidget(covariant _Countdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.endsAt != widget.endsAt) {
      _tick();
    }
  }

  void _tick() {
    final leftMs = widget.endsAt - widget.nowMs();
    final maxSecs = (widget.durationMs / 1000).ceil();
    final secs = (leftMs / 1000).ceil().clamp(0, maxSecs);
    if (secs != _left && mounted) setState(() => _left = secs);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final urgent = _left <= 5;
    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: urgent ? const Color(0xFFFCE7F3) : const Color(0xFFE0F2FE),
        border: Border.all(
          color: urgent ? const Color(0xFFEC4899) : QuivroColors.blue,
          width: 3,
        ),
      ),
      child: Text(
        '$_left',
        style: GoogleFonts.nunito(
          fontWeight: FontWeight.w900,
          fontSize: 22,
          color: urgent ? const Color(0xFFEC4899) : QuivroColors.blue,
        ),
      ),
    );
  }
}

class _FinishedView extends StatelessWidget {
  const _FinishedView({
    required this.room,
    required this.playerId,
    required this.profile,
    required this.optedIn,
    required this.optingIn,
    required this.onPlayAgain,
    required this.onHome,
    required this.onEditProfile,
  });

  final RoomState room;
  final String playerId;
  final PlayerProfile profile;
  final bool optedIn;
  final bool optingIn;
  final VoidCallback onPlayAgain;
  final VoidCallback onHome;
  final VoidCallback onEditProfile;

  @override
  Widget build(BuildContext context) {
    final ranked = room.ranked();
    final winnerIds = room.lastWinners.map((w) => w.playerId).toSet();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Final leaderboard',
                      style: GoogleFonts.nunito(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: onEditProfile,
                    child: AvatarBadge(index: profile.avatar, size: 44),
                  ),
                ],
              ),
              if (room.lastWinners.length == 1) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      'Winner: ',
                      style: GoogleFonts.nunito(
                        fontWeight: FontWeight.w700,
                        color: QuivroColors.muted,
                      ),
                    ),
                    AvatarBadge(index: room.lastWinners.first.avatar, size: 28),
                    const SizedBox(width: 8),
                    Text(
                      room.lastWinners.first.name,
                      style: GoogleFonts.nunito(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ] else if (room.lastWinners.length > 1) ...[
                const SizedBox(height: 4),
                Text(
                  'Tied winners:',
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w700,
                    color: QuivroColors.muted,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    for (final w in room.lastWinners) ...[
                      AvatarBadge(index: w.avatar, size: 28),
                      Text(
                        w.name,
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
              const SizedBox(height: 16),
              Expanded(
                child: ListView.separated(
                  itemCount: ranked.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final p = ranked[i];
                    final isSelf = p.id == playerId;
                    final isWinner = winnerIds.contains(p.id);
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isSelf
                            ? const Color(0xFFE0F2FE)
                            : isWinner
                                ? const Color(0xFFF5F3FF)
                                : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelf
                              ? QuivroColors.blue
                              : isWinner
                                  ? QuivroColors.purple
                                  : const Color(0xFFE2E8F0),
                          width: isSelf || isWinner ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 28,
                            child: Text(
                              '${i + 1}',
                              style: GoogleFonts.nunito(
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                                color: QuivroColors.muted,
                              ),
                            ),
                          ),
                          AvatarBadge(index: p.avatar, size: 40),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name,
                                  style: GoogleFonts.nunito(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                  ),
                                ),
                                if (p.wins > 0)
                                  Text(
                                    '${p.wins}W',
                                    style: GoogleFonts.nunito(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                      color: QuivroColors.purple,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Text(
                            '${p.score}',
                            style: GoogleFonts.nunito(
                              fontWeight: FontWeight.w900,
                              fontSize: 20,
                              color: QuivroColors.blue,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              if (optedIn) ...[
                const SizedBox(height: 8),
                Text(
                  "You're in for another round — waiting for the host…",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w800,
                    color: QuivroColors.blue,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: optedIn || optingIn ? null : onPlayAgain,
                  child: Text(
                    optedIn
                        ? 'Ready!'
                        : optingIn
                            ? 'Joining…'
                            : 'Play again',
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onHome,
                  child: const Text('Home'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
