import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_repository.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import '../widgets/avatar_widgets.dart';
import '../widgets/credits_dialog.dart';
import '../widgets/offline_banner.dart';
import '../widgets/quivro_snackbar.dart';
import '../widgets/settings_chips.dart';
import '../widgets/wordmark.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.profile});

  final PlayerProfile profile;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _code = TextEditingController();
  final _repo = RoomRepository();
  final _store = ProfileStore();
  late PlayerProfile _profile;
  bool _joining = false;
  bool _resumingSession = false;
  Timer? _easterEggTimer;

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
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
    _code.dispose();
    super.dispose();
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
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
                  return SingleChildScrollView(
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            GestureDetector(
                                              onLongPressStart: (_) {
                                                _easterEggTimer?.cancel();
                                                _easterEggTimer = Timer(
                                                  const Duration(seconds: 1),
                                                  () {
                                                    if (mounted) {
                                                      _showCredits();
                                                    }
                                                  },
                                                );
                                              },
                                              onLongPressEnd: (_) =>
                                                  _easterEggTimer?.cancel(),
                                              onLongPressCancel: () =>
                                                  _easterEggTimer?.cancel(),
                                              child: QuivroWordmarkHero(
                                                child: Text(
                                                  'Quivro',
                                                  style: GoogleFonts.nunito(
                                                    fontSize: 36,
                                                    fontWeight: FontWeight.w800,
                                                    color: palette.text,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        Container(
                                          margin: const EdgeInsets.only(top: 6),
                                          height: 4,
                                          width: 64,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [
                                                QuivroColors.blue,
                                                QuivroColors.purple,
                                              ],
                                            ),
                                            borderRadius:
                                                BorderRadius.circular(99),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () =>
                                        context.go('/setup', extra: _profile),
                                    child: AvatarBadge(
                                      index: _profile.avatar,
                                      size: 52,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                strings.playingAs(_profile.nickname),
                                style: GoogleFonts.nunito(
                                  fontWeight: FontWeight.w700,
                                  color: palette.muted,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                strings.joinARoom,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.nunito(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _code,
                                textAlign: TextAlign.center,
                                textCapitalization:
                                    TextCapitalization.characters,
                                style: GoogleFonts.nunito(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
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
                                ),
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                height: 56,
                                child: OutlinedButton(
                                  onPressed: _joining ? null : _join,
                                  child: Text(
                                    _joining ? strings.joining : strings.join,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextButton(
                                onPressed: () =>
                                    context.go('/setup', extra: _profile),
                                child: Text(
                                  strings.editNicknameAvatar,
                                  style: GoogleFonts.nunito(
                                    fontWeight: FontWeight.w700,
                                    color: palette.muted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Center(child: SettingsChips()),
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
          ],
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
