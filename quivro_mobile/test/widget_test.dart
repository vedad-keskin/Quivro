import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/avatars.dart';
import 'package:quivro_mobile/core/room_models.dart';

void main() {
  test('avatar indices clamp to 0..7', () {
    expect(avatarColor(0), avatarColors[0]);
    expect(avatarEmoji(7), avatarEmojis[7]);
    expect(avatarEmoji(8), avatarEmojis[7]);
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
          'avatar': 3,
          'joinedAt': 1,
        },
      },
      'answers': {},
    });
    expect(room.players['p1']!.avatar, 3);
    expect(room.players['p1']!.name, 'Ana');
  });
}
