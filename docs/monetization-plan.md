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
| Rotating free category | One Pro category free each week | n/a |

The rotation flips Monday 00:00 UTC and cycles Movies, Famous, Islam, Food. It is derived
from the UTC week number, so every host worldwide sees the same category with no storage
and no server call.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Living plan doc | Done |
| 2 | Firebase Auth on web | Done |
| 3 | Entitlement service + `firestore.rules` | Done |
| 4 | Paywall UI, upgrade dialog, `/unlocked`, `createRoom` clamp | Done |
| 5 | Lemon Squeezy product + `/api/webhook` | Done, verified in production |
| 6 | Legal pages (privacy, terms, refunds) | Not started |
| 7 | Google Play release | Not started |
| 8 | Move Pro question bank out of the browser bundle (optional) | Not started |

## Manual tasks

Things only you can do. Marked done as they are completed.

| # | Task | Phase | Status |
|---|---|---|---|
| M1 | Enable Google sign-in provider in Firebase Console | 2 | Done |
| M2 | Add authorized domains in Firebase Console | 2 | Done |
| M3 | Enable Firestore in the `quivro-ca38a` project | 3 | Done |
| M3b | Deploy `firestore.rules` (`firebase deploy --only firestore:rules`) | 3 | Done |
| M4 | Create the Quivro Pro product in Lemon Squeezy | 5 | Done |
| M5 | Create the Lemon Squeezy webhook + copy signing secret | 5 | Done (secret needs replacing) |
| M6 | Generate a Firebase service account key | 5 | Done |
| M7 | Set Vercel environment variables | 5 | Done (Production scope) |
| M8 | Generate the Android upload keystore | 7 | Pending |
| M9 | Create the Play Console app and store listing | 7 | Pending |

## Reference

**Firebase project:** `quivro-ca38a` (one project, both RTDB and Firestore)

- Firestore database: `(default)`, location `eur3`. The client calls `getFirestore(app)` with
  no database name, which only ever resolves to `(default)`.
- Production domain: `quivro.vercel.app` (authorized for Google sign-in)
- Google sign-in consent screen name: Quivro

The mobile app does **not** use Google Sign-In, so the `google-services.json` in
`quivro_mobile` does not need regenerating when OAuth clients change.

**Vercel environment variables** (Phase 5):

- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Lemon Squeezy** (fill in during Phase 5):

- Store slug: `nightfall-studio` (one studio store holds every product)
- Contact email shown on receipts: `nightfall.project.info@gmail.com`
- Variant ID (live, both env files): `9bf236a7-7cb7-4348-a504-2ff8ef65c902`
- Test-mode variant, kept for a future sandbox run: `184b1101-86a1-4c55-8119-2f8cbb4856f2`
  Checkout is on the live product. A test purchase charges a real card. The test
  webhook, if still enabled, must keep the same signing secret as live.
- Price: EUR 4.99, single payment, tax category "SaaS - personal use"
- Product is hidden from the storefront on purpose: a direct storefront purchase
  carries no `firebase_uid`, so the webhook would 400 and the buyer would get nothing.
- Redirect: hosted checkout links have **no** separate "redirect after purchase" field.
  Per Lemon Squeezy's docs the redirect is the **Confirmation modal -> Button link**, set to
  `quivro.vercel.app/unlocked` (and the same for the Email receipt button). A standalone
  `product_options.redirect_url` exists only for checkouts created through the API.
  It is a button the buyer clicks, not an automatic redirect, which is fine: the webhook
  records the purchase regardless of where the browser goes, and `refresh()` plus the
  Restore link cover anyone who closes the tab.
- Webhook URL: `https://quivro.vercel.app/api/webhook`
- Events: `order_created` and `order_refunded`

**Shared store.** Nightfall sells from the same store and has its own webhook at
`nightfall-project.vercel.app/api/webhook`. Lemon Squeezy delivers every store event to
every webhook in the store, so each endpoint sees the other product's orders:

- Quivro's webhook checks `custom_data.app === 'quivro'` and returns 200 "Not a Quivro
  order" for Nightfall sales, so they do not register as failed deliveries.
- Nightfall's webhook returns `400 Missing google_uid` for Quivro sales. It bails before
  touching Firestore so nothing is corrupted, but every Quivro sale shows as a failed
  delivery in that webhook's log. Adding the same `app` guard there would silence it.

Store slug and the live variant ID are the same in `environment.ts` and
`environment.prod.ts`. `openCheckout()` still returns `false` if the slug still contains `YOUR_`.

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
| `updatedAt` | timestamp |

A refund sets `active: false`, which revokes Pro on the next `refresh()`.

## Branding

The publisher is **Nightfall Studio**, a studio brand that sits above individual games
(Nightfall, Quivro, anything later). One Lemon Squeezy store holds every product, which
keeps merchant onboarding, tax setup and payouts in one place.

| Where | What goes there | Status |
|---|---|---|
| Lemon Squeezy store name | Nightfall Studio | Done |
| Lemon Squeezy store URL | `nightfall-studio.lemonsqueezy.com` | Done |
| Lemon Squeezy store logo | The wolf-and-moon mark | Done |
| Lemon Squeezy currency | EUR | Done |
| Quivro web home footer | "Made by" + wordmark PNG | Done |
| Play Console developer name | Nightfall Studio (account-level) | Phase 7 |
| Privacy policy / terms | Nightfall Studio as named data controller | Phase 6 |

Quivro keeps its own logo and favicon. The studio brand is attribution, not app identity.

### Brand assets

Both source files were **JPEGs with an opaque black background** — including the one named
`.png`, whose magic bytes are `FF D8 FF E0`. JPEG has no alpha channel, so neither could go
on a light surface without a black box. Transparent PNGs were derived with Pillow into
`quivro_web/public/brand/`:

| File | How it was made | Used by |
|---|---|---|
| `nightfall-wordmark.png` (640x195) | Luminance as alpha, glyphs recoloured to `--q-navy`. A black floor of 26 discards JPEG ringing that would otherwise leave the whole canvas faintly opaque. | Home footer |
| `nightfall-mark.png` (512x454) | Flood fill inward from all four corners. A global dark-pixel key would also have erased the tree silhouettes and the wolf's shadows, which are interior shapes. | Store logo, Play listing |

The wordmark is navy so it reads on the light theme, and `filter: invert(1)` in dark mode
turns it back to the cream of the original art — the same trick `home.page.ts` already
uses for the Quivro logo. The full mark is light-on-dark art and suits dark surfaces only.

## Decisions taken along the way

**`/admin/questions` was removed entirely.** It was first left ungated (it only wrote to
`localStorage` under `quivro.questionOverlay`, so there was nothing to protect), then cut
altogether along with the localStorage overlay in `QuestionBankService` and fifteen
admin-only i18n keys. `QuestionBankService` now just returns the seed questions.

**The webhook uses the Web-standard handler signature** (`export function POST(request)`)
rather than Node's `(req, res)`. Vercel populates `req.body` from a getter that consumes
the stream, so the classic signature risks losing the exact bytes the HMAC covers.
`await request.text()` is unambiguous and needs no `bodyParser` config.

**The upgrade dialog is deferred, not eager.** Importing it directly into the app shell
pulled `firebase/auth` into the initial bundle and pushed main from 67 kB to 134 kB
transfer. `UpgradeDialogService` therefore lives in its own file so `app.ts` can hold a
reference while `@defer (when upgrade.open())` keeps the component out of the main
chunk. Main is back to 70 kB; Firestore only loads once a host signs in.

## Production verification (Phase 5)

Run against `https://quivro.vercel.app/api/webhook` after deploying:

| Check | Expected |
|---|---|
| `GET /api/webhook` | `200` with the status JSON. Proves the function deployed, `firebase-admin` installed from the root `package.json`, and the `vercel.json` rewrite is not swallowing `/api/*` into the SPA catch-all. |
| `POST` with a junk `x-signature` | `401 Invalid signature`. A `500 Server not configured` here means an env var is missing or the deploy predates them. |
| `POST` correctly signed, real uid | `200 OK` plus a document at `purchases/{uid}`. This is the only check that exercises the private key, because the key is not parsed until the Firestore write. |

**Document IDs matching `__…__` are reserved by Firestore.** A self-test using
`__webhook_selftest__` returns `500 Database error`, which looks exactly like a malformed
private key. Use an ordinary id such as `zzz-selftest-prod`, and delete it afterwards.

## Known limitation

Phases 2-7 gate client-side, so the bundled question bank stays readable in devtools and Pro is a convenience unlock rather than locked content. Phase 8 closes this by moving the Pro category files into the serverless function bundle behind a token check. Everything upstream is identical either way.
