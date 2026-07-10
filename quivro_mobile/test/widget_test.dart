import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/avatars.dart';
import 'package:quivro_mobile/core/room_models.dart';

void main() {
  test('avatar indices clamp to 0..19', () {
    expect(avatarColor(0), avatarColors[0]);
    expect(avatarEmoji(0), '🦉');
    expect(avatarEmoji(19), avatarEmojis[19]);
    expect(avatarEmoji(20), avatarEmojis[19]);
    expect(avatarCount, 20);
  });

  test('RoomState parses player avatar', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'lobby',
      'currentIndex': -1,
      'totalQuestions': 15,
      'players': {
        'p1': {
          'id': 'p1',
          'name': 'Ana',
          'score': 0,
          'avatar': 12,
          'joinedAt': 1,
        },
      },
      'answers': {},
    });
    expect(room.players['p1']!.avatar, 12);
    expect(room.players['p1']!.name, 'Ana');
  });
}
