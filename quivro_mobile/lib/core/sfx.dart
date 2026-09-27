import 'package:audioplayers/audioplayers.dart';

/// Short UI sound effects for the answer pad.
class Sfx {
  Sfx();

  final AudioPlayer _guess = AudioPlayer();
  final AudioPlayer _fifty = AudioPlayer();
  bool _ready = false;

  Future<void> preload() async {
    if (_ready) return;
    await _guess.setReleaseMode(ReleaseMode.stop);
    await _guess.setSource(AssetSource('sounds/guess_answer.mp3'));
    await _fifty.setReleaseMode(ReleaseMode.stop);
    await _fifty.setSource(AssetSource('sounds/50_50_power_up.mp3'));
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

  Future<void> playFiftyFifty() async {
    try {
      if (!_ready) await preload();
      await _fifty.stop();
      await _fifty.seek(Duration.zero);
      await _fifty.resume();
    } catch (_) {
      // Ignore audio failures — gameplay must continue.
    }
  }

  Future<void> dispose() async {
    await _guess.dispose();
    await _fifty.dispose();
  }
}
