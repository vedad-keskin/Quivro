import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../core/room_repository.dart';
import '../widgets/avatar_widgets.dart';

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
    _code.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    final code = _code.text.trim().toUpperCase();
    if (code.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the room code')),
      );
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
      context.go('/room/$code', extra: {
        'playerId': playerId,
        'profile': _profile,
      });
    } catch (e) {
      if (!mounted) return;
      final message = e.toString().contains('ROOM_NOT_FOUND')
          ? 'Room not found. Check the code on the TV.'
          : 'Could not join. Check your connection.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // ClipRRect(
                            //   borderRadius: BorderRadius.circular(8),
                            //   child: Image.asset(
                            //     'assets/branding/logo_only.png',
                            //     width: 36,
                            //     height: 36,
                            //     fit: BoxFit.cover,
                            //   ),
                            // ),
                            // const SizedBox(width: 1),
                            Text(
                              'Quivro',
                              style: GoogleFonts.nunito(
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
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
                              colors: [QuivroColors.blue, QuivroColors.purple],
                            ),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/setup', extra: _profile),
                    child: AvatarBadge(index: _profile.avatar, size: 52),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Playing as ${_profile.nickname}',
                style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              const Spacer(),
              Text(
                'Join a room',
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
                textCapitalization: TextCapitalization.characters,
                style: GoogleFonts.nunito(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 8,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
                  LengthLimitingTextInputFormatter(6),
                  _UpperCaseFormatter(),
                ],
                decoration: const InputDecoration(
                  hintText: 'CODE',
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 56,
                child: OutlinedButton(
                  onPressed: _joining ? null : _join,
                  child: Text(_joining ? 'Joining…' : 'Join'),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/setup', extra: _profile),
                child: Text(
                  'Edit nickname & avatar',
                  style: GoogleFonts.nunito(
                    fontWeight: FontWeight.w700,
                    color: QuivroColors.muted,
                  ),
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

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
