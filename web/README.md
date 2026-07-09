# Quivro Web

Kahoot-style host app for TV: create rounds, show questions, track a live leaderboard. Mobile (Flutter) comes later; use **Test Mode** to play without phones.

## Run

```bash
cd web
npm install
npm start
```

Open http://localhost:4200

## Features (v1)

- Create round: pick categories (Geography, Biology, Gaming, History), length (10/15/20/30 or custom), EN/BS
- Lobby with join code + test players
- Play screen with timer, 4-color answers, side leaderboard
- Question types: classic MCQ + image MCQ
- Questions live in `src/data/questions/{category}/{easy|medium|hard}.ts`
- Add Questions UI stores extras in `localStorage` (export JSON to merge into repo later)
- Firebase Realtime Database for live rooms when configured; otherwise local in-memory rooms for testing

## Firebase setup (fill placeholders)

Edit [`src/environments/environment.ts`](src/environments/environment.ts):

1. Create a project at https://console.firebase.google.com (Spark / free)
2. Add a **Web** app and copy the config object
3. Enable **Realtime Database** (start in test mode for local parties)
4. Paste values into `environment.firebase` (especially `databaseURL` with region)
5. Suggested rules for party-mode v1 (insecure — tighten when you add auth):

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

Until real keys are set, the app still works in **local room** mode (banner on lobby).

## Test without mobile

1. Home → **Test Mode** (or Create Round → Add test players)
2. Start game
3. On the play screen, use **Answer as** + the dashed answer pad to submit for each test player
4. Optional: enable **Auto-answer bots**

## Project layout

```
web/src/
  app/core/           # Firebase, room, language, question bank, round generator
  app/features/       # home, create, lobby, play, admin, test
  app/shared/         # leaderboard, answers, timer, lang toggle
  data/questions/     # seeded bilingual question banks
  i18n/               # EN / BS UI strings
  environments/       # Firebase config placeholders
```
