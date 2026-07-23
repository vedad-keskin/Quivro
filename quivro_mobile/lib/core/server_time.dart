import 'dart:async';

import 'package:firebase_database/firebase_database.dart';

/// Estimates Firebase RTDB server time via `.info/serverTimeOffset`
/// so host and clients share one clock for question timers.
class ServerTime {
  ServerTime({FirebaseDatabase? database})
    : _db = database ?? FirebaseDatabase.instance {
    _subscription = _db.ref('.info/serverTimeOffset').onValue.listen((event) {
      final value = event.snapshot.value;
      _offsetMs = value is num ? value.toInt() : 0;
    });
  }

  final FirebaseDatabase _db;
  int _offsetMs = 0;
  late final StreamSubscription<DatabaseEvent> _subscription;

  /// Approximate server epoch ms. Falls back to local clock if offset unknown.
  int nowMs() => DateTime.now().millisecondsSinceEpoch + _offsetMs;

  void dispose() {
    _subscription.cancel();
  }
}
