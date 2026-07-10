# Quivro Mobile

Flutter player client: set nickname + avatar, join a host room by code, tap A/B/C/D.

## Run

```bash
cd quivro_mobile
flutter pub get
flutter run
```

## Firebase

Project: `quivro-ca38a`

- Android package: `com.quivro.app`
- Config: [`android/app/google-services.json`](android/app/google-services.json)
- Dart options: [`lib/firebase_options.dart`](lib/firebase_options.dart)

Realtime Database rules must allow `rooms` read/write (same as web).

## Flow

1. First launch → nickname + avatar (saved locally)
2. Enter TV join code → lobby “waiting for host”
3. Host starts → full-screen A/B/C/D pad + timer
4. Score shown when the round finishes

## Notes

- Option text is shown on the TV; phones show colored letters only
- Player field on Firebase: `{ id, name, score, avatar, joinedAt }`
