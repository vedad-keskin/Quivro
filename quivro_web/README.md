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

This is a monorepo. Deploy from the **repo root** (uses root [`vercel.json`](../vercel.json)) or set Vercel **Root Directory** to `quivro_web`.

1. Push the repo to GitHub / GitLab / Bitbucket.
2. In [Vercel](https://vercel.com/new), **Import** the Quivro repo.
3. Leave Root Directory empty (root `vercel.json` handles `quivro_web`), **or** set Root Directory to `quivro_web`.
4. Deploy.

Or from the web app folder with the CLI:

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
- Text MCQs in `src/data/questions/mcq/{category}/{easy|medium|hard}.ts`
- Image MCQs in `src/data/questions/image_mcq/{category}/{easy|medium|hard}.ts` (1 per category × difficulty; placeholder SVGs for now)
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
  data/questions/
    mcq/              # text questions by category × difficulty
    image_mcq/        # picture questions (1 per category × difficulty)
  i18n/               # EN / BS UI strings
  environments/       # Firebase config
```
