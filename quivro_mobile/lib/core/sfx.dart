import 'package:audioplayers/audioplayers.dart';

/// Short UI sound effects for the answer pad and timer.
class Sfx {
  Sfx();

  final AudioPlayer _guess = AudioPlayer();
  final AudioPlayer _tick = AudioPlayer();
  bool _ready = false;
  bool _tickPlaying = false;

  Future<void> preload() async {
    if (_ready) return;
    await _guess.setReleaseMode(ReleaseMode.stop);
    await _guess.setSource(AssetSource('sounds/guess_answer.mp3'));
    await _tick.setReleaseMode(ReleaseMode.stop);
    await _tick.setSource(AssetSource('sounds/tick_tick.mp3'));
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

  Future<void> startTick() async {
    if (_tickPlaying) return;
    try {
      if (!_ready) await preload();
      _tickPlaying = true;
      await _tick.stop();
      await _tick.seek(Duration.zero);
      await _tick.resume();
    } catch (_) {
      _tickPlaying = false;
    }
  }

  Future<void> stopTick() async {
    if (!_tickPlaying && !_ready) return;
    _tickPlaying = false;
    try {
      await _tick.stop();
    } catch (_) {
      // Ignore audio failures.
    }
  }

  Future<void> dispose() async {
    await stopTick();
    await _guess.dispose();
    await _tick.dispose();
  }
}
