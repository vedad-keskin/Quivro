import 'package:shared_preferences/shared_preferences.dart';

class PlayerProfile {
  const PlayerProfile({required this.nickname, required this.avatar});

  final String nickname;
  final int avatar;

  bool get isValid => nickname.trim().isNotEmpty;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlayerProfile &&
          nickname == other.nickname &&
          avatar == other.avatar;

  @override
  int get hashCode => Object.hash(nickname, avatar);
}

class ProfileStore {
  static const _nickKey = 'quivro.nickname';
  static const _avatarKey = 'quivro.avatar';

  Future<PlayerProfile?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final nickname = prefs.getString(_nickKey);
    if (nickname == null || nickname.trim().isEmpty) return null;
    final avatar = prefs.getInt(_avatarKey) ?? 0;
    return PlayerProfile(nickname: nickname.trim(), avatar: avatar.clamp(0, 7));
  }

  Future<void> save(PlayerProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nickKey, profile.nickname.trim());
    await prefs.setInt(_avatarKey, profile.avatar.clamp(0, 7));
  }
}
