import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_models.dart';
import '../core/room_repository.dart';
import '../core/sfx.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import '../widgets/avatar_widgets.dart';
import '../widgets/quivro_snackbar.dart';
import '../widgets/wordmark.dart';

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
  int? _checked;
  bool _selfLocked = false;
  int? _lockSoundedFor;
  int _trackedQuestion = -1;
  int? _pendingSlot;
  ({int slot, int source, String roundId})? _doublePending;
  bool _doubleRequestWritten = false;
  int? _armedSlot;
  int? _probeSoundedAt;
  bool _powerUpArmed = false;
  RoomState? _latestRoom;
  RoomState? _powerUpBaseline;
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
      _handleRoomEnded(message: context.strings.roomEnded);
    }
  }

  /// Forced exit (room closed, kicked, connection lost) — keep Firebase player
  /// so accidental kills can still resume when applicable.
  Future<void> _leaveToHome({bool showClosed = false, String? message}) async {
    await _repo.clearActiveSession();
    if (!mounted) return;
    if (showClosed) {
      showQuivroSnack(context, context.strings.roomClosed);
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
    final strings = context.strings;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final palette = ctx.palette;
        return Dialog(
          backgroundColor: Colors.transparent,
          elevation: 0,
          clipBehavior: Clip.none,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 28,
            vertical: 24,
          ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
            decoration: showPanel(
              ink: showInk(ctx),
              fill: palette.card,
              radius: 18,
              shadow: const Offset(6, 6),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  strings.leaveGameTitle,
                  textAlign: TextAlign.center,
                  style: showTitle(ctx, fontSize: 26),
                ),
                const SizedBox(height: 8),
                Text(
                  strings.leaveGameBody,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w700,
                    color: palette.muted,
                  ),
                ),
                const SizedBox(height: 20),
                _ShowKey(
                  label: strings.leave,
                  fill: showBulb,
                  foreground: showInkDay,
                  onPressed: () => Navigator.of(ctx).pop(true),
                ),
                const SizedBox(height: 10),
                _ShowKey(
                  label: strings.cancel,
                  fill: palette.card,
                  foreground: palette.text,
                  onPressed: () => Navigator.of(ctx).pop(false),
                ),
              ],
            ),
          ),
        );
      },
    );
    if (confirmed == true && mounted) {
      await _leaveRoomManually();
    }
  }

  void _openSetup() {
    context.go(
      '/setup',
      extra: {
        'existing': _profile,
        'returnTo': '/room/${widget.code}',
        'returnPlayerId': widget.playerId,
      },
    );
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
    _handleRoomEnded(message: context.strings.roomEnded);
  }

  void _handleConnectionError() {
    if (_exitingClosedRoom) return;
    _exitingClosedRoom = true;
    final message = context.strings.connectionLost;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_leaveToHome(message: message));
    });
  }

  Future<void> _answer(RoomState room, int choice) async {
    if (room.phase != 'question' || _submitting) return;
    if (_selfLocked || room.lockFor(widget.playerId) != null) return;
    if (room.eliminatedChoices(widget.playerId).contains(choice)) return;
    if (!AnswerSubmissionPolicy.canSubmit(
      room: room,
      playerId: widget.playerId,
      questionIndex: room.currentIndex,
      choice: choice,
      nowMs: _repo.nowMs(),
    )) {
      return;
    }

    final armed = _armedSlot;
    final currentChoice = _picked ?? _checked ?? room.choiceOf(widget.playerId);
    final lockSame =
        armed == null && room.sameTileLocksProbe(widget.playerId, choice);
    if (armed == null && currentChoice == choice && !lockSame) return;

    if (armed != null) {
      setState(() {
        _checked = choice;
        _picked = null;
        _armedSlot = null;
        _pendingSlot = armed;
        _powerUpArmed = false;
        _powerUpBaseline = null;
        _submitting = true;
      });
      try {
        if (room.hasAnswered(widget.playerId)) {
          await _repo.clearAnswer(
            code: widget.code,
            questionIndex: room.currentIndex,
            playerId: widget.playerId,
          );
        }
        await _repo.requestPowerUp(
          code: widget.code,
          playerId: widget.playerId,
          slot: armed,
          questionIndex: room.currentIndex,
          choice: choice,
        );
        if (!mounted) return;
        setState(() {
          _powerUpArmed = true;
          _powerUpBaseline = _latestRoom;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _pendingSlot = null;
          _checked = null;
          _picked = null;
          _powerUpArmed = false;
          _powerUpBaseline = null;
        });
        showQuivroSnack(
          context,
          context.strings.couldNotUsePowerUp,
          kind: QuivroSnackKind.error,
        );
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
      return;
    }

    setState(() {
      _picked = choice;
      _checked = null;
      _submitting = true;
    });
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
        showQuivroSnack(
          context,
          context.strings.couldNotSendAnswer,
          kind: QuivroSnackKind.error,
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _usePowerUp(RoomState room, int slot) async {
    if (_pendingSlot != null || _armedSlot != null) return;
    if (_selfLocked || room.lockFor(widget.playerId) != null) return;
    final now = _repo.nowMs();
    if (!PowerUpRequestPolicy.canRequest(
      room: room,
      playerId: widget.playerId,
      slot: slot,
      questionIndex: room.currentIndex,
      nowMs: now,
    )) {
      return;
    }

    if (room.powerUpSlots[slot] == powerUpSecondChance) {
      setState(() => _armedSlot = slot);
      unawaited(_sfx.playSecondChance());
      return;
    }

    final locking = room.powerUpSlots[slot] == powerUpLockUp;
    final doubling = room.powerUpSlots[slot] == powerUpDoubleIt;
    final lockedChoice = locking ? room.choiceOf(widget.playerId) : null;
    if (locking && lockedChoice == null) return;

    setState(() {
      _pendingSlot = slot;
      _powerUpArmed = false;
      _powerUpBaseline = null;
      if (locking) _selfLocked = true;
      if (doubling) {
        _doublePending = (
          slot: slot,
          source: room.currentIndex,
          roundId: room.roundId!,
        );
        _doubleRequestWritten = false;
      }
    });
    unawaited(
      doubling
          ? _sfx.playDoubleIt()
          : locking
          ? _sfx.playLockUp()
          : _sfx.playFiftyFifty(),
    );
    try {
      await _repo.requestPowerUp(
        code: widget.code,
        playerId: widget.playerId,
        slot: slot,
        questionIndex: room.currentIndex,
        choice: lockedChoice,
      );
      if (!mounted) return;
      if (doubling) {
        _doubleRequestWritten = true;
        // Acceptance may precede the write acknowledgment; reconcile fresh state.
        final fresh = await _repo.fetchRoom(widget.code);
        if (mounted && fresh != null) _syncDoubleIt(fresh);
        return;
      }
      setState(() {
        _powerUpArmed = true;
        _powerUpBaseline = _latestRoom;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (doubling) _doublePending = null;
        _pendingSlot = null;
        _selfLocked = false;
        _powerUpArmed = false;
        _powerUpBaseline = null;
      });
      showQuivroSnack(
        context,
        context.strings.couldNotUsePowerUp,
        kind: QuivroSnackKind.error,
      );
    }
  }

  void _syncDoubleIt(RoomState room) {
    final pending = _doublePending;
    if (pending == null) return;
    final accepted =
        room.roundId == pending.roundId &&
        room.powerUps[widget.playerId]?.used[pending.slot] == pending.source;
    final closed =
        room.roundId != pending.roundId ||
        room.currentIndex != pending.source ||
        room.phase != 'question';
    final rejected =
        closed ||
        (_doubleRequestWritten &&
            room.powerUpRequests[widget.playerId] == null);
    if (!accepted && !rejected) return;
    _doublePending = null;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() {
        if (_pendingSlot == pending.slot) _pendingSlot = null;
      });
      if (!accepted) {
        showQuivroSnack(
          context,
          context.strings.couldNotUsePowerUp,
          kind: QuivroSnackKind.error,
        );
      }
    });
  }

  void _syncPowerUp(RoomState room) {
    _latestRoom = room;
    final pending = _pendingSlot;
    if (pending == null || !_powerUpArmed) return;
    if (identical(room, _powerUpBaseline)) return;

    final req = room.powerUpRequests[widget.playerId];
    final waiting =
        req != null &&
        req.slot == pending &&
        req.questionIndex == room.currentIndex;
    if (waiting && !room.powerUpSlotUsed(widget.playerId, pending)) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _pendingSlot != pending) return;
      setState(() {
        _pendingSlot = null;
        _powerUpArmed = false;
        _powerUpBaseline = null;
      });
    });
  }

  void _syncProbe(RoomState room) {
    final probe = room.probeFor(widget.playerId);
    if (probe == null || _probeSoundedAt == room.currentIndex) return;
    _probeSoundedAt = room.currentIndex;
    final correct = probe.correct;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(correct ? _sfx.playSecondCorrect() : _sfx.playSecondWrong());
    });
  }

  void _syncLockSound(RoomState room) {
    if (room.lockFor(widget.playerId) == null) return;
    if (_lockSoundedFor == room.currentIndex) return;
    _lockSoundedFor = room.currentIndex;
    if (_selfLocked) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(_sfx.playLockedOut());
    });
  }

  Future<void> _optInRematch() async {
    if (_optingIn) return;
    setState(() => _optingIn = true);
    try {
      await _repo.setRematchReady(code: widget.code, playerId: widget.playerId);
    } catch (_) {
      if (mounted) {
        showQuivroSnack(
          context,
          context.strings.couldNotJoinRematch,
          kind: QuivroSnackKind.error,
        );
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
        final strings = context.strings;
        if (snap.hasError) {
          _handleConnectionError();
          return Scaffold(
            body: Center(child: Text(strings.connectionError(snap.error!))),
          );
        }
        final room = snap.data;
        if (room == null) {
          final waiting =
              snap.connectionState == ConnectionState.waiting && !_sawRoom;
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
                  Text(waiting ? strings.connecting : strings.roomClosed),
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
            _handleRoomEnded(message: strings.roundStartedWithoutYou);
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
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(strings.roomEnded),
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
              _checked = null;
              _selfLocked = false;
              _lockSoundedFor = null;
              _pendingSlot = null;
              _armedSlot = null;
              _probeSoundedAt = null;
              _powerUpArmed = false;
              _powerUpBaseline = null;
            });
          });
        }

        final hidden = room.eliminatedChoices(widget.playerId);
        if (_picked != null && hidden.contains(_picked)) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            setState(() => _picked = null);
          });
        }
        _syncDoubleIt(room);
        _syncPowerUp(room);
        _syncProbe(room);
        _syncLockSound(room);

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

        final stored = room.choiceOf(widget.playerId);
        final pickedRaw = _checked != null ? _picked : (_picked ?? stored);
        final picked = pickedRaw != null && hidden.contains(pickedRaw)
            ? null
            : pickedRaw;

        return _PlayView(
          room: room,
          playerId: widget.playerId,
          profile: _profile,
          picked: picked,
          pendingSlot: _pendingSlot,
          armedSlot: _armedSlot,
          selfLocked: _selfLocked,
          onPick: (i) => _answer(room, i),
          onUsePowerUp: (slot) => unawaited(_usePowerUp(room, slot)),
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
    final strings = context.strings;
    final palette = context.palette;
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
                        QuivroWordmarkHero(
                          child: Text(
                            'Quivro',
                            style: showTitle(context, fontSize: 36),
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
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: showInk(context), width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: showInk(context),
                            offset: const Offset(3, 3),
                          ),
                        ],
                      ),
                      child: AvatarBadge(index: profile.avatar, size: 52),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                strings.playingAs(profile.nickname),
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: palette.muted,
                ),
              ),
              const Spacer(),
              Text(
                strings.room.toUpperCase(),
                textAlign: TextAlign.center,
                style: showDisplay(context, fontSize: 22),
              ),
              const SizedBox(height: 10),
              _RoomCodeDigits(code: code),
              const SizedBox(height: 16),
              Text(
                strings.waitingForHost,
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: palette.muted,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onLeave,
                child: Text(
                  strings.leave.toUpperCase(),
                  style: showDisplay(
                    context,
                    fontSize: 18,
                    letterSpacing: 1,
                    color: palette.muted,
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

/// Scoreboard tiles for the join code, matching the web lobby digits.
class _RoomCodeDigits extends StatelessWidget {
  const _RoomCodeDigits({required this.code});

  final String code;

  static const _lcd = Color(0xFF0D1022);

  @override
  Widget build(BuildContext context) {
    final chars = code.split('');
    final ink = showInk(context);
    return Semantics(
      label: code,
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              for (var i = 0; i < chars.length; i++)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Transform.rotate(
                      angle: (i.isEven ? -1.5 : 1.5) * math.pi / 180,
                      child: AspectRatio(
                        aspectRatio: 0.76,
                        child: Container(
                          clipBehavior: Clip.antiAlias,
                          decoration: showPanel(
                            ink: ink,
                            fill: _lcd,
                            radius: 12,
                            shadow: const Offset(0, 5),
                          ),
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final fontSize = (constraints.maxWidth * 0.62)
                                  .clamp(22.0, 40.0);
                              return Stack(
                                alignment: Alignment.center,
                                children: [
                                  const Positioned(
                                    left: 5,
                                    right: 5,
                                    child: SizedBox(
                                      height: 2,
                                      child: ColoredBox(
                                        color: Color(0x59000000),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    chars[i],
                                    style: showDisplay(
                                      context,
                                      fontSize: fontSize,
                                      letterSpacing: 0,
                                      color: showBulb,
                                      shadows: [
                                        Shadow(
                                          color: showBulb.withValues(
                                            alpha: 0.6,
                                          ),
                                          blurRadius: 14,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
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
    );
  }
}

class _PlayView extends StatefulWidget {
  const _PlayView({
    required this.room,
    required this.playerId,
    required this.profile,
    required this.picked,
    required this.pendingSlot,
    required this.armedSlot,
    required this.selfLocked,
    required this.onPick,
    required this.onUsePowerUp,
    required this.nowMs,
    required this.onQuit,
  });

  final RoomState room;
  final String playerId;
  final PlayerProfile profile;
  final int? picked;
  final int? pendingSlot;
  final int? armedSlot;
  final bool selfLocked;
  final ValueChanged<int> onPick;
  final ValueChanged<int> onUsePowerUp;
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
    final strings = context.strings;
    final palette = context.palette;
    final room = widget.room;
    final q = room.currentQuestion!;
    final isReveal = room.phase == 'reveal';
    final now = widget.nowMs();
    final waitingForTv = room.phase == 'question' && now < q.answerOpensAt;
    final locked = room.phase != 'question' || waitingForTv || now > q.endsAt;
    final frozen = widget.selfLocked || room.lockFor(widget.playerId) != null;
    final padLocked = locked || frozen;
    final hidden = room.eliminatedChoices(widget.playerId);
    final probe = room.probeFor(widget.playerId);
    final showPowerUps = room.hasPowerUps;
    bool? verdictFor(int index) =>
        probe != null && probe.choice == index ? probe.correct : null;

    final ink = showInk(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: ink, width: 3),
                      boxShadow: [
                        BoxShadow(color: ink, offset: const Offset(3, 3)),
                      ],
                    ),
                    child: AvatarBadge(index: widget.profile.avatar, size: 40),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          strings.questionCounter(q.index + 1, q.total),
                          style: showDisplay(context, fontSize: 20),
                        ),
                        Text(
                          '${q.category} · ${q.difficulty}',
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.w700,
                            color: palette.muted,
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
                      strings.quit.toUpperCase(),
                      style: showDisplay(
                        context,
                        fontSize: 16,
                        color: palette.muted,
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
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: showBulb,
                        border: Border.all(color: ink, width: 3),
                        boxShadow: [
                          BoxShadow(color: ink, offset: const Offset(3, 3)),
                        ],
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          waitingForTv
                              ? strings.tvBadge
                              : (isReveal ? strings.lockedBadge : room.phase),
                          textAlign: TextAlign.center,
                          style: showDisplay(
                            context,
                            fontSize: 14,
                            letterSpacing: 0.4,
                            color: showInkDay,
                          ),
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
                    ? strings.lookAtTv
                    : frozen
                    ? (widget.picked != null
                          ? strings.lockedGuess
                          : strings.lockedOut)
                    : room.phase == 'question'
                    ? (widget.armedSlot != null
                          ? strings.tapToCheck
                          : room.sameTileLocksProbe(
                              widget.playerId,
                              room.probeFor(widget.playerId)?.choice ?? -1,
                            )
                          ? strings.tapToLock
                          : strings.tapToChange)
                    : strings.answersLocked,
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w800,
                  color: palette.muted,
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                child: Column(
                  children: [
                    Expanded(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Column(
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: _AnswerTile(
                                        index: 0,
                                        selected: widget.picked == 0,
                                        eliminated: hidden.contains(0),
                                        probeCorrect: verdictFor(0),
                                        showLock:
                                            widget.selfLocked &&
                                            widget.picked == 0,
                                        enabled:
                                            !padLocked && !hidden.contains(0),
                                        onTap: () => widget.onPick(0),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: _AnswerTile(
                                        index: 1,
                                        selected: widget.picked == 1,
                                        eliminated: hidden.contains(1),
                                        probeCorrect: verdictFor(1),
                                        showLock:
                                            widget.selfLocked &&
                                            widget.picked == 1,
                                        enabled:
                                            !padLocked && !hidden.contains(1),
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
                                        eliminated: hidden.contains(2),
                                        probeCorrect: verdictFor(2),
                                        showLock:
                                            widget.selfLocked &&
                                            widget.picked == 2,
                                        enabled:
                                            !padLocked && !hidden.contains(2),
                                        onTap: () => widget.onPick(2),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: _AnswerTile(
                                        index: 3,
                                        selected: widget.picked == 3,
                                        eliminated: hidden.contains(3),
                                        probeCorrect: verdictFor(3),
                                        showLock:
                                            widget.selfLocked &&
                                            widget.picked == 3,
                                        enabled:
                                            !padLocked && !hidden.contains(3),
                                        onTap: () => widget.onPick(3),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (frozen && !widget.selfLocked)
                            const IgnorePointer(child: _CenterLock()),
                        ],
                      ),
                    ),
                    if (showPowerUps) ...[
                      const SizedBox(height: 10),
                      _PowerUpBar(
                        room: room,
                        playerId: widget.playerId,
                        locked:
                            padLocked ||
                            widget.pendingSlot != null ||
                            widget.armedSlot != null,
                        pendingSlot: widget.pendingSlot ?? widget.armedSlot,
                        hasGuess: widget.picked != null,
                        onUse: widget.onUsePowerUp,
                      ),
                    ],
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

class _CenterLock extends StatelessWidget {
  const _CenterLock();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: showBulb,
        shape: BoxShape.circle,
        border: Border.all(color: showInkDay, width: 3),
        boxShadow: const [BoxShadow(color: showInkDay, offset: Offset(3, 3))],
      ),
      child: const Icon(Icons.lock_rounded, size: 40, color: showInkDay),
    );
  }
}

class _AnswerTile extends StatefulWidget {
  const _AnswerTile({
    required this.index,
    required this.selected,
    required this.eliminated,
    required this.probeCorrect,
    required this.showLock,
    required this.enabled,
    required this.onTap,
  });

  final int index;
  final bool selected;
  final bool eliminated;
  final bool? probeCorrect;
  final bool showLock;
  final bool enabled;
  final VoidCallback onTap;

  @override
  State<_AnswerTile> createState() => _AnswerTileState();
}

class _AnswerTileState extends State<_AnswerTile> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (widget.eliminated || !widget.enabled || _pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final base = answerColors[widget.index];
    final fill = widget.eliminated
        ? const Color(0xFFB6B8C4)
        : widget.selected
        ? Color.lerp(base, Colors.white, 0.08)!
        : base;
    final dimmed = !widget.eliminated && !widget.enabled && !widget.selected;
    final tappable = widget.enabled && !widget.eliminated;

    final ink = showInk(context);
    final picked = widget.selected && !widget.eliminated;
    final verdict = widget.probeCorrect;
    final borderColor = verdict == null
        ? (picked ? showBulb : ink)
        : (verdict ? const Color(0xFF1FA85A) : const Color(0xFFD64545));
    return SizedBox.expand(
      child: GestureDetector(
        onTapDown: tappable ? (_) => _setPressed(true) : null,
        onTapUp: tappable
            ? (_) {
                _setPressed(false);
                widget.onTap();
              }
            : null,
        onTapCancel: tappable ? () => _setPressed(false) : null,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 180),
          opacity: dimmed ? 0.55 : 1,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 80),
            transform: Matrix4.translationValues(
              _pressed ? 4 : 0,
              _pressed ? 4 : 0,
              0,
            ),
            decoration: BoxDecoration(
              color: fill,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(width: 3, color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: ink,
                  offset: _pressed ? const Offset(1, 1) : const Offset(5, 5),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(17),
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
                        color: showBulb,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: showInkDay, width: 2),
                      ),
                      child: Text(
                        answerLabels[widget.index],
                        style: showDisplay(
                          context,
                          fontSize: 18,
                          letterSpacing: 0,
                          color: showInkDay,
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: widget.eliminated
                        ? const Icon(
                            Icons.close_rounded,
                            size: 72,
                            color: Colors.white,
                          )
                        : Text(
                            answerLabels[widget.index],
                            style: showDisplay(
                              context,
                              fontSize: 64,
                              letterSpacing: 0,
                              color: showInkDay,
                            ),
                          ),
                  ),
                  if (verdict != null)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: verdict
                              ? const Color(0xFF1FA85A)
                              : const Color(0xFFD64545),
                          shape: BoxShape.circle,
                          border: Border.all(color: showInkDay, width: 2),
                        ),
                        child: Icon(
                          verdict ? Icons.check_rounded : Icons.close_rounded,
                          size: 22,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  if (widget.showLock)
                    Positioned(
                      top: verdict == null ? 12 : 56,
                      right: 12,
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: showBulb,
                          shape: BoxShape.circle,
                          border: Border.all(color: showInkDay, width: 2),
                          boxShadow: const [
                            BoxShadow(color: showInkDay, offset: Offset(2, 2)),
                          ],
                        ),
                        child: const Icon(
                          Icons.lock_rounded,
                          size: 20,
                          color: showInkDay,
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
                          decoration: BoxDecoration(
                            color: showBulb,
                            shape: BoxShape.circle,
                            border: Border.all(color: showInkDay, width: 2),
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            size: 18,
                            color: showInkDay,
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
    );
  }
}

class _PowerUpBar extends StatelessWidget {
  const _PowerUpBar({
    required this.room,
    required this.playerId,
    required this.locked,
    required this.pendingSlot,
    required this.hasGuess,
    required this.onUse,
  });

  final RoomState room;
  final String playerId;
  final bool locked;
  final int? pendingSlot;
  final bool hasGuess;
  final ValueChanged<int> onUse;

  @override
  Widget build(BuildContext context) {
    final usedOnQuestion =
        room.powerUps[playerId]?.used.values.contains(room.currentIndex) ??
        false;
    return SizedBox(
      height: 84,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < room.powerUpSlots.length; i++) ...[
            if (i > 0) const SizedBox(width: 16),
            _PowerSlot(
              powerUpId: room.powerUpSlots[i],
              used: room.powerUpSlotUsed(playerId, i),
              pending: pendingSlot == i,
              enabled:
                  !locked &&
                  pendingSlot == null &&
                  !usedOnQuestion &&
                  (room.powerUpSlots[i] == powerUpFiftyFifty ||
                      (room.powerUpSlots[i] == powerUpDoubleIt &&
                          room.roundId != null &&
                          room.currentIndex + 1 < room.totalQuestions) ||
                      room.powerUpSlots[i] == powerUpSecondChance ||
                      (room.powerUpSlots[i] == powerUpLockUp &&
                          (room.hasAnswered(playerId) || hasGuess))) &&
                  !room.powerUpSlotUsed(playerId, i),
              onTap: () => onUse(i),
            ),
          ],
        ],
      ),
    );
  }
}

class _PowerSlot extends StatefulWidget {
  const _PowerSlot({
    required this.powerUpId,
    required this.used,
    required this.pending,
    required this.enabled,
    required this.onTap,
  });

  final String? powerUpId;
  final bool used;
  final bool pending;
  final bool enabled;
  final VoidCallback onTap;

  @override
  State<_PowerSlot> createState() => _PowerSlotState();
}

class _PowerSlotState extends State<_PowerSlot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    if (widget.pending) _pulse.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _PowerSlot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pending && !_pulse.isAnimating) {
      _pulse.repeat(reverse: true);
    } else if (!widget.pending && _pulse.isAnimating) {
      _pulse
        ..stop()
        ..value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final empty = widget.powerUpId == null;
    if (empty) {
      return SizedBox(
        width: 68,
        height: 68,
        child: CustomPaint(painter: _DashedCirclePainter(showInk(context))),
      );
    }

    return Semantics(
      button: widget.enabled,
      label: widget.powerUpId == powerUpDoubleIt
          ? context.strings.doubleIt
          : widget.powerUpId == powerUpSecondChance
          ? context.strings.secondChance
          : widget.powerUpId == powerUpLockUp
          ? context.strings.lockUp
          : context.strings.fiftyFifty,
      child: GestureDetector(
        onTap: widget.enabled ? widget.onTap : null,
        child: Opacity(
          opacity: widget.enabled || widget.used || widget.pending ? 1 : 0.45,
          child: _filledSlot(),
        ),
      ),
    );
  }

  Widget _filledSlot() {
    final image = Image.asset(
      widget.powerUpId == powerUpDoubleIt
          ? 'assets/powerups/double_it.png'
          : widget.powerUpId == powerUpSecondChance
          ? 'assets/powerups/second_chance.png'
          : widget.powerUpId == powerUpLockUp
          ? 'assets/powerups/lock_up.png'
          : 'assets/powerups/fifty_fifty.png',
      width: 68,
      height: 68,
      fit: BoxFit.cover,
    );
    final shown = widget.used
        ? ColorFiltered(
            colorFilter: const ColorFilter.matrix(<double>[
              0.2126,
              0.7152,
              0.0722,
              0,
              0,
              0.2126,
              0.7152,
              0.0722,
              0,
              0,
              0.2126,
              0.7152,
              0.0722,
              0,
              0,
              0,
              0,
              0,
              0.55,
              0,
            ]),
            child: image,
          )
        : image;

    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        final scale = widget.pending ? 1 + (_pulse.value * 0.06) : 1.0;
        return Transform.scale(scale: scale, child: child);
      },
      child: SizedBox(
        width: 68,
        height: 68,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: showInk(context), width: 3),
                boxShadow: [
                  BoxShadow(
                    color: showInk(context),
                    offset: const Offset(3, 3),
                  ),
                ],
              ),
              child: ClipOval(child: shown),
            ),
            if (widget.used)
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: showBulb,
                  shape: BoxShape.circle,
                  border: Border.all(color: showInkDay, width: 2),
                ),
                child: const Icon(
                  Icons.close_rounded,
                  size: 16,
                  color: showInkDay,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DashedCirclePainter extends CustomPainter {
  const _DashedCirclePainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..addOval(Rect.fromLTWH(2, 2, size.width - 4, size.height - 4));
    const dash = 5.0;
    const gap = 4.0;
    for (final metric in path.computeMetrics()) {
      var dist = 0.0;
      while (dist < metric.length) {
        final end = (dist + dash).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(dist, end), paint);
        dist += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedCirclePainter oldDelegate) =>
      oldDelegate.color != color;
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
    final ink = showInk(context);
    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF0D1022),
        border: Border.all(color: urgent ? showBulb : ink, width: 3),
        boxShadow: [BoxShadow(color: ink, offset: const Offset(3, 3))],
      ),
      child: Text(
        '$_left',
        style: showDisplay(
          context,
          fontSize: 22,
          letterSpacing: 0,
          color: showBulb,
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
    final strings = context.strings;
    final palette = context.palette;
    final ranked = room.ranked();
    final solo = ranked.length == 1 ? ranked.first : null;
    final showPodium = ranked.length >= 2;
    final listStart = showPodium ? 3 : ranked.length;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      strings.finalLeaderboard,
                      maxLines: 2,
                      style: showTitle(context, fontSize: 26),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: onEditProfile,
                    child: _InkRingAvatar(index: profile.avatar, size: 44),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(2, 4, 6, 8),
                  children: [
                    if (room.lastWinners.isNotEmpty || solo != null) ...[
                      _WinnerSpotlight(
                        winners: room.lastWinners,
                        solo: solo,
                        winnerLabel: strings.winnerPrefix.trim(),
                        tieLabel: strings.tiedWinners,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (showPodium) ...[
                      _Podium(
                        players: ranked.take(3).toList(),
                        selfId: playerId,
                        winsLabel: strings.winsShort,
                        youLabel: strings.youBadge,
                      ),
                      const SizedBox(height: 12),
                    ],
                    for (var i = listStart; i < ranked.length; i++) ...[
                      if (i > listStart) const SizedBox(height: 10),
                      _RankRow(
                        place: i + 1,
                        player: ranked[i],
                        isSelf: ranked[i].id == playerId,
                        winsLabel: strings.winsShort(ranked[i].wins),
                        youLabel: strings.youBadge,
                      ),
                    ],
                  ],
                ),
              ),
              if (optedIn) ...[
                const SizedBox(height: 8),
                Text(
                  strings.rematchOptedIn,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w800,
                    color: palette.muted,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              _ShowKey(
                label: optedIn
                    ? strings.ready
                    : optingIn
                    ? strings.joiningRematch
                    : strings.playAgain,
                icon: optedIn ? Icons.check_rounded : null,
                enabled: !optedIn && !optingIn,
                fill: showBulb,
                foreground: showInkDay,
                onPressed: onPlayAgain,
              ),
              const SizedBox(height: 10),
              _ShowKey(
                label: strings.home,
                fill: palette.card,
                foreground: palette.text,
                onPressed: onHome,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WinnerSpotlight extends StatelessWidget {
  const _WinnerSpotlight({
    required this.winners,
    required this.solo,
    required this.winnerLabel,
    required this.tieLabel,
  });

  final List<LastWinner> winners;
  final RoomPlayer? solo;
  final String winnerLabel;
  final String tieLabel;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final people = winners.isNotEmpty
        ? winners
        : [
            if (solo != null)
              LastWinner(
                playerId: solo!.id,
                name: solo!.name,
                avatar: solo!.avatar,
              ),
          ];
    final single = people.length == 1;
    final score = solo?.score;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      decoration: showPanel(
        ink: showInk(context),
        fill: palette.card,
        radius: 18,
        shadow: const Offset(6, 6),
      ),
      child: single
          ? Column(
              children: [
                if (winners.length == 1) ...[
                  Transform.rotate(
                    angle: -8 * math.pi / 180,
                    child: const _CrownMark(width: 52),
                  ),
                  const SizedBox(height: 4),
                ],
                _InkRingAvatar(index: people.first.avatar, size: 72),
                if (winners.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    winnerLabel,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.nunito(
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                      letterSpacing: 1.2,
                      color: palette.muted,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  people.first.name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: showTitle(context, fontSize: 32),
                ),
                if (score != null) ...[
                  const SizedBox(height: 8),
                  _ScoreLcd(score: score, fontSize: 22),
                ],
              ],
            )
          : Column(
              children: [
                Text(
                  tieLabel,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.2,
                    color: palette.muted,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 16,
                  runSpacing: 12,
                  children: [
                    for (final person in people)
                      SizedBox(
                        width: 120,
                        child: Column(
                          children: [
                            _InkRingAvatar(index: person.avatar, size: 48),
                            const SizedBox(height: 4),
                            Text(
                              person.name,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: showTitle(context, fontSize: 18),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                if (score != null) ...[
                  const SizedBox(height: 10),
                  _ScoreLcd(score: score, fontSize: 22),
                ],
              ],
            ),
    );
  }
}

class _Podium extends StatelessWidget {
  const _Podium({
    required this.players,
    required this.selfId,
    required this.winsLabel,
    required this.youLabel,
  });

  final List<RoomPlayer> players;
  final String selfId;
  final String Function(int wins) winsLabel;
  final String youLabel;

  @override
  Widget build(BuildContext context) {
    final slots = _podiumSlots(players);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (final slot in slots)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: _PodiumSpot(
                key: ValueKey(slot.player.id),
                place: slot.place,
                player: slot.player,
                isSelf: slot.player.id == selfId,
                winsLabel: winsLabel(slot.player.wins),
                youLabel: youLabel,
              ),
            ),
          ),
      ],
    );
  }

  static List<({int place, RoomPlayer player})> _podiumSlots(
    List<RoomPlayer> top,
  ) {
    if (top.length <= 1) {
      return [for (final player in top) (place: 1, player: player)];
    }
    if (top.length == 2) {
      return [(place: 1, player: top[0]), (place: 2, player: top[1])];
    }
    return [
      (place: 2, player: top[1]),
      (place: 1, player: top[0]),
      (place: 3, player: top[2]),
    ];
  }
}

class _PodiumSpot extends StatefulWidget {
  const _PodiumSpot({
    super.key,
    required this.place,
    required this.player,
    required this.isSelf,
    required this.winsLabel,
    required this.youLabel,
  });

  final int place;
  final RoomPlayer player;
  final bool isSelf;
  final String winsLabel;
  final String youLabel;

  @override
  State<_PodiumSpot> createState() => _PodiumSpotState();
}

class _PodiumSpotState extends State<_PodiumSpot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _rise;
  bool _queued = false;

  @override
  void initState() {
    super.initState();
    _rise = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_queued) return;
    _queued = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _rise.value = 1;
      return;
    }
    final delay = switch (widget.place) {
      2 => const Duration(milliseconds: 80),
      3 => const Duration(milliseconds: 160),
      _ => Duration.zero,
    };
    Future<void>.delayed(delay, () {
      if (mounted) _rise.forward();
    });
  }

  @override
  void dispose() {
    _rise.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final place = widget.place;
    final player = widget.player;
    final tone = _podiumTone(place);
    final height = switch (place) {
      1 => 112.0,
      2 => 96.0,
      _ => 80.0,
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (place == 1) ...[
          const _CrownMark(width: 30),
          const SizedBox(height: 2),
        ],
        _MarkedAvatar(
          index: player.avatar,
          size: place == 1 ? 48 : 40,
          youLabel: widget.isSelf ? widget.youLabel : null,
        ),
        const SizedBox(height: 4),
        Text(
          player.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: showDisplay(
            context,
            fontSize: place == 1 ? 16 : 14,
            color: palette.text,
          ),
        ),
        if (player.wins > 0) ...[
          const SizedBox(height: 4),
          _WinsSticker(label: widget.winsLabel),
        ],
        const SizedBox(height: 6),
        AnimatedBuilder(
          animation: _rise,
          builder: (context, child) {
            final curved = Curves.easeOutBack.transform(_rise.value);
            final scaleY = 0.2 + (0.8 * curved);
            return Transform(
              alignment: Alignment.bottomCenter,
              transform: Matrix4.diagonal3Values(1, scaleY, 1),
              child: Opacity(opacity: _rise.value, child: child),
            );
          },
          child: Container(
            key: widget.isSelf ? const Key('podium-self') : null,
            height: height,
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(4, 8, 4, 6),
            decoration: showPanel(
              ink: showInk(context),
              fill: tone,
              radius: 12,
              shadow: const Offset(3, 3),
            ),
            child: Column(
              children: [
                _ScoreLcd(score: player.score, fontSize: place == 1 ? 18 : 16),
                const Spacer(),
                Text(
                  '$place',
                  style: showDisplay(
                    context,
                    fontSize: place == 1 ? 32 : 26,
                    letterSpacing: 0,
                    color: showInkDay,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  static Color _podiumTone(int place) => switch (place) {
    1 => showBulb,
    2 => const Color(0xFFCFD6E4),
    _ => const Color(0xFFE0A066),
  };
}

class _RankRow extends StatelessWidget {
  const _RankRow({
    required this.place,
    required this.player,
    required this.isSelf,
    required this.winsLabel,
    required this.youLabel,
  });

  final int place;
  final RoomPlayer player;
  final bool isSelf;
  final String winsLabel;
  final String youLabel;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final ink = showInk(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: showPanel(
        ink: ink,
        fill: palette.card,
        radius: 12,
        shadow: const Offset(0, 3),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: palette.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: ink, width: 2),
            ),
            child: Text(
              '$place',
              style: showDisplay(
                context,
                fontSize: 16,
                letterSpacing: 0,
                color: palette.text,
              ),
            ),
          ),
          const SizedBox(width: 10),
          _MarkedAvatar(
            index: player.avatar,
            size: 36,
            youLabel: isSelf ? youLabel : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  player.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: showDisplay(context, fontSize: 18),
                ),
                if (player.wins > 0) ...[
                  const SizedBox(height: 4),
                  _WinsSticker(label: winsLabel),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          _ScoreLcd(score: player.score),
        ],
      ),
    );
  }
}

class _WinsSticker extends StatelessWidget {
  const _WinsSticker({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: showBulb,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: showInkDay, width: 2),
      ),
      child: Text(
        label,
        style: showDisplay(
          context,
          fontSize: 11,
          letterSpacing: 0,
          color: showInkDay,
        ),
      ),
    );
  }
}

class _ScoreLcd extends StatelessWidget {
  const _ScoreLcd({required this.score, this.fontSize = 18});

  final int score;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 36),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF0D1022),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: showInk(context), width: 2),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SizedBox(
              height: 3,
              child: ColoredBox(color: Color(0x80000000)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 5, 8, 3),
            child: Text(
              '$score',
              textAlign: TextAlign.center,
              style: showDisplay(
                context,
                fontSize: fontSize,
                letterSpacing: 0,
                color: showBulb,
                shadows: [
                  Shadow(
                    color: showBulb.withValues(alpha: 0.55),
                    blurRadius: 10,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MarkedAvatar extends StatelessWidget {
  const _MarkedAvatar({
    required this.index,
    required this.size,
    required this.youLabel,
  });

  final int index;
  final double size;
  final String? youLabel;

  @override
  Widget build(BuildContext context) {
    final avatar = _InkRingAvatar(index: index, size: size);
    final label = youLabel;
    if (label == null) return avatar;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        avatar,
        Positioned(right: -2, bottom: -2, child: _YouBadge(label: label)),
      ],
    );
  }
}

class _YouBadge extends StatelessWidget {
  const _YouBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 0),
      decoration: BoxDecoration(
        color: QuivroColors.blue,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: showInk(context), width: 2),
      ),
      child: Text(
        label,
        style: showDisplay(
          context,
          fontSize: 10,
          letterSpacing: 0,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _InkRingAvatar extends StatelessWidget {
  const _InkRingAvatar({required this.index, required this.size});

  final int index;
  final double size;

  @override
  Widget build(BuildContext context) {
    final ink = showInk(context);
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: ink, width: 3),
        boxShadow: [BoxShadow(color: ink, offset: const Offset(3, 3))],
      ),
      child: AvatarBadge(index: index, size: size),
    );
  }
}

class _CrownMark extends StatelessWidget {
  const _CrownMark({required this.width});

  final double width;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(width, width * 22 / 32),
      painter: _CrownPainter(fill: showBulb, stroke: showInk(context)),
    );
  }
}

class _CrownPainter extends CustomPainter {
  const _CrownPainter({required this.fill, required this.stroke});

  final Color fill;
  final Color stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(3, 19)
      ..lineTo(1.5, 5)
      ..lineTo(9.5, 11)
      ..lineTo(16, 2)
      ..lineTo(22.5, 11)
      ..lineTo(30.5, 5)
      ..lineTo(29, 19)
      ..close();
    canvas.save();
    canvas.scale(size.width / 32, size.height / 22);
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..color = stroke
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.4
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CrownPainter oldDelegate) =>
      oldDelegate.fill != fill || oldDelegate.stroke != stroke;
}

class _ShowKey extends StatefulWidget {
  const _ShowKey({
    required this.label,
    required this.fill,
    required this.foreground,
    required this.onPressed,
    this.icon,
    this.enabled = true,
  });

  final String label;
  final Color fill;
  final Color foreground;
  final VoidCallback onPressed;
  final IconData? icon;
  final bool enabled;

  @override
  State<_ShowKey> createState() => _ShowKeyState();
}

class _ShowKeyState extends State<_ShowKey> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final pressed = _down && widget.enabled;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.enabled ? (_) => setState(() => _down = true) : null,
      onTapUp: widget.enabled
          ? (_) {
              setState(() => _down = false);
              widget.onPressed();
            }
          : null,
      onTapCancel: () => setState(() => _down = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        height: 56,
        transform: Matrix4.translationValues(0, pressed ? 6 : 0, 0),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: showPanel(
          ink: showInk(context),
          fill: widget.fill,
          radius: 16,
          shadow: Offset(0, pressed ? 0 : 6),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                widget.label.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: showDisplay(
                  context,
                  fontSize: 22,
                  letterSpacing: 1,
                  color: widget.foreground,
                ),
              ),
            ),
            if (widget.icon != null) ...[
              const SizedBox(width: 8),
              Icon(widget.icon, color: widget.foreground, size: 22),
            ],
          ],
        ),
      ),
    );
  }
}

/// Finished-board harness for widget tests. Not used by the app.
@visibleForTesting
Widget finishedLeaderboardPreview({
  required RoomState room,
  required String playerId,
  required PlayerProfile profile,
}) {
  return _FinishedView(
    room: room,
    playerId: playerId,
    profile: profile,
    optedIn: false,
    optingIn: false,
    onPlayAgain: () {},
    onHome: () {},
    onEditProfile: () {},
  );
}
