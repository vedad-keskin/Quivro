import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_models.dart';
import '../core/room_repository.dart';
import '../widgets/avatar_widgets.dart';

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

class _RoomPageState extends State<RoomPage> {
  final _repo = RoomRepository();
  late final Stream<RoomState?> _stream;
  bool _submitting = false;
  int? _picked;
  int _trackedQuestion = -1;

  @override
  void initState() {
    super.initState();
    _stream = _repo.watchRoom(widget.code);
  }

  Future<void> _answer(RoomState room, int choice) async {
    if (room.phase != 'question' || room.hasAnswered(widget.playerId) || _submitting) {
      return;
    }
    setState(() {
      _submitting = true;
      _picked = choice;
    });
    try {
      await _repo.submitAnswer(
        code: widget.code,
        questionIndex: room.currentIndex,
        playerId: widget.playerId,
        choice: choice,
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not send answer')),
        );
        setState(() => _picked = null);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<RoomState?>(
      stream: _stream,
      builder: (context, snap) {
        if (snap.hasError) {
          return Scaffold(
            body: Center(child: Text('Connection error: ${snap.error}')),
          );
        }
        final room = snap.data;
        if (room == null) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    snap.connectionState == ConnectionState.waiting
                        ? 'Connecting…'
                        : 'Room closed',
                  ),
                  TextButton(
                    onPressed: () => context.go('/', extra: widget.profile),
                    child: const Text('Back home'),
                  ),
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
              _picked = null;
            });
          });
        }
        final answered = room.hasAnswered(widget.playerId);

        if (room.phase == 'finished') {
          return _FinishedView(
            score: room.player(widget.playerId)?.score ?? 0,
            profile: widget.profile,
          );
        }

        if (room.phase == 'lobby') {
          return _LobbyView(
            code: widget.code,
            profile: widget.profile,
          );
        }

        if (room.phase == 'prepare') {
          return _PrepareView(
            profile: widget.profile,
            questionNumber: room.currentIndex < 0 ? 1 : room.currentIndex + 1,
            total: room.totalQuestions,
            endsAt: room.prepareEndsAt ??
                DateTime.now().millisecondsSinceEpoch + 5000,
          );
        }

        if (room.currentQuestion == null) {
          return _LobbyView(
            code: widget.code,
            profile: widget.profile,
          );
        }

        return _PlayView(
          room: room,
          profile: widget.profile,
          locked: answered || room.phase != 'question' || _picked != null,
          picked: _picked ??
              (answered
                  ? (room.answers['${room.currentIndex}']?[widget.playerId]?['choice']
                          as num?)
                      ?.toInt()
                  : null),
          onPick: (i) => _answer(room, i),
        );
      },
    );
  }
}

class _LobbyView extends StatelessWidget {
  const _LobbyView({required this.code, required this.profile});

  final String code;
  final PlayerProfile profile;

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
            ],
          ),
        ),
      ),
    );
  }
}

class _PrepareView extends StatelessWidget {
  const _PrepareView({
    required this.profile,
    required this.questionNumber,
    required this.total,
    required this.endsAt,
  });

  final PlayerProfile profile;
  final int questionNumber;
  final int total;
  final int endsAt;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              Row(
                children: [
                  AvatarBadge(index: profile.avatar, size: 44),
                  const SizedBox(width: 10),
                  Text(
                    'Q $questionNumber / $total',
                    style: GoogleFonts.nunito(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                'Get ready!',
                style: GoogleFonts.nunito(
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Next question coming up…',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 28),
              _Countdown(endsAt: endsAt),
              const Spacer(),
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
  });

  final RoomState room;
  final PlayerProfile profile;
  final bool locked;
  final int? picked;
  final ValueChanged<int> onPick;

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
                    _Countdown(endsAt: q.endsAt)
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F3FF),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        isReveal ? 'Locked' : room.phase,
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.w800,
                          color: QuivroColors.purple,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (locked && room.phase == 'question')
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  'Answer sent!',
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w800,
                    color: QuivroColors.blue,
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

class _AnswerTile extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final color = answerColors[index];
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(24),
      elevation: selected ? 8 : 2,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(24),
        child: Opacity(
          opacity: enabled || selected ? 1 : 0.55,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: selected
                  ? Border.all(color: Colors.white, width: 5)
                  : null,
            ),
            alignment: Alignment.center,
            child: Text(
              answerLabels[index],
              style: GoogleFonts.nunito(
                fontSize: 64,
                fontWeight: FontWeight.w900,
                color: QuivroColors.navy,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Countdown extends StatefulWidget {
  const _Countdown({required this.endsAt});

  final int endsAt;

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
    if (oldWidget.endsAt != widget.endsAt) _tick();
  }

  void _tick() {
    final secs =
        ((widget.endsAt - DateTime.now().millisecondsSinceEpoch) / 1000)
            .ceil()
            .clamp(0, 999);
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
  const _FinishedView({required this.score, required this.profile});

  final int score;
  final PlayerProfile profile;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              const Spacer(),
              AvatarBadge(index: profile.avatar, size: 80),
              const SizedBox(height: 16),
              Text(
                'Nice game, ${profile.nickname}!',
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$score pts',
                style: GoogleFonts.nunito(
                  fontSize: 40,
                  fontWeight: FontWeight.w900,
                  color: QuivroColors.blue,
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go('/', extra: profile),
                  child: const Text('Back home'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
