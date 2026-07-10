class PublicQuestion {
  PublicQuestion({
    required this.id,
    required this.type,
    required this.category,
    required this.difficulty,
    required this.prompt,
    required this.options,
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
    return PublicQuestion(
      id: '${map['id'] ?? ''}',
      type: '${map['type'] ?? 'mcq'}',
      category: '${map['category'] ?? ''}',
      difficulty: '${map['difficulty'] ?? ''}',
      prompt: '${map['prompt'] ?? ''}',
      options: options,
      imageUrl: map['imageUrl']?.toString(),
      endsAt: (map['endsAt'] as num?)?.toInt() ?? 0,
      durationMs: (map['durationMs'] as num?)?.toInt() ?? 15000,
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
  });

  final String id;
  final String name;
  final int score;
  final int avatar;
  final int joinedAt;

  factory RoomPlayer.fromMap(String id, Map<dynamic, dynamic> map) {
    return RoomPlayer(
      id: '${map['id'] ?? id}',
      name: '${map['name'] ?? 'Player'}',
      score: (map['score'] as num?)?.toInt() ?? 0,
      avatar: ((map['avatar'] as num?)?.toInt() ?? 0).clamp(0, 7),
      joinedAt: (map['joinedAt'] as num?)?.toInt() ?? 0,
    );
  }
}

class RoomState {
  RoomState({
    required this.code,
    required this.phase,
    required this.currentIndex,
    required this.totalQuestions,
    required this.players,
    required this.answers,
    this.currentQuestion,
    this.correctIndex,
    this.prepareEndsAt,
  });

  final String code;
  final String phase;
  final int currentIndex;
  final int totalQuestions;
  final PublicQuestion? currentQuestion;
  final int? correctIndex;
  final int? prepareEndsAt;
  final Map<String, RoomPlayer> players;
  final Map<String, Map<String, Map<dynamic, dynamic>>> answers;

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
    final prepare = map['prepareEndsAt'];

    return RoomState(
      code: code,
      phase: '${map['phase'] ?? 'lobby'}',
      currentIndex: (map['currentIndex'] as num?)?.toInt() ?? -1,
      totalQuestions: (map['totalQuestions'] as num?)?.toInt() ?? 0,
      currentQuestion: question,
      correctIndex: correct == null ? null : (correct as num).toInt(),
      prepareEndsAt: prepare == null ? null : (prepare as num).toInt(),
      players: players,
      answers: answers,
    );
  }

  bool hasAnswered(String playerId) {
    if (currentIndex < 0) return false;
    final bucket = answers['$currentIndex'];
    return bucket != null && bucket.containsKey(playerId);
  }

  RoomPlayer? player(String id) => players[id];
}
