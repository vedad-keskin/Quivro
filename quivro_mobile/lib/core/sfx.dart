import 'package:audioplayers/audioplayers.dart';

/// Short UI sound effects for the answer pad.
class Sfx {
  Sfx();

  final AudioPlayer _guess = AudioPlayer();
  bool _ready = false;

  Future<void> preload() async {
    if (_ready) return;
    await _guess.setReleaseMode(ReleaseMode.stop);
    await _guess.setSource(AssetSource('sounds/guess_answer.mp3'));
    _ready = true;
  }

  Future<void> playGuess() async {
    try {
      if (!_ready) await preload();
      await _guess.stop();
      await _guess.seek(Duration.zero);
      await _guess.resume();
    } catch (_) {
      // Ignore audio failures — gameplay must continue.
    }
  }

  Future<void> dispose() async {
    await _guess.dispose();
  }
}
