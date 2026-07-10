import 'dart:math';

import 'package:firebase_database/firebase_database.dart';
import 'avatars.dart';
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
    String? existingId;
    if (raw is Map && raw['players'] is Map) {
      for (final entry in (raw['players'] as Map).entries) {
        final value = entry.value;
        if (value is Map && value['name'] != null) {
          final n = '${value['name']}';
          usedNames.add(n.toLowerCase());
          if (n.toLowerCase() == name.trim().toLowerCase()) {
            existingId = '${entry.key}';
          }
        }
      }
    }

    // Rejoin same nickname in rematch lobby — keep wins.
    if (existingId != null) {
      await roomRef(upper).child('players').child(existingId).update({
        'avatar': avatar.clamp(0, avatarCount - 1),
        'name': name.trim().isEmpty ? 'Player' : name.trim(),
      });
      return existingId;
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
      'avatar': avatar.clamp(0, avatarCount - 1),
      'joinedAt': DateTime.now().millisecondsSinceEpoch,
      'wins': 0,
    });

    return id;
  }

  Future<void> submitAnswer({
    required String code,
    required int questionIndex,
    required String playerId,
    required int choice,
  }) async {
    final path =
        roomRef(code).child('answers').child('$questionIndex').child(playerId);
    // Allow reselect — always overwrite choice + timestamp.
    await path.set({
      'choice': choice,
      'answeredAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> setRematchReady({
    required String code,
    required String playerId,
  }) async {
    await roomRef(code).child('rematchReady').child(playerId).set(true);
  }
}
