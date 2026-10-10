# Double it — implementation plan

Status: planning only. No gameplay changes or new audio have been implemented.

## Intended behavior

Double it is a Pro power-up, selected in the existing three-slot setup and consumed once per slot per round, like the existing power-ups. Use `double_it` as the shared identifier. Keep the supplied web icon unchanged and copy it to mobile's power-up assets.

During question N, an accepted use adds one to the multiplier of question N+1 for everyone, including the caster. One use gives ×2, two uses give ×3, three give ×4. Uses add together; they do not repeatedly double the multiplier. The effect lasts for that target question only.

Standard scoring awards 2, 3, 4… points per correct answer. Timed scoring first calculates and rounds the ordinary score using the existing difficulty/image base and answer timestamp, then multiplies that integer. For example, an ordinary 347-point answer becomes 694 at ×2 or 1,041 at ×3. Incorrect, missing, and blank-locked answers remain zero. Boosts affect actual scores and score-delta animations, not just labels.

The final question cannot accept Double it because there is no next question. The penultimate question can boost the final question. A one-question round has no valid use window.

Pro follows the existing host/room entitlement model: the host needs Pro to configure Double it; participating phones do not need separate Pro purchases.

## Confirmed interaction rules

Confirmed during planning:

1. One power-up per question, matching the existing rule. In the user's terminology, using Double it on R3 blocks other power-ups only on R3; unused slots are available on R4. There is **no extra next-question cooldown**. Answering and changing answers remain governed by the ordinary answer rules.
2. Double it can be used before or after answering, but only while answers are open. It does not require an answer selection, submit an answer, or lock an answer.
3. Stacking has no arbitrary cap. One accepted contribution per player per source question remains enforced. Duplicate Double it loadout slots are allowed like duplicate existing power-ups, but cannot bypass the one-power-up-per-question rule.

Assumption for implementation: the boost benefits every player. This follows the requested behavior that the question itself is worth more points.

## Web presentation

Use stylized orange/gold flames with bold outlines, matching Quivro's existing rounded chips, ink borders, playful icons, and score stickers. Keep category colors and the supplied blue/purple icon recognizable. Avoid realistic smoke or effects over question text and answers.

1. On host acceptance, the existing **Up next** chip ignites with a short outward flame burst, then settles into a restrained flame edge. Show `NEXT · 2 POINTS` in standard mode or `NEXT · ×2 POINTS` in timed mode.
2. Further accepted uses pop the number upward and emit a short spark/flame pulse. A small temporary attribution, such as `Ana boosted the next question`, explains why it changed. Coalesce simultaneous contributions into one animation while displaying the exact resulting multiplier.
3. When the boosted question starts, carry the flame treatment to the current question panel and show `THIS QUESTION · 3 POINTS` or `THIS QUESTION · ×3 POINTS`. Keep the multiplier visible through reveal so the awarded scores make sense.
4. The current question and the next question may both be boosted by different groups. Show separate current and next badges and effects; never share one mutable multiplier between them.
5. A new question returns to normal unless it has its own contributions. Final-question layout shows the current boost but no usable next-question affordance.

Bound visual intensity independently of scoring: ×12 must remain legible and performant, without twelve particle layers. Keep effects outside readable content, make decorative elements ignore pointer events, and check compact layouts, long category names, image docking, light theme, and dark theme.

For reduced motion, replace bursts and moving flames with a static flame border/icon and a text update. Screen readers announce the target question and new value; color and motion are never the only signals.

## Audio

Mobile: preload and register the supplied `assets/sounds/double_up.mp3`, play once for a valid enabled tap, and preserve the current pending-slot interaction. A tap sound means a request was made; only an accepted room update marks the slot spent and shows success. Rejected/offline requests must not silently appear successful.

Web: create an original short ignition effect during implementation, approximately 600–800 ms: a soft rising whoosh, warm crackle at the flame burst, and a quick decay. Prefer a small pre-rendered asset so animation and sound can start together. Use a shorter variation for additional stacks and a restrained ignition when the target question starts. Do not loop crackling throughout the question.

Use the same accepted-event trigger for web sound and animation. Group near-simultaneous events, bound volume, and avoid covering the existing last-five-seconds ticking or correct-answer sound. Initialize playback after an existing host gesture; audio failure or autoplay blocking must never interrupt gameplay. Stop/release audio on navigation or room end. Reconnects restore visible state without replaying historical activation sounds.

## Mobile presentation and availability

- Add the exact icon to the existing circular power-up slot design with the existing pending pulse and spent treatment; do not fall through to the 50/50 icon or sound.
- After acceptance, show `Next question: ×3 for everyone` (or the standard point amount), using the shared room value.
- On the boosted question, show a compact current-value badge. If a different player boosts the following question, distinguish `Now` and `Next`.
- After acceptance, disable all other power-up slots for the caster for the source question only. Explain with `Power-up used this question`. On the following question, enable every otherwise eligible unused slot. A spent slot stays spent for the whole game round.
- Disable unused Double it slots on the final question with `No next question`. A spent slot remains visibly spent. Eligibility must agree between widget state, request policy, and host validation.
- Other players can still use their available power-ups on the boosted question. Double it does not grant immunity from Lock up. A currently locked player cannot cast it, matching current mobile behavior.
- If the current question is boosted, any eligible player, including a previous caster with another unused Double it slot, can boost the following question. This does not increase the current question's multiplier. The previous caster may instead use another available power-up on the boosted question.
- Add all labels, descriptions, plurals, disabled reasons, and accessibility text in English and Bosnian on both clients.

## Shared state and transition safety

The existing web host resolves requests and scores; keep that ownership. Mobile sends requests and renders committed state. Do not calculate scores independently on mobile.

Proposed additive state:

- A round identifier, renewed on rematch, included in new Double it requests and effects so an old queued request cannot match a later round's question index.
- Accepted contributions indexed by target question and stable player/request identity, carrying source question and slot. These are durable facts; derive the multiplier as `1 + accepted contribution count` rather than a shared read/modify/write counter.
- Reuse the existing used-slot/source-question record for the one-power-up-per-question restriction; do not add an extra cooldown field.
- A fixed multiplier on the public current question when it opens, retained through reveal. Missing values in older rooms mean ×1.

Acceptance must validate room/round, membership, configured slot/type, unused slot, current phase/index, open answer window, an actual following question, current-question usage, and answer-lock state. Failed requests consume nothing. A pending request blocks another local power-up request.

Commit contribution, slot consumption, and request completion together. Make repeated delivery idempotent. Contribution identities prevent duplicate boosts; separate per-player entries prevent simultaneous users overwriting each other's counts.

Coordinate host request processing, reveal, question opening, end-game, and rematch at a single transition boundary. Re-read current state before committing and establish ordering: an accepted contribution before source-question closure must appear in the next multiplier; a request that loses that race is rejected without spending. Never apply a late contribution to an already-open target question. An old resolver must not clear a newer request for the same player.

Account for the existing automatic reveal when everyone has answered: there is no guaranteed after-answer grace period. Do not extend timers for the visual effect. Image preview/docking remains outside the usable answer window.

The implementation must prove these guarantees across host reconnect/takeover, not rely only on an in-memory in-flight flag. Choose the smallest conditional-write/transition mechanism compatible with the existing Firebase rules, and validate it with emulator tests. Avoid granting broad room write access just to enable a root transaction. Existing rules use a permissive client-host trust model; this feature does not introduce a separate backend/auth redesign or claim tamper-proof scoring.

## Lifecycle and compatibility

- Keep accepted contributions if a caster leaves or disconnects. A room-wide boost must not disappear with its contributor's player record.
- Rejoining with the same player identity restores used slots and current-question restrictions. Host refresh restores pending/current boosts and cannot score the same reveal twice.
- Clear effects, spent slots, pending acknowledgments, and deduplication state on rematch; a new round identity prevents old offline requests from leaking into it.
- Early host termination discards unplayed boosts, consistent with consumable power-ups in an ended round; no carryover or refund into a rematch.
- Empty/malformed legacy fields default safely; validate integer indices, multipliers, and slots. Do not trust a phone-supplied multiplier.
- Existing mobile builds ignore unknown power-up IDs, so an old phone would see an empty Double it slot. Rollout must explicitly handle mixed versions: recommend feature capability/version detection and withholding Double it for incompatible rooms with an update message, rather than silently disadvantaging old clients. Existing other power-ups must continue to work.
- Ship additive Firebase rule support and compatible host/mobile parsing before enabling selection. Include create-round and rematch Pro gates, random selection, slot cycling, and round reset behavior.

## Implementation areas

Web:

- `src/app/core/room.models.ts`: catalog, types, parsing, eligibility and multiplier helpers.
- `src/app/core/game-room.service.ts`: accepted effects, transition ordering, scoring and resets.
- `src/app/core/entitlements.ts` and entitlement tests: existing Pro-only treatment.
- `src/app/features/play/play.page.ts`: next/current boost UI and synchronized effects/audio; extract a focused effect component if this keeps the large page manageable.
- `src/app/features/create-round/create-round.page.ts`: confirm catalog-driven selection, help copy and Pro state; rematch selection lives in the play page too.
- `src/i18n/en.ts`, `src/i18n/bs.ts`, shared styles as needed, and `public/sounds/`.

Mobile:

- `lib/core/room_models.dart`, `room_repository.dart`: ID/parsing, shared state, request identity and eligibility.
- `lib/screens/room_page.dart`: slot mapping, pending/error feedback, current/next badges and disable reasons.
- `lib/core/sfx.dart`, `lib/core/strings.dart`, `pubspec.yaml`, `assets/powerups/double_it.png` and the supplied sound.

Shared: `database.rules.json` for accepted request shape, final-question/timing checks where supported, and the narrowly scoped new state paths. Capability metadata belongs in the existing join/room flow if the recommended mixed-version gate is adopted.

## Verification and completion conditions

1. Scoring: no boost, one boost, multiple simultaneous boosts, standard/timed, all difficulty bases, image base, rounding boundaries, wrong/missing answers, Second chance probes, Lock up choices and blank locks. Persisted totals and both clients' score deltas agree.
2. Eligibility: one use per question, duplicate slots, unused slots available again on N+1, casting on consecutive questions using different slots, other power-ups usable on a question the player boosted, locked players, pending requests, final/penultimate/one-question rounds, reveal/lobby/finished phases, preview/docking and exact time boundaries.
3. Races: two and many casters, repeated taps, duplicate database events, timeout, everyone-answered auto-reveal, request versus question advance, end-game/rematch, stale request clearing, failed writes, offline recovery and host takeover. Assert all-or-nothing consumption and stable target scoring.
4. Lifecycle: caster leaves, reconnect/refresh, repeated reveal, rematch reset, old-round request replay, missing legacy fields and mixed client versions.
5. UI/audio: actual icon on both clients; activation sound once per mobile tap; accepted-event web sound; no historical sound replay; intelligible current versus next badges; readable large multipliers; both themes/languages; reduced motion; image questions; small screens; audio loading/playback failure.
6. Run focused web model/service/entitlement tests, mobile policy/widget tests, Firebase emulator cases, Angular production build, and Flutter analysis. Finish with a host plus multiple phones/emulators smoke test that includes simultaneous boosts and a penultimate-question cast.

Completion means the host, phones, Firebase state, scoring, power-up availability, effects and audio agree under the cases above. No implementation or deployment is part of this planning change.
