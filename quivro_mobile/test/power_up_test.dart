import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/room_models.dart';

void main() {
  test('50/50 hides the two stored indices', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'question',
      'createdAt': 1_000_000,
      'currentIndex': 0,
      'totalQuestions': 10,
      'config': {
        'powerUpSlots': {'0': 'fifty_fifty', '2': 'fifty_fifty'},
      },
      'currentQuestion': {
        'id': 'q1',
        'type': 'mcq',
        'category': 'biology',
        'difficulty': 'easy',
        'prompt': 'Test?',
        'options': ['A', 'B', 'C', 'D'],
        'endsAt': 2_000_000,
        'durationMs': 15_000,
        'index': 0,
        'total': 10,
      },
      'players': {
        'p1': {
          'id': 'p1',
          'name': 'Ana',
          'score': 0,
          'avatar': 0,
          'joinedAt': 1,
        },
      },
      'powerUps': {
        'p1': {
          'used': {'0': 0},
          'eliminated': {
            '0': [1, 3],
          },
        },
      },
      'answers': {},
    });

    expect(room.powerUpSlots, ['fifty_fifty', null, 'fifty_fifty']);
    expect(room.eliminatedChoices('p1'), [1, 3]);
    expect(room.powerUpSlotUsed('p1', 0), isTrue);
    expect(room.powerUpSlotUsed('p1', 2), isFalse);
    expect(room.hasPowerUps, isTrue);
  });

  test('50/50 reads Firebase array-shaped slot results', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'question',
      'createdAt': 1,
      'currentIndex': 0,
      'totalQuestions': 1,
      'players': {},
      'answers': {},
      'powerUps': {
        'p1': {
          'used': [0],
          'eliminated': [
            [1, 3],
          ],
        },
      },
    });

    expect(room.eliminatedChoices('p1'), [1, 3]);
    expect(room.powerUpSlotUsed('p1', 0), isTrue);
  });
}
