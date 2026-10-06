import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_repository.dart';
import '../core/strings.dart';
import '../core/theme.dart';
import '../widgets/avatar_widgets.dart';
import '../widgets/quivro_snackbar.dart';
import '../widgets/settings_chips.dart';
import '../widgets/wordmark.dart';

class SetupPage extends StatefulWidget {
  const SetupPage({
    super.key,
    this.existing,
    this.returnTo,
    this.returnPlayerId,
  });

  final PlayerProfile? existing;

  /// When set (e.g. `/room/ABC123`), navigate here after save instead of home.
  final String? returnTo;
  final String? returnPlayerId;

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  late final TextEditingController _nick;
  final _nickFocus = FocusNode();
  late int _avatar;
  bool _saving = false;
  bool _continueDown = false;
  final _store = ProfileStore();
  final _repo = RoomRepository();

  @override
  void initState() {
    super.initState();
    _nick = TextEditingController(text: widget.existing?.nickname ?? '');
    _avatar = widget.existing?.avatar ?? 0;
    _nickFocus.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _nickFocus.dispose();
    _nick.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nick.text.trim();
    if (name.isEmpty) {
      showQuivroSnack(context, context.strings.enterNickname);
      return;
    }
    setState(() => _saving = true);
    final profile = PlayerProfile(nickname: name, avatar: _avatar);
    await _store.save(profile);

    final session = await _store.loadActiveSession();
    if (session != null) {
      try {
        await _repo.updatePlayerProfile(
          code: session.code,
          playerId: session.playerId,
          name: profile.nickname,
          avatar: profile.avatar,
        );
      } catch (_) {
        /* room may be gone — local profile still saved */
      }
    }

    if (!mounted) return;

    final returnTo = widget.returnTo;
    final returnPlayerId = widget.returnPlayerId ?? session?.playerId;
    if (returnTo != null &&
        returnTo.startsWith('/room/') &&
        returnPlayerId != null &&
        returnPlayerId.isNotEmpty) {
      context.go(
        returnTo,
        extra: {'playerId': returnPlayerId, 'profile': profile},
      );
      return;
    }

    context.go('/', extra: profile);
  }

  @override
  Widget build(BuildContext context) {
    final fromRoom = widget.returnTo != null;
    final strings = context.strings;
    final palette = context.palette;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: QuivroWordmarkHero(
                        child: Text(
                          'Quivro',
                          style: showTitle(context, fontSize: 40),
                        ),
                      ),
                    ),
                  ),
                  if (fromRoom)
                    TextButton(
                      onPressed: _saving
                          ? null
                          : () {
                              final returnTo = widget.returnTo!;
                              final playerId = widget.returnPlayerId;
                              if (playerId != null && widget.existing != null) {
                                context.go(
                                  returnTo,
                                  extra: {
                                    'playerId': playerId,
                                    'profile': widget.existing,
                                  },
                                );
                              } else {
                                context.go(returnTo);
                              }
                            },
                      child: Text(
                        strings.cancel,
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.w700,
                          color: palette.muted,
                        ),
                      ),
                    ),
                ],
              ),
              Container(
                margin: const EdgeInsets.only(top: 6, bottom: 28),
                height: 4,
                width: 72,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [QuivroColors.blue, QuivroColors.purple],
                  ),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              Text(
                strings.chooseNicknameAvatar.toUpperCase(),
                style: showDisplay(
                  context,
                  fontSize: 18,
                  color: palette.muted,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                decoration: showPanel(
                  ink: _nickFocus.hasFocus ? showBulb : showInk(context),
                  fill: palette.card,
                  radius: 18,
                  shadow: const Offset(4, 4),
                ),
                child: TextField(
                  controller: _nick,
                  focusNode: _nickFocus,
                  textCapitalization: TextCapitalization.words,
                  maxLength: 16,
                  cursorColor: showBulb,
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: palette.text,
                  ),
                  decoration: InputDecoration(
                    labelText: strings.nickname,
                    counterText: '',
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    labelStyle: GoogleFonts.nunito(
                      fontWeight: FontWeight.w700,
                      color: palette.muted,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: AvatarPicker(
                  selected: _avatar,
                  onSelected: (i) => setState(() => _avatar = i),
                ),
              ),
              const SizedBox(height: 12),
              GestureDetector(
                onTapDown: _saving
                    ? null
                    : (_) => setState(() => _continueDown = true),
                onTapUp: (_) {
                  setState(() => _continueDown = false);
                  if (!_saving) _save();
                },
                onTapCancel: () => setState(() => _continueDown = false),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 80),
                  height: 56,
                  width: double.infinity,
                  transform: Matrix4.translationValues(
                    0,
                    _continueDown && !_saving ? 6 : 0,
                    0,
                  ),
                  alignment: Alignment.center,
                  decoration: showPanel(
                    ink: showInk(context),
                    fill: _saving
                        ? showBulb.withValues(alpha: 0.5)
                        : showBulb,
                    radius: 16,
                    shadow: Offset(0, _continueDown && !_saving ? 0 : 6),
                  ),
                  child: Text(
                    (_saving ? strings.saving : strings.continueLabel)
                        .toUpperCase(),
                    style: showDisplay(
                      context,
                      fontSize: 24,
                      letterSpacing: 1,
                      color: showInkDay,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const SizedBox(
                width: double.infinity,
                child: Center(child: SettingsChips()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
