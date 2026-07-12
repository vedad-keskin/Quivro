import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/room_models.dart';

RoomState _room({
  required String phase,
  int currentIndex = 0,
  int endsAt = 2_000_000,
  String playerId = 'p1',
}) {
  return RoomState.fromSnapshot('ABC123', {
    'phase': phase,
    'createdAt': 1_000_000,
    'currentIndex': currentIndex,
    'totalQuestions': 10,
    'currentQuestion': {
      'id': 'q1',
      'type': 'mcq',
      'category': 'gaming',
      'difficulty': 'easy',
      'prompt': 'Test?',
      'options': ['A', 'B', 'C', 'D'],
      'endsAt': endsAt,
      'durationMs': 15_000,
      'index': currentIndex,
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
  test('canSubmit allows valid in-time answers', () {
    final room = _room(phase: 'question', endsAt: 2_000_000);

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 0,
        choice: 2,
        nowMs: 1_999_000,
      ),
      isTrue,
    );
  });

  test('canSubmit rejects late, stale, and invalid submissions', () {
    final room = _room(phase: 'question', endsAt: 2_000_000);

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 0,
        choice: 2,
        nowMs: 2_000_001,
      ),
      isFalse,
    );

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 1,
        choice: 2,
        nowMs: 1_999_000,
      ),
      isFalse,
    );

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'missing',
        questionIndex: 0,
        choice: 2,
        nowMs: 1_999_000,
      ),
      isFalse,
    );

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 0,
        choice: 9,
        nowMs: 1_999_000,
      ),
      isFalse,
    );

    final reveal = _room(phase: 'reveal', endsAt: 2_000_000);
    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: reveal,
        playerId: 'p1',
        questionIndex: 0,
        choice: 1,
        nowMs: 1_999_000,
      ),
      isFalse,
    );
  });

  test('canSubmit still allows another choice before the timer ends', () {
    final room = _room(phase: 'question', endsAt: 2_000_000);

    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 0,
        choice: 1,
        nowMs: 1_999_000,
      ),
      isTrue,
    );
    expect(
      AnswerSubmissionPolicy.canSubmit(
        room: room,
        playerId: 'p1',
        questionIndex: 0,
        choice: 3,
        nowMs: 1_999_500,
      ),
      isTrue,
    );
  });
}
