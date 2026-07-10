import 'dart:math';

import 'package:firebase_database/firebase_database.dart';
import 'room_models.dart';

class RoomRepository {
  RoomRepository({FirebaseDatabase? database})
      : _db = database ?? FirebaseDatabase.instance;

  final FirebaseDatabase _db;
  final _random = Random();

  DatabaseReference roomRef(String code) => _db.ref('rooms/${code.toUpperCase()}');

  Stream<RoomState?> watchRoom(String code) {
    final upper = code.toUpperCase();
    return roomRef(upper).onValue.map((event) {
      final value = event.snapshot.value;
      if (value == null || value is! Map) return null;
      return RoomState.fromSnapshot(upper, Map<dynamic, dynamic>.from(value));
    });
  }

  Future<bool> roomExists(String code) async {
    final snap = await roomRef(code).get();
    return snap.exists;
  }

  Future<String> joinRoom({
    required String code,
    required String name,
    required int avatar,
  }) async {
    final upper = code.toUpperCase().trim();
    final exists = await roomExists(upper);
    if (!exists) {
      throw StateError('ROOM_NOT_FOUND');
    }

    final roomSnap = await roomRef(upper).get();
    final raw = roomSnap.value;
    final usedNames = <String>{};
    if (raw is Map && raw['players'] is Map) {
      for (final entry in (raw['players'] as Map).values) {
        if (entry is Map && entry['name'] != null) {
          usedNames.add('${entry['name']}'.toLowerCase());
        }
      }
    }

    var unique = name.trim().isEmpty ? 'Player' : name.trim();
    if (usedNames.contains(unique.toLowerCase())) {
      var i = 2;
      while (usedNames.contains('$unique$i'.toLowerCase())) {
        i++;
      }
      unique = '$unique$i';
    }

    final id =
        'p_${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}_${_random.nextInt(1 << 20).toRadixString(36)}';

    await roomRef(upper).child('players').child(id).set({
      'id': id,
      'name': unique,
      'score': 0,
      'avatar': avatar.clamp(0, 7),
      'joinedAt': DateTime.now().millisecondsSinceEpoch,
    });

    return id;
  }

  Future<void> submitAnswer({
    required String code,
    required int questionIndex,
    required String playerId,
    required int choice,
  }) async {
    final path = roomRef(code).child('answers').child('$questionIndex').child(playerId);
    final existing = await path.get();
    if (existing.exists) return;

    await path.set({
      'choice': choice,
      'answeredAt': DateTime.now().millisecondsSinceEpoch,
    });
  }
}
