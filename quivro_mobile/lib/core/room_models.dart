import 'avatars.dart';

class PublicQuestion {
  PublicQuestion({
    required this.id,
    required this.type,
    required this.category,
    required this.difficulty,
    required this.prompt,
    required this.options,
    required this.answerOpensAt,
    required this.endsAt,
    required this.durationMs,
    required this.index,
    required this.total,
    this.imageUrl,
  });

  final String id;
  final String type;
  final String category;
  final String difficulty;
  final String prompt;
  final List<String> options;
  final String? imageUrl;
  final int answerOpensAt;
  final int endsAt;
  final int durationMs;
  final int index;
  final int total;

  factory PublicQuestion.fromMap(Map<dynamic, dynamic> map) {
    final opts = map['options'];
    List<String> options = ['', '', '', ''];
    if (opts is List) {
      options = List<String>.generate(
        4,
        (i) => i < opts.length ? '${opts[i]}' : '',
      );
    }
    final endsAt = (map['endsAt'] as num?)?.toInt() ?? 0;
    final durationMs = (map['durationMs'] as num?)?.toInt() ?? 15000;
    final answerOpensAt =
        (map['answerOpensAt'] as num?)?.toInt() ??
        (endsAt - durationMs).clamp(0, endsAt);
    return PublicQuestion(
      id: '${map['id'] ?? ''}',
      type: '${map['type'] ?? 'mcq'}',
      category: '${map['category'] ?? ''}',
      difficulty: '${map['difficulty'] ?? ''}',
      prompt: '${map['prompt'] ?? ''}',
      options: options,
      imageUrl: map['imageUrl']?.toString(),
      answerOpensAt: answerOpensAt,
      endsAt: endsAt,
      durationMs: durationMs,
      index: (map['index'] as num?)?.toInt() ?? 0,
      total: (map['total'] as num?)?.toInt() ?? 0,
    );
  }
}

class RoomPlayer {
  RoomPlayer({
    required this.id,
    required this.name,
    required this.score,
    required this.avatar,
    required this.joinedAt,
    this.wins = 0,
    this.lastScoredAt = 0,
  });

  final String id;
  final String name;
  final int score;
  final int avatar;
  final int joinedAt;
  final int wins;
  final int lastScoredAt;

  factory RoomPlayer.fromMap(String id, Map<dynamic, dynamic> map) {
    return RoomPlayer(
      id: '${map['id'] ?? id}',
      name: '${map['name'] ?? 'Player'}',
      score: (map['score'] as num?)?.toInt() ?? 0,
      avatar: ((map['avatar'] as num?)?.toInt() ?? 0).clamp(0, avatarCount - 1),
      joinedAt: (map['joinedAt'] as num?)?.toInt() ?? 0,
      wins: (map['wins'] as num?)?.toInt() ?? 0,
      lastScoredAt: (map['lastScoredAt'] as num?)?.toInt() ?? 0,
    );
  }
}

const powerUpFiftyFifty = 'fifty_fifty';

class PlayerPowerUps {
  const PlayerPowerUps({
    this.used = const <int, int>{},
    this.eliminated = const <int, List<int>>{},
  });

  final Map<int, int> used;
  final Map<int, List<int>> eliminated;
}

class PowerUpRequest {
  const PowerUpRequest({
    required this.slot,
    required this.type,
    required this.questionIndex,
    required this.at,
  });

  final int slot;
  final String type;
  final int questionIndex;
  final int at;
}

List<String?> parsePowerUpSlots(dynamic raw) {
  final slots = <String?>[null, null, null];
  void take(int i, dynamic value) {
    if (i < 0 || i > 2) return;
    slots[i] = value == powerUpFiftyFifty ? powerUpFiftyFifty : null;
  }

  if (raw is List) {
    for (var i = 0; i < raw.length && i < 3; i++) {
      take(i, raw[i]);
    }
  } else if (raw is Map) {
    for (var i = 0; i < 3; i++) {
      take(i, raw['$i'] ?? raw[i]);
    }
  }
  return slots;
}

void _eachEntry(dynamic raw, void Function(String key, dynamic value) each) {
  if (raw is Map) {
    raw.forEach((key, value) => each('$key', value));
  } else if (raw is List) {
    for (var i = 0; i < raw.length; i++) {
      if (raw[i] != null) each('$i', raw[i]);
    }
  }
}

List<int> _optionIndices(dynamic raw) {
  if (raw is! List) return const [];
  final nums = <int>[];
  for (final n in raw) {
    final i = n is num ? n.toInt() : int.tryParse('$n');
    if (i != null && i >= 0 && i <= 3) nums.add(i);
  }
  return nums;
}

Map<String, PlayerPowerUps> parsePowerUps(dynamic raw) {
  final out = <String, PlayerPowerUps>{};
  _eachEntry(raw, (playerId, value) {
    if (value is! Map) return;
    final used = <int, int>{};
    _eachEntry(value['used'], (slot, qIndex) {
      final s = int.tryParse(slot);
      final q = qIndex is num ? qIndex.toInt() : int.tryParse('$qIndex');
      if (s != null && q != null) used[s] = q;
    });
    final eliminated = <int, List<int>>{};
    _eachEntry(value['eliminated'], (qKey, indices) {
      final q = int.tryParse(qKey);
      final nums = _optionIndices(indices);
      if (q != null && nums.isNotEmpty) eliminated[q] = nums;
    });
    out[playerId] = PlayerPowerUps(used: used, eliminated: eliminated);
  });
  return out;
}

Map<String, PowerUpRequest> parsePowerUpRequests(dynamic raw) {
  final out = <String, PowerUpRequest>{};
  if (raw is! Map) return out;
  raw.forEach((playerId, value) {
    if (value is! Map) return;
    final slot = (value['slot'] as num?)?.toInt();
    final questionIndex = (value['questionIndex'] as num?)?.toInt();
    final at = (value['at'] as num?)?.toInt();
    final type = value['type'];
    if (slot == null || questionIndex == null || at == null) return;
    if (type != powerUpFiftyFifty || slot < 0 || slot > 2) return;
    out['$playerId'] = PowerUpRequest(
      slot: slot,
      type: powerUpFiftyFifty,
      questionIndex: questionIndex,
      at: at,
    );
  });
  return out;
}

/// Whether a phone may ask the host to spend a power-up slot.
class PowerUpRequestPolicy {
  PowerUpRequestPolicy._();

  static bool canRequest({
    required RoomState room,
    required String playerId,
    required int slot,
    required int questionIndex,
    required int nowMs,
  }) {
    if (room.phase != 'question') return false;
    if (room.player(playerId) == null) return false;
    if (slot < 0 || slot > 2) return false;
    if (slot >= room.powerUpSlots.length) return false;
    if (room.powerUpSlots[slot] != powerUpFiftyFifty) return false;
    if (room.powerUpSlotUsed(playerId, slot)) return false;
    if (room.powerUps[playerId]?.used.values.contains(questionIndex) ?? false) {
      return false;
    }
    if (room.currentIndex != questionIndex) return false;

    final question = room.currentQuestion;
    if (question == null || question.index != questionIndex) return false;
    if (nowMs < question.answerOpensAt) return false;
    if (nowMs > question.endsAt) return false;
    return true;
  }
}

class LastWinner {
  LastWinner({
    required this.playerId,
    required this.name,
    required this.avatar,
  });

  final String playerId;
  final String name;
  final int avatar;

  factory LastWinner.fromMap(Map<dynamic, dynamic> map) {
    return LastWinner(
      playerId: '${map['playerId'] ?? ''}',
      name: '${map['name'] ?? ''}',
      avatar: ((map['avatar'] as num?)?.toInt() ?? 0).clamp(0, avatarCount - 1),
    );
  }
}

/// Rules for whether a mobile client may submit an answer to Firebase.
class AnswerSubmissionPolicy {
  AnswerSubmissionPolicy._();

  static bool canSubmit({
    required RoomState room,
    required String playerId,
    required int questionIndex,
    required int choice,
    required int nowMs,
  }) {
    if (room.phase != 'question') return false;
    if (room.currentIndex != questionIndex) return false;
    if (room.player(playerId) == null) return false;
    if (choice < 0 || choice > 3) return false;

    final question = room.currentQuestion;
    if (question == null || question.index != questionIndex) return false;
    if (nowMs < question.answerOpensAt) return false;
    if (nowMs > question.endsAt) return false;

    return true;
  }
}

/// Rules for whether a persisted mobile session should resume.
class RoomSessionPolicy {
  RoomSessionPolicy._();

  /// Orphan rooms should not trap phones after long idle periods.
  static const roomMaxAgeMs = 4 * 60 * 60 * 1000;

  /// Allow brief reconnects after the timer hits zero while the host reveals.
  static const questionStaleGraceMs = 60 * 1000;

  /// Reveal should advance quickly; long hangs mean the host is gone.
  static const revealStaleGraceMs = 60 * 1000;

  static bool canResume(RoomState room, String playerId, int nowMs) {
    if (room.player(playerId) == null) return false;
    if (nowMs - room.createdAt > roomMaxAgeMs) return false;
    return !isStalePlayState(room, nowMs);
  }

  static bool isStalePlayState(RoomState room, int nowMs) {
    if (room.phase != 'question' && room.phase != 'reveal') return false;

    final question = room.currentQuestion;
    // During host transitions the currentQuestion may be null for a brief
    // moment (Firebase delivers multi-field updates non-atomically).  Treat
    // this as a transient state — NOT stale.  The next snapshot will carry
    // the real question data.
    if (question == null) return false;

    final graceMs = room.phase == 'reveal'
        ? revealStaleGraceMs
        : questionStaleGraceMs;
    return nowMs > question.endsAt + graceMs;
  }
}

class RoomState {
  RoomState({
    required this.code,
    required this.phase,
    required this.createdAt,
    required this.currentIndex,
    required this.totalQuestions,
    required this.players,
    required this.answers,
    this.currentQuestion,
    this.correctIndex,
    this.lastWinners = const [],
    this.roundTied = false,
    this.rematchReady = const {},
    this.expiresAt = 0,
    this.hostGoneAt,
    this.powerUpSlots = const <String?>[null, null, null],
    this.powerUps = const <String, PlayerPowerUps>{},
    this.powerUpRequests = const <String, PowerUpRequest>{},
  });

  final String code;
  final String phase;
  final int createdAt;
  final int currentIndex;
  final int totalQuestions;
  final PublicQuestion? currentQuestion;
  final int? correctIndex;
  final List<LastWinner> lastWinners;
  final bool roundTied;
  final Map<String, RoomPlayer> players;
  final Map<String, Map<String, Map<dynamic, dynamic>>> answers;
  final Map<String, bool> rematchReady;
  final int expiresAt;
  final int? hostGoneAt;
  final List<String?> powerUpSlots;
  final Map<String, PlayerPowerUps> powerUps;
  final Map<String, PowerUpRequest> powerUpRequests;

  bool get hasPowerUps => powerUpSlots.any((slot) => slot != null);

  List<int> eliminatedChoices(String playerId) {
    if (currentIndex < 0) return const [];
    return powerUps[playerId]?.eliminated[currentIndex] ?? const [];
  }

  bool powerUpSlotUsed(String playerId, int slot) =>
      powerUps[playerId]?.used.containsKey(slot) ?? false;

  /// Room lifetime from createdAt before expiry. Mirrors ROOM_TTL_MS on web.
  static const roomTtlMs = 48 * 60 * 60 * 1000;

  /// Grace after host disconnect before an abandoned room is reap-eligible.
  /// Mirrors HOST_GONE_GRACE_MS on web.
  static const hostGoneGraceMs = 30 * 60 * 1000;

  /// True when the room should be deleted: past TTL, or host gone too long.
  /// Web sets [expiresAt]; legacy rooms without it fall back to [createdAt] TTL.
  bool isDead(int nowMs) {
    final effectiveExpiry = expiresAt > 0 ? expiresAt : createdAt + roomTtlMs;
    if (nowMs > effectiveExpiry) return true;
    if (hostGoneAt != null && nowMs - hostGoneAt! > hostGoneGraceMs) return true;
    return false;
  }

  factory RoomState.fromSnapshot(String code, Map<dynamic, dynamic> map) {
    final playersRaw = map['players'];
    final players = <String, RoomPlayer>{};
    if (playersRaw is Map) {
      playersRaw.forEach((key, value) {
        if (value is Map) {
          players['$key'] = RoomPlayer.fromMap('$key', value);
        }
      });
    }

    final answersRaw = map['answers'];
    final answers = <String, Map<String, Map<dynamic, dynamic>>>{};
    if (answersRaw is Map) {
      answersRaw.forEach((qKey, byPlayer) {
        if (byPlayer is Map) {
          final nested = <String, Map<dynamic, dynamic>>{};
          byPlayer.forEach((pKey, ans) {
            if (ans is Map) nested['$pKey'] = Map<dynamic, dynamic>.from(ans);
          });
          answers['$qKey'] = nested;
        }
      });
    }

    PublicQuestion? question;
    final cq = map['currentQuestion'];
    if (cq is Map) {
      question = PublicQuestion.fromMap(cq);
    }

    final correct = map['correctIndex'];
    final lastWinners = _parseLastWinners(map);

    final config = map['config'];
    final powerUpSlots = parsePowerUpSlots(
      config is Map ? config['powerUpSlots'] : null,
    );

    final rematchReady = <String, bool>{};
    final rr = map['rematchReady'];
    if (rr is Map) {
      rr.forEach((key, value) {
        if (value == true) rematchReady['$key'] = true;
      });
    }

    return RoomState(
      code: code,
      phase: '${map['phase'] ?? 'lobby'}',
      createdAt: (map['createdAt'] as num?)?.toInt() ?? 0,
      currentIndex: (map['currentIndex'] as num?)?.toInt() ?? -1,
      totalQuestions: (map['totalQuestions'] as num?)?.toInt() ?? 0,
      currentQuestion: question,
      correctIndex: correct == null ? null : (correct as num).toInt(),
      lastWinners: lastWinners,
      roundTied: map['roundTied'] == true,
      players: players,
      answers: answers,
      rematchReady: rematchReady,
      expiresAt: (map['expiresAt'] as num?)?.toInt() ?? 0,
      hostGoneAt: (map['hostGoneAt'] as num?)?.toInt(),
      powerUpSlots: powerUpSlots,
      powerUps: parsePowerUps(map['powerUps']),
      powerUpRequests: parsePowerUpRequests(map['powerUpRequests']),
    );
  }

  bool isRematchReady(String playerId) => rematchReady[playerId] == true;

  bool hasAnswered(String playerId) {
    if (currentIndex < 0) return false;
    final bucket = answers['$currentIndex'];
    return bucket != null && bucket.containsKey(playerId);
  }

  int? choiceOf(String playerId) {
    if (currentIndex < 0) return null;
    final ans = answers['$currentIndex']?[playerId];
    if (ans == null) return null;
    return (ans['choice'] as num?)?.toInt();
  }

  RoomPlayer? player(String id) => players[id];

  List<RoomPlayer> ranked() {
    final list = players.values.toList()
      ..sort((a, b) {
        final byScore = b.score.compareTo(a.score);
        if (byScore != 0) return byScore;
        final byLastPoint = b.lastScoredAt.compareTo(a.lastScoredAt);
        if (byLastPoint != 0) return byLastPoint;
        return a.joinedAt.compareTo(b.joinedAt);
      });
    return list;
  }
}

List<LastWinner> _parseLastWinners(Map<dynamic, dynamic> map) {
  final list = map['lastWinners'];
  if (list is List) {
    return list
        .whereType<Map>()
        .map((item) => LastWinner.fromMap(item))
        .toList();
  }
  final lw = map['lastWinner'];
  if (lw is Map) {
    return [LastWinner.fromMap(lw)];
  }
  return [];
}
