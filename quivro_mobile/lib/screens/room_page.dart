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
  bool _submitting = false;
  int? _picked;
  int _trackedQuestion = -1;
  bool _optingIn = false;
  bool _exitingClosedRoom = false;
  bool _sawRoom = false;
  int? _submittedForIndex;

  @override
  void initState() {
    super.initState();
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

  Future<void> _leaveToHome({bool showClosed = false, String? message}) async {
    await _repo.clearActiveSession();
    if (!mounted) return;
    if (showClosed) {
      showQuivroSnack(context, 'Room closed');
    } else if (message != null) {
      showQuivroSnack(context, message);
    }
    context.go('/', extra: widget.profile);
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
    if (_submittedForIndex == room.currentIndex || room.hasAnswered(widget.playerId)) {
      return;
    }
    if (!AnswerSubmissionPolicy.canSubmit(
      room: room,
      playerId: widget.playerId,
      questionIndex: room.currentIndex,
      choice: choice,
      nowMs: _repo.nowMs(),
    )) {
      return;
    }

    setState(() {
      _submitting = true;
      _picked = choice;
    });
    unawaited(_sfx.playGuess());
    try {
      await _repo.submitAnswer(
        code: widget.code,
        questionIndex: room.currentIndex,
        playerId: widget.playerId,
        choice: choice,
      );
      if (mounted) {
        setState(() => _submittedForIndex = room.currentIndex);
      }
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

        // Removed from the room (e.g. rematch started without opting in).
        if (room.player(widget.playerId) == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted || _exitingClosedRoom) return;
            _handleRoomEnded(message: 'Round started without you');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
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
              if (room.hasAnswered(widget.playerId)) {
                _submittedForIndex = room.currentIndex;
              } else if (_submittedForIndex != room.currentIndex) {
                _submittedForIndex = null;
              }
            });
          });
        }

        if (room.phase == 'lobby') {
          return _LobbyView(
            code: widget.code,
            profile: widget.profile,
            onLeave: () => unawaited(_leaveToHome()),
          );
        }

        if (room.phase == 'finished') {
          return _FinishedView(
            room: room,
            playerId: widget.playerId,
            profile: widget.profile,
            optedIn: room.isRematchReady(widget.playerId),
            optingIn: _optingIn,
            onPlayAgain: _optInRematch,
            onHome: () => unawaited(_leaveToHome()),
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
        final canChange = room.phase == 'question' &&
            _submittedForIndex != room.currentIndex &&
            !room.hasAnswered(widget.playerId) &&
            _repo.nowMs() <= room.currentQuestion!.endsAt;

        return _PlayView(
          room: room,
          profile: widget.profile,
          locked: !canChange,
          picked: picked,
          onPick: (i) => _answer(room, i),
          nowMs: _repo.nowMs,
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
  });

  final String code;
  final PlayerProfile profile;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Quivro',
                  style: GoogleFonts.nunito(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const Spacer(),
              AvatarBadge(index: profile.avatar, size: 72),
              const SizedBox(height: 12),
              Text(
                profile.nickname,
                style: GoogleFonts.nunito(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Room',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              Text(
                code,
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

class _PlayView extends StatelessWidget {
  const _PlayView({
    required this.room,
    required this.profile,
    required this.locked,
    required this.picked,
    required this.onPick,
    required this.nowMs,
  });

  final RoomState room;
  final PlayerProfile profile;
  final bool locked;
  final int? picked;
  final ValueChanged<int> onPick;
  final int Function() nowMs;

  @override
  Widget build(BuildContext context) {
    final q = room.currentQuestion!;
    final isReveal = room.phase == 'reveal';

    return Scaffold(
      backgroundColor: QuivroColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  AvatarBadge(index: profile.avatar, size: 40),
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
                  if (room.phase == 'question')
                    _Countdown(
                      endsAt: q.endsAt,
                      durationMs: q.durationMs,
                      nowMs: nowMs,
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
                        isReveal ? 'Locked' : room.phase,
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
                room.phase == 'question'
                    ? 'Tap another answer to change'
                    : 'Answers locked',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w800,
                  color: room.phase == 'question'
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
                              selected: picked == 0,
                              enabled: !locked,
                              onTap: () => onPick(0),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AnswerTile(
                              index: 1,
                              selected: picked == 1,
                              enabled: !locked,
                              onTap: () => onPick(1),
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
                              selected: picked == 2,
                              enabled: !locked,
                              onTap: () => onPick(2),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AnswerTile(
                              index: 3,
                              selected: picked == 3,
                              enabled: !locked,
                              onTap: () => onPick(3),
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
  });

  final RoomState room;
  final String playerId;
  final PlayerProfile profile;
  final bool optedIn;
  final bool optingIn;
  final VoidCallback onPlayAgain;
  final VoidCallback onHome;

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
              Text(
                'Final leaderboard',
                style: GoogleFonts.nunito(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (room.lastWinners.length == 1) ...[
                const SizedBox(height: 8),
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
                const SizedBox(height: 8),
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
