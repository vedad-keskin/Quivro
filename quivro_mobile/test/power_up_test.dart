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

  test('second chance reads the stored probe', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'question',
      'createdAt': 1,
      'currentIndex': 2,
      'totalQuestions': 10,
      'config': {
        'powerUpSlots': {'1': 'second_chance'},
      },
      'players': {},
      'answers': {},
      'powerUps': {
        'p1': {
          'used': {'1': 2},
          'probes': {
            '2': {'choice': 0, 'correct': true},
          },
        },
      },
    });

    expect(room.powerUpSlots, [null, 'second_chance', null]);
    expect(room.probeFor('p1')?.choice, 0);
    expect(room.probeFor('p1')?.correct, isTrue);
    expect(room.powerUpSlotUsed('p1', 1), isTrue);
  });

  test('a power-up already used on this question blocks second chance', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'question',
      'createdAt': 1_000_000,
      'currentIndex': 0,
      'totalQuestions': 10,
      'config': {
        'powerUpSlots': {'0': 'fifty_fifty', '1': 'second_chance'},
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
        },
      },
      'answers': {},
    });

    expect(
      PowerUpRequestPolicy.canRequest(
        room: room,
        playerId: 'p1',
        slot: 1,
        questionIndex: 0,
        nowMs: 1_990_000,
      ),
      isFalse,
    );
  });

  test('same tile locks a visible check even when another player is still out', () {
    RoomState room({
      required Map<String, Map<String, Map<String, int>>> answers,
      bool withOther = true,
    }) {
      return RoomState.fromSnapshot('ABC123', {
        'phase': 'question',
        'createdAt': 1,
        'currentIndex': 0,
        'totalQuestions': 1,
        'players': {
          'p1': {'id': 'p1', 'name': 'Ana', 'score': 0, 'avatar': 0, 'joinedAt': 1},
          if (withOther)
            'p2': {'id': 'p2', 'name': 'Ben', 'score': 0, 'avatar': 1, 'joinedAt': 2},
        },
        'answers': answers,
        'powerUps': {
          'p1': {
            'probes': {
              '0': {'choice': 2, 'correct': true},
            },
          },
        },
      });
    }

    expect(
      room(answers: {}).sameTileLocksProbe('p1', 2),
      isTrue,
    );
    expect(
      room(answers: {
        '0': {'p2': {'choice': 1, 'answeredAt': 1}},
      }).sameTileLocksProbe('p1', 2),
      isTrue,
    );
    expect(
      room(answers: {
        '0': {'p2': {'choice': 1, 'answeredAt': 1}},
      }).sameTileLocksProbe('p1', 0),
      isFalse,
    );
    expect(
      room(answers: {
        '0': {
          'p2': {'choice': 1, 'answeredAt': 1},
          'p1': {'choice': 2, 'answeredAt': 2},
        },
      }).sameTileLocksProbe('p1', 2),
      isFalse,
    );
    expect(
      RoomState.fromSnapshot('ABC123', {
        'phase': 'question',
        'createdAt': 1,
        'currentIndex': 0,
        'totalQuestions': 1,
        'players': {
          'p1': {'id': 'p1', 'name': 'Ana', 'score': 0, 'avatar': 0, 'joinedAt': 1},
        },
        'answers': {},
        'powerUps': {
          'p1': {
            'probes': {
              '0': {'choice': 3, 'correct': false},
            },
          },
        },
      }).sameTileLocksProbe('p1', 3),
      isTrue,
    );
  });
}
