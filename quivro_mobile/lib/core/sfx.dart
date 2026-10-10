import 'package:audioplayers/audioplayers.dart';

/// Short UI sound effects for the answer pad.
class Sfx {
  Sfx();

  final AudioPlayer _guess = AudioPlayer();
  final AudioPlayer _double = AudioPlayer();
  final AudioPlayer _fifty = AudioPlayer();
  final AudioPlayer _second = AudioPlayer();
  final AudioPlayer _secondCorrect = AudioPlayer();
  final AudioPlayer _secondWrong = AudioPlayer();
  final AudioPlayer _lock = AudioPlayer();
  final AudioPlayer _locked = AudioPlayer();
  bool _ready = false;

  Future<void> preload() async {
    if (_ready) return;
    await _guess.setReleaseMode(ReleaseMode.stop);
    await _guess.setSource(AssetSource('sounds/guess_answer.mp3'));
    await _fifty.setReleaseMode(ReleaseMode.stop);
    await _fifty.setSource(AssetSource('sounds/50_50_power_up.mp3'));
    await _second.setReleaseMode(ReleaseMode.stop);
    await _second.setSource(AssetSource('sounds/second_chance.mp3'));
    await _secondCorrect.setReleaseMode(ReleaseMode.stop);
    await _secondCorrect.setSource(
      AssetSource('sounds/second_chance_correct.mp3'),
    );
    await _secondWrong.setReleaseMode(ReleaseMode.stop);
    await _secondWrong.setSource(
      AssetSource('sounds/second_chance_incorrect.mp3'),
    );
    await _lock.setReleaseMode(ReleaseMode.stop);
    await _lock.setSource(AssetSource('sounds/lock_up.mp3'));
    await _locked.setReleaseMode(ReleaseMode.stop);
    await _locked.setSource(AssetSource('sounds/lock_up_player.mp3'));
    await _double.setReleaseMode(ReleaseMode.stop);
    await _double.setSource(AssetSource('sounds/double_up.mp3'));
    _ready = true;
  }

  Future<void> playDoubleIt() => _play(_double);

  Future<void> playGuess() async {
    await _play(_guess);
  }

  Future<void> playFiftyFifty() async {
    await _play(_fifty);
  }

  Future<void> playSecondChance() async {
    await _play(_second);
  }

  Future<void> playSecondCorrect() async {
    await _play(_secondCorrect);
  }

  Future<void> playSecondWrong() async {
    await _play(_secondWrong);
  }

  Future<void> playLockUp() async {
    await _play(_lock);
  }

  Future<void> playLockedOut() async {
    await _play(_locked);
  }

  Future<void> _play(AudioPlayer player) async {
    try {
      if (!_ready) await preload();
      await player.stop();
      await player.seek(Duration.zero);
      await player.resume();
    } catch (_) {
      // Ignore audio failures — gameplay must continue.
    }
  }

  Future<void> dispose() async {
    await _double.dispose();
    await _guess.dispose();
    await _fifty.dispose();
    await _second.dispose();
    await _secondCorrect.dispose();
    await _secondWrong.dispose();
    await _lock.dispose();
    await _locked.dispose();
  }
}
