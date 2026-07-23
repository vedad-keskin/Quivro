import 'package:flutter/widgets.dart';
import 'settings.dart';

/// All user-facing UI strings, per language. Terminology mirrors the web
/// app's `i18n/bs.ts` so both clients speak the same "Quivro Bosnian".
class AppStrings {
  const AppStrings({
    required this.tagline,
    required this.splashTaglines,
    required this.offlineContinuing,
    required this.bootErrorTitle,
    required this.bootErrorBody,
    required this.tryAgain,
    required this.offline,
    required this.online,
    required this._playingAs,
    required this.joinARoom,
    required this.codeHint,
    required this.joining,
    required this.join,
    required this.editNicknameAvatar,
    required this.enterRoomCode,
    required this.roomNotFound,
    required this.gameInProgress,
    required this.couldNotJoin,
    required this.rejoiningRoom,
    required this.cancel,
    required this.chooseNicknameAvatar,
    required this.nickname,
    required this.saving,
    required this.continueLabel,
    required this.enterNickname,
    required this.roomEnded,
    required this.roomClosed,
    required this.connectionLost,
    required this.leaveGameTitle,
    required this.leaveGameBody,
    required this.leave,
    required this.couldNotSendAnswer,
    required this.couldNotJoinRematch,
    required this._connectionError,
    required this.connecting,
    required this.roundStartedWithoutYou,
    required this.room,
    required this.waitingForHost,
    required this._questionCounter,
    required this.quit,
    required this.tvBadge,
    required this.lockedBadge,
    required this.lookAtTv,
    required this.tapToChange,
    required this.answersLocked,
    required this.finalLeaderboard,
    required this.winnerPrefix,
    required this.tiedWinners,
    required this._winsShort,
    required this.rematchOptedIn,
    required this.ready,
    required this.joiningRematch,
    required this.playAgain,
    required this.home,
    required this.language,
    required this.chooseLanguage,
    required this.themeDay,
    required this.themeNight,
  });

  // Splash.
  final String tagline;
  final List<String> splashTaglines;
  final String offlineContinuing;
  final String bootErrorTitle;
  final String bootErrorBody;
  final String tryAgain;

  // Connectivity chip.
  final String offline;
  final String online;

  // Home.
  final String _playingAs;
  final String joinARoom;
  final String codeHint;
  final String joining;
  final String join;
  final String editNicknameAvatar;
  final String enterRoomCode;
  final String roomNotFound;
  final String gameInProgress;
  final String couldNotJoin;
  final String rejoiningRoom;

  // Setup.
  final String cancel;
  final String chooseNicknameAvatar;
  final String nickname;
  final String saving;
  final String continueLabel;
  final String enterNickname;

  // Room.
  final String roomEnded;
  final String roomClosed;
  final String connectionLost;
  final String leaveGameTitle;
  final String leaveGameBody;
  final String leave;
  final String couldNotSendAnswer;
  final String couldNotJoinRematch;
  final String _connectionError;
  final String connecting;
  final String roundStartedWithoutYou;
  final String room;
  final String waitingForHost;
  final String _questionCounter;
  final String quit;
  final String tvBadge;
  final String lockedBadge;
  final String lookAtTv;
  final String tapToChange;
  final String answersLocked;
  final String finalLeaderboard;
  final String winnerPrefix;
  final String tiedWinners;
  final String _winsShort;
  final String rematchOptedIn;
  final String ready;
  final String joiningRematch;
  final String playAgain;
  final String home;

  // Settings.
  final String language;
  final String chooseLanguage;
  final String themeDay;
  final String themeNight;

  String playingAs(String name) => _playingAs.replaceAll('{name}', name);

  String connectionError(Object error) =>
      _connectionError.replaceAll('{error}', '$error');

  String questionCounter(int number, int total) => _questionCounter
      .replaceAll('{n}', '$number')
      .replaceAll('{total}', '$total');

  String winsShort(int wins) => _winsShort.replaceAll('{n}', '$wins');

  static AppStrings forLanguage(AppLanguage language) =>
      language == AppLanguage.bs ? bosnian : english;

  static const english = AppStrings(
    tagline: 'The party quiz game',
    splashTaglines: [
      'Sharpening pencils…',
      'Shuffling questions…',
      'Warming up the buzzers…',
      'Polishing trophies…',
      'Herding quiz masters…',
      'Counting brain cells…',
    ],
    offlineContinuing: 'No internet — continuing offline',
    bootErrorTitle: 'Something went wrong',
    bootErrorBody: "We couldn't get Quivro started.",
    tryAgain: 'Try again',
    offline: 'Offline',
    online: 'Online',
    playingAs: 'Playing as {name}',
    joinARoom: 'Join a room',
    codeHint: 'CODE',
    joining: 'Joining…',
    join: 'Join',
    editNicknameAvatar: 'Edit nickname & avatar',
    enterRoomCode: 'Enter the room code',
    roomNotFound: 'Room not found. Check the code on the TV.',
    gameInProgress: 'Game already in progress. Wait for the next round.',
    couldNotJoin: 'Could not join. Check your connection.',
    rejoiningRoom: 'Rejoining your room…',
    cancel: 'Cancel',
    chooseNicknameAvatar: 'Choose a nickname & avatar',
    nickname: 'Nickname',
    saving: 'Saving…',
    continueLabel: 'Continue',
    enterNickname: 'Enter a nickname',
    roomEnded: 'This room has ended',
    roomClosed: 'Room closed',
    connectionLost: 'Connection lost',
    leaveGameTitle: 'Leave this game?',
    leaveGameBody: 'You will be removed from the room.',
    leave: 'Leave',
    couldNotSendAnswer: 'Could not send answer',
    couldNotJoinRematch: 'Could not join rematch',
    connectionError: 'Connection error: {error}',
    connecting: 'Connecting…',
    roundStartedWithoutYou: 'Round started without you',
    room: 'Room',
    waitingForHost: 'Waiting for the host to start…',
    questionCounter: 'Q {n} / {total}',
    quit: 'Quit',
    tvBadge: 'TV',
    lockedBadge: 'Locked',
    lookAtTv: 'Look at the TV…',
    tapToChange: 'Tap another answer to change',
    answersLocked: 'Answers locked',
    finalLeaderboard: 'Final leaderboard',
    winnerPrefix: 'Winner: ',
    tiedWinners: 'Tied winners:',
    winsShort: '{n}W',
    rematchOptedIn: "You're in for another round — waiting for the host…",
    ready: 'Ready!',
    joiningRematch: 'Joining…',
    playAgain: 'Play again',
    home: 'Home',
    language: 'Language',
    chooseLanguage: 'Choose language',
    themeDay: 'Day',
    themeNight: 'Night',
  );

  static const bosnian = AppStrings(
    tagline: 'Kviz za cijelu ekipu',
    splashTaglines: [
      'Oštrimo olovke…',
      'Miješamo pitanja…',
      'Zagrijavamo tastere…',
      'Poliramo pehare…',
      'Skupljamo kvizadžije…',
      'Brojimo moždane ćelije…',
    ],
    offlineContinuing: 'Nema interneta — nastavljamo offline',
    bootErrorTitle: 'Nešto je pošlo po zlu',
    bootErrorBody: 'Nismo uspjeli pokrenuti Quivro.',
    tryAgain: 'Pokušaj ponovo',
    offline: 'Offline',
    online: 'Online',
    playingAs: 'Igraš kao {name}',
    joinARoom: 'Pridruži se sobi',
    codeHint: 'KOD',
    joining: 'Pridruživanje…',
    join: 'Pridruži se',
    editNicknameAvatar: 'Uredi nadimak i avatar',
    enterRoomCode: 'Unesi kod sobe',
    roomNotFound: 'Soba nije pronađena. Provjeri kod na TV-u.',
    gameInProgress: 'Igra je već u toku. Sačekaj sljedeću rundu.',
    couldNotJoin: 'Pridruživanje nije uspjelo. Provjeri konekciju.',
    rejoiningRoom: 'Vraćamo te u sobu…',
    cancel: 'Otkaži',
    chooseNicknameAvatar: 'Odaberi nadimak i avatar',
    nickname: 'Nadimak',
    saving: 'Snimanje…',
    continueLabel: 'Nastavi',
    enterNickname: 'Unesi nadimak',
    roomEnded: 'Ova soba je završena',
    roomClosed: 'Soba je zatvorena',
    connectionLost: 'Veza je prekinuta',
    leaveGameTitle: 'Napustiti igru?',
    leaveGameBody: 'Bit ćeš uklonjen iz sobe.',
    leave: 'Napusti',
    couldNotSendAnswer: 'Slanje odgovora nije uspjelo',
    couldNotJoinRematch: 'Prijava za novu rundu nije uspjela',
    connectionError: 'Greška u konekciji: {error}',
    connecting: 'Povezivanje…',
    roundStartedWithoutYou: 'Runda je počela bez tebe',
    room: 'Soba',
    waitingForHost: 'Čeka se da početak runde…',
    questionCounter: 'P {n} / {total}',
    quit: 'Izađi',
    tvBadge: 'TV',
    lockedBadge: 'Zaključano',
    lookAtTv: 'Pogledaj na TV…',
    tapToChange: 'Dodirni drugi odgovor za promjenu',
    answersLocked: 'Odgovori su zaključani',
    finalLeaderboard: 'Konačna rang lista',
    winnerPrefix: 'Pobjednik: ',
    tiedWinners: 'Neriješeno — pobjednici:',
    winsShort: '{n}P',
    rematchOptedIn: 'Prijavljen si za novu rundu — čeka se start…',
    ready: 'Spreman!',
    joiningRematch: 'Prijava…',
    playAgain: 'Igraj ponovo',
    home: 'Početna',
    language: 'Jezik',
    chooseLanguage: 'Odaberi jezik',
    themeDay: 'Dan',
    themeNight: 'Noć',
  );
}

extension StringsX on BuildContext {
  /// Strings for the currently selected language. Reading this also
  /// subscribes the widget to language changes.
  AppStrings get strings => AppStrings.forLanguage(Settings.of(this).language);
}
