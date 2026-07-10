import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/room_models.dart';

RoomState _room({
  required String phase,
  int createdAt = 1_000_000,
  int endsAt = 2_000_000,
  int durationMs = 15_000,
  String playerId = 'p1',
}) {
  return RoomState.fromSnapshot('ABC123', {
    'phase': phase,
    'createdAt': createdAt,
    'currentIndex': 0,
    'totalQuestions': 10,
    'currentQuestion': {
      'id': 'q1',
      'type': 'mcq',
      'category': 'gaming',
      'difficulty': 'easy',
      'prompt': 'Test?',
      'options': ['A', 'B', 'C', 'D'],
      'endsAt': endsAt,
      'durationMs': durationMs,
      'index': 0,
      'total': 10,
    },
    'players': {
      playerId: {
        'id': playerId,
        'name': 'Ana',
        'score': 0,
        'avatar': 0,
        'joinedAt': 1,
      },
    },
    'answers': {},
  });
}

void main() {
  test('RoomState parses createdAt', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'lobby',
      'createdAt': 1_700_000_000_000,
      'currentIndex': -1,
      'totalQuestions': 10,
      'players': {},
      'answers': {},
    });

    expect(room.createdAt, 1_700_000_000_000);
  });

  test('canResume allows lobby and finished rooms', () {
    final lobby = RoomState.fromSnapshot('ABC123', {
      'phase': 'lobby',
      'createdAt': 1_000_000,
      'currentIndex': -1,
      'totalQuestions': 10,
      'players': {
        'p1': {
          'id': 'p1',
          'name': 'Ana',
          'score': 0,
          'avatar': 0,
          'joinedAt': 1,
        },
      },
      'answers': {},
    });

    expect(RoomSessionPolicy.canResume(lobby, 'p1', 1_100_000), isTrue);

    final finished = RoomState.fromSnapshot('ABC123', {
      'phase': 'finished',
      'createdAt': 1_000_000,
      'currentIndex': 9,
      'totalQuestions': 10,
      'players': {
        'p1': {
          'id': 'p1',
          'name': 'Ana',
          'score': 10,
          'avatar': 0,
          'joinedAt': 1,
        },
      },
      'answers': {},
    });

    expect(RoomSessionPolicy.canResume(finished, 'p1', 1_000_000 + 3_600_000), isTrue);
  });

  test('canResume rejects missing player and very old rooms', () {
    final room = _room(phase: 'lobby', createdAt: 1_000_000);

    expect(RoomSessionPolicy.canResume(room, 'missing', 1_100_000), isFalse);
    expect(
      RoomSessionPolicy.canResume(
        room,
        'p1',
        1_000_000 + RoomSessionPolicy.roomMaxAgeMs + 1,
      ),
      isFalse,
    );
  });

  test('isStalePlayState allows active and recently expired questions', () {
    final active = _room(phase: 'question', endsAt: 2_000_000);
    expect(RoomSessionPolicy.isStalePlayState(active, 1_999_000), isFalse);

    final justExpired = _room(phase: 'question', endsAt: 2_000_000);
    expect(
      RoomSessionPolicy.isStalePlayState(
        justExpired,
        2_000_000 + RoomSessionPolicy.questionStaleGraceMs - 1,
      ),
      isFalse,
    );
  });

  test('isStalePlayState rejects long-expired question and reveal phases', () {
    final staleQuestion = _room(phase: 'question', endsAt: 2_000_000);
    expect(
      RoomSessionPolicy.isStalePlayState(
        staleQuestion,
        2_000_000 + RoomSessionPolicy.questionStaleGraceMs + 1,
      ),
      isTrue,
    );

    final staleReveal = _room(phase: 'reveal', endsAt: 2_000_000);
    expect(
      RoomSessionPolicy.isStalePlayState(
        staleReveal,
        2_000_000 + RoomSessionPolicy.revealStaleGraceMs + 1,
      ),
      isTrue,
    );
  });

  test('isStalePlayState rejects play phases without a current question', () {
    final room = RoomState.fromSnapshot('ABC123', {
      'phase': 'question',
      'createdAt': 1_000_000,
      'currentIndex': 0,
      'totalQuestions': 10,
      'players': {
        'p1': {
          'id': 'p1',
          'name': 'Ana',
          'score': 0,
          'avatar': 0,
          'joinedAt': 1,
        },
      },
      'answers': {},
    });

    expect(RoomSessionPolicy.isStalePlayState(room, 1_100_000), isTrue);
  });
}
