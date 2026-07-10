# Quivro Web

Kahoot-style host app for TV: create rounds, show questions, track a live leaderboard. Players join from the Quivro Flutter app.

## Run

```bash
cd quivro_web
npm install
npm start
```

Open http://localhost:4200

## Deploy (Vercel)

This app is configured for Vercel via [`vercel.json`](vercel.json) (SPA rewrites + `dist/web/browser` output).

1. Push the repo to GitHub / GitLab / Bitbucket.
2. In [Vercel](https://vercel.com/new), **Import** the repo.
3. Set **Root Directory** to `quivro_web` (required — this is a monorepo).
4. Leave Build Command / Output Directory as detected from `vercel.json`.
5. Deploy.

Or from this folder with the CLI:

```bash
cd quivro_web
npx vercel
```

After deploy, add your Vercel domain (e.g. `your-app.vercel.app`) under Firebase Console → Authentication → Settings → Authorized domains if you use Firebase Auth later. Realtime Database already works from any origin with your current open rules.

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
