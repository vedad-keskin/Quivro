# Quivro Monetization and Google Play Launch

Living document. Update the status table at the end of every phase.

## The model

| | Where | Sells anything? |
|---|---|---|
| `quivro_web` | Host / TV dashboard. Creates rooms, owns all round config, bundles the question bank. | Yes — Quivro Pro, one-time, via Lemon Squeezy |
| `quivro_mobile` | Player controller. Joins by code, taps A/B/C/D. | No. Never. |

The mobile app can only `joinRoom`; it has no question bank and no round configuration. So the paywall is entirely on web, and the Play Store app sells nothing.

**Hard rule: the mobile app must never mention Pro, display a locked feature, or link to checkout.** Google Play's payments policy governs digital goods sold inside the app. A free companion controller that sells nothing and links nowhere is clean. Breaking this rule is what forces a migration to Google Play Billing, which is not available for merchants in Bosnia.

## Free vs Pro split

Defined in one place: `quivro_web/src/app/core/entitlements.ts`.

Price: **EUR 4.99**, one-time, lifetime.

| Feature | Free | Pro |
|---|---|---|
| Categories | Geography, Biology, Technology, History, Sports | All nine |
| Pro categories | Movies & TV, Famous People, Islam, Food & Drinks | |
| Image questions | Locked | Unlocked |
| Round length | 10, 20, 30 | Adds 50 and custom up to 100 |
| Scoring mode | Standard (+1 each) | Adds Timed (speed bonus) |
| Question timer | All options (10/15/20/30, custom 5-60s) | Same |
| Custom questions (`/admin/questions`) | Available | Same |
| Rotating free category | One Pro category free each week | n/a |

The rotation flips Monday 00:00 UTC and cycles Movies, Famous, Islam, Food. It is derived
from the UTC week number, so every host worldwide sees the same category with no storage
and no server call.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Living plan doc | Done |
| 2 | Firebase Auth on web | Code done, blocked on M1 + M2 |
| 3 | Entitlement service + `firestore.rules` | Code done, blocked on M3 + M3b |
| 4 | Paywall UI, upgrade dialog, `/unlocked`, `createRoom` clamp | Not started |
| 5 | Lemon Squeezy product + `/api/webhook` | Not started |
| 6 | Legal pages (privacy, terms, refunds) | Not started |
| 7 | Google Play release | Not started |
| 8 | Move Pro question bank out of the browser bundle (optional) | Not started |

## Manual tasks

Things only you can do. Marked done as they are completed.

| # | Task | Phase | Status |
|---|---|---|---|
| M1 | Enable Google sign-in provider in Firebase Console | 2 | Pending |
| M2 | Add authorized domains in Firebase Console | 2 | Pending |
| M3 | Enable Firestore in the `quivro-ca38a` project | 3 | Pending |
| M3b | Deploy `firestore.rules` (`firebase deploy --only firestore:rules`) | 3 | Pending |
| M4 | Create the Quivro Pro product in Lemon Squeezy | 5 | Pending |
| M5 | Create the Lemon Squeezy webhook + copy signing secret | 5 | Pending |
| M6 | Generate a Firebase service account key | 5 | Pending |
| M7 | Set Vercel environment variables | 5 | Pending |
| M8 | Generate the Android upload keystore | 7 | Pending |
| M9 | Create the Play Console app and store listing | 7 | Pending |

## Reference

**Firebase project:** `quivro-ca38a` (one project, both RTDB and Firestore)

**Vercel environment variables** (Phase 5):

- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Lemon Squeezy** (fill in during Phase 5):

- Store slug: TBD
- Variant ID: TBD
- Price: TBD
- Redirect URL: `https://<domain>/unlocked`
- Webhook URL: `https://<domain>/api/webhook`
- Events: `order_created` only

**Firestore document** written by the webhook at `purchases/{firebaseUid}`:

| Field | Type |
|---|---|
| `uid` | string |
| `email` | string |
| `orderId` | string |
| `totalFormatted` | string |
| `active` | boolean |
| `source` | string, `'lemonsqueezy'` |
| `purchaseDate` | timestamp |

## Known limitation

Phases 2-7 gate client-side, so the bundled question bank stays readable in devtools and Pro is a convenience unlock rather than locked content. Phase 8 closes this by moving the Pro category files into the serverless function bundle behind a token check. Everything upstream is identical either way.
