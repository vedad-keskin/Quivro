import 'package:shared_preferences/shared_preferences.dart';
import 'avatars.dart';

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

class ActiveRoomSession {
  const ActiveRoomSession({required this.code, required this.playerId});

  final String code;
  final String playerId;
}

class ProfileStore {
  static const _nickKey = 'quivro.nickname';
  static const _avatarKey = 'quivro.avatar';
  static const _activeCodeKey = 'quivro.activeCode';
  static const _activePlayerIdKey = 'quivro.activePlayerId';

  Future<PlayerProfile?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final nickname = prefs.getString(_nickKey);
    if (nickname == null || nickname.trim().isEmpty) return null;
    final avatar = prefs.getInt(_avatarKey) ?? 0;
    return PlayerProfile(
      nickname: nickname.trim(),
      avatar: avatar.clamp(0, avatarCount - 1),
    );
  }

  Future<void> save(PlayerProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nickKey, profile.nickname.trim());
    await prefs.setInt(_avatarKey, profile.avatar.clamp(0, avatarCount - 1));
  }

  Future<ActiveRoomSession?> loadActiveSession() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_activeCodeKey)?.trim().toUpperCase();
    final playerId = prefs.getString(_activePlayerIdKey)?.trim();
    if (code == null || code.isEmpty || playerId == null || playerId.isEmpty) {
      return null;
    }
    return ActiveRoomSession(code: code, playerId: playerId);
  }

  Future<void> saveActiveSession({
    required String code,
    required String playerId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_activeCodeKey, code.trim().toUpperCase());
    await prefs.setString(_activePlayerIdKey, playerId.trim());
  }

  Future<void> clearActiveSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_activeCodeKey);
    await prefs.remove(_activePlayerIdKey);
  }
}
