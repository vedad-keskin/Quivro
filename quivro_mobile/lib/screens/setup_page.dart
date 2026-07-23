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
  late int _avatar;
  bool _saving = false;
  final _store = ProfileStore();
  final _repo = RoomRepository();

  @override
  void initState() {
    super.initState();
    _nick = TextEditingController(text: widget.existing?.nickname ?? '');
    _avatar = widget.existing?.avatar ?? 0;
  }

  @override
  void dispose() {
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
                          style: GoogleFonts.nunito(
                            fontSize: 40,
                            fontWeight: FontWeight.w800,
                            color: palette.text,
                          ),
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
                strings.chooseNicknameAvatar,
                style: GoogleFonts.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: palette.muted,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nick,
                textCapitalization: TextCapitalization.words,
                maxLength: 16,
                decoration: InputDecoration(
                  labelText: strings.nickname,
                  counterText: '',
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
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? strings.saving : strings.continueLabel),
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
