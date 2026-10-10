import 'package:flutter_test/flutter_test.dart';
import 'package:quivro_mobile/core/room_models.dart';

Map<String, dynamic> fixture() => {
  'phase': 'question', 'roundId': 'a', 'createdAt': 1,
  'currentIndex': 2, 'totalQuestions': 5,
  'config': {'powerUpSlots': ['double_it', 'double_it', 'fifty_fifty']},
  'currentQuestion': {'index': 2, 'answerOpensAt': 1000, 'endsAt': 2000, 'durationMs': 1000},
  'players': {'p1': {'id': 'p1', 'name': 'Ana', 'avatar': 0}},
};
bool allowed(RoomState room, {int slot = 0, int now = 1500}) => PowerUpRequestPolicy.canRequest(
  room: room, playerId: 'p1', slot: slot, questionIndex: room.currentIndex, nowMs: now);

void main() {
  test('accepts before/after answering, rejects preview and closed window', () {
    final raw = fixture();
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isTrue);
    raw['answers'] = {'2': {'p1': {'choice': 1, 'answeredAt': 1400}}};
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isTrue);
    for (final now in [999, 2000, 2001]) {
      expect(allowed(RoomState.fromSnapshot('TEST', raw), now: now), isFalse);
    }
  });
  test('only blocks this question and keeps spent slots spent', () {
    final raw = fixture();
    raw['powerUps'] = {'p1': {'used': {'0': 2}}};
    expect(allowed(RoomState.fromSnapshot('TEST', raw), slot: 1), isFalse);
    raw['currentIndex'] = 3;
    raw['currentQuestion']['index'] = 3;
    final next = RoomState.fromSnapshot('TEST', raw);
    expect(allowed(next, slot: 0), isFalse);
    expect(allowed(next, slot: 1), isTrue);
    expect(allowed(next, slot: 2), isTrue);
  });
  test('blocks final/legacy/locked questions but allows the penultimate one', () {
    final raw = fixture();
    raw['totalQuestions'] = 4;
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isTrue);
    raw['totalQuestions'] = 3;
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isFalse);
    raw['totalQuestions'] = 5;
    raw['powerUps'] = {'p1': {'locked': {'2': {'blank': true}}}};
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isFalse);
    raw.remove('powerUps'); raw.remove('roundId');
    expect(allowed(RoomState.fromSnapshot('TEST', raw)), isFalse);
  });
}
