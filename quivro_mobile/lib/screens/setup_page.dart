import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/avatars.dart';
import '../core/profile_store.dart';
import '../widgets/avatar_widgets.dart';

class SetupPage extends StatefulWidget {
  const SetupPage({super.key, this.existing});

  final PlayerProfile? existing;

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  late final TextEditingController _nick;
  late int _avatar;
  bool _saving = false;

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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a nickname')),
      );
      return;
    }
    setState(() => _saving = true);
    final profile = PlayerProfile(nickname: name, avatar: _avatar);
    await ProfileStore().save(profile);
    if (!mounted) return;
    context.go('/', extra: profile);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Quivro',
                style: GoogleFonts.nunito(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: QuivroColors.navy,
                ),
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
                'Choose a nickname & avatar',
                style: GoogleFonts.nunito(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: QuivroColors.muted,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nick,
                textCapitalization: TextCapitalization.words,
                maxLength: 16,
                decoration: const InputDecoration(
                  labelText: 'Nickname',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 20),
              AvatarPicker(
                selected: _avatar,
                onSelected: (i) => setState(() => _avatar = i),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? 'Saving…' : 'Continue'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
