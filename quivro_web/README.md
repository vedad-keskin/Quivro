# Quivro Web

Kahoot-style host app for TV: create rounds, show questions, track a live leaderboard. Players join from the Quivro Flutter app.

## Run

```bash
cd quivro_web
npm install
npm start
```

Open http://localhost:4200

## Features

- Create round: categories (Geography, Biology, Gaming, History), length (10/15/20/30 or custom), EN/BS
- Lobby with join code; players join from mobile
- Play screen with timer, 4-color answers, side leaderboard with avatars
- Question types: classic MCQ + image MCQ
- Questions in `src/data/questions/{category}/{easy|medium|hard}.ts`
- Add Questions UI → `localStorage` overlay + JSON export
- Firebase Realtime Database required for live rooms

## Firebase

Config lives in [`src/environments/environment.ts`](src/environments/environment.ts).

Realtime Database rules (party-mode v1):

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Project layout

```
quivro_web/src/
  app/core/           # Firebase, room, language, question bank, round generator
  app/features/       # home, create, lobby, play, admin
  app/shared/         # leaderboard, answers, timer, lang toggle
  data/questions/     # seeded bilingual question banks
  i18n/               # EN / BS UI strings
  environments/       # Firebase config
```
