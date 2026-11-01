# Homepage app download banner — option 2

Status: implemented on 2026-11-01. The banner is integrated into the existing homepage, with English/Bosnian copy and official badges, a compact mobile layout, and static download assets.

Verification: the focused homepage suite passed (2 tests), the production build passed, and the homepage plus all four assets returned HTTP 200 from the local dev server. The packaged QR decodes to the exact Play URL at 123, 164, and 328px. Browser preview is unavailable in this session, so rendered layout checks and a physical phone scan remain unverified.

## Result

Keep the current three “Kako se igra / How it works” cards. Add one full-width yellow download banner immediately below them and before the footer, matching option 2 in the supplied concept.

The desktop banner contains a tilted Quivro phone illustration, a bold two-line headline, an official Google Play badge, and a real QR code. The badge and QR both link to:
https://play.google.com/store/apps/details?id=com.quivro.app

The listing was checked and is live. It describes the app as the phone controller for games hosted on quivro.org. The QR opens the store listing; installing the app and entering the room code remain separate steps.

## Layout

- Use the existing 820px hero width; keep the main “Start the game” action in its current position.
- Reuse the page's yellow `--bulb`, black `--ink`, hard `--hit` shadow, rounded border, and `--display` font.
- Match the reference's white headline with a black outline/shadow. Supporting text stays explicitly dark on yellow in both themes; `--q-navy` changes to white in dark mode.
- Desktop, above 840px: one row with phone, flexible headline, badge, a vertical divider, and a 123px QR tile. Keep the QR's white quiet zone intact. The localized headline has an explicit line break.
- Show the phone at 180 × 270px, cropping its bottom 80px to retain the shallow banner. Its upper edge clears the step cards. The generated artwork already contains the tilt.
- At 840px and below: use a compact two-column composition with a larger phone on the left, cropped at the card's bottom. Group the headline and linked badge on the right and vertically center them together. The phone is 164 × 246px, scaling down to 136 × 204px below 381px and 116 × 174px below 341px so the title and badge retain room. Use a lighter mobile text outline. Hide the QR and scan instruction; tapping the badge provides the download path on the same phone. The steps still stack at their existing 720px breakpoint.
- Keep the banner in document flow, with room above the footer. No animation is needed.

The exact crop and spacing should be tuned in the live page at 360, 720, 721, and 1024px, including 200% text zoom.

## Copy

English:
- Headline: **Get the Quivro app**
- QR caption: **Scan to download**
- Store link accessible name: **Get Quivro on Google Play**
- QR alternative text: **QR code to download Quivro from Google Play**

Bosnian:
- Headline: **Preuzmi Quivro aplikaciju**
- QR caption: **Skeniraj za preuzimanje**
- Store link accessible name: **Preuzmi Quivro na Google Playu**
- QR alternative text: **QR kod za preuzimanje aplikacije Quivro s Google Playa**

Use the existing language switch to select the headline, caption, accessible text, and official badge. Keep the current three step descriptions; they already match the chosen concept. “Scan to download” accurately describes the QR destination.

## Prepared assets

All paths below are relative to the repository root.

- [Phone artwork](../outputs/homepage-app-download/quivro-phone.png): generated transparent PNG, 1024 × 1536, using the supplied concept and current Google Play icon as references. This is decorative; implement with empty alt text.
- [English Play badge](../outputs/homepage-app-download/google-play-badge-en.png) and [Bosnian Play badge](../outputs/homepage-app-download/google-play-badge-bs.png): official, unmodified Google artwork.
- [QR SVG](../outputs/homepage-app-download/google-play-qr.svg): static, black on white, four-module quiet zone. [PNG fallback](../outputs/homepage-app-download/google-play-qr.png) also included.
- [Asset provenance and QR verification](../outputs/homepage-app-download/assets-notes.md).
- [Exact image generation prompt](../outputs/homepage-app-download/imagegen-prompt.txt). Generated with the built-in image_gen tool, not the API/CLI fallback.
- [Current store icon reference](../outputs/homepage-app-download/play-store-icon-reference.png): downloaded from the live listing for the artwork brief; not an additional page image.

The integrated phone asset is `quivro_web/public/brand/quivro-phone.webp`: 480 × 720, about 52KB, with transparency preserved and visually inspected. The source PNG remains in outputs. Both official badge PNGs and the QR SVG are also copied into `quivro_web/public/brand/`. The badges retain their aspect ratio and clear space, with 14px of surrounding padding.

## Implementation steps

1. **Update the existing homepage component.** In `quivro_web/src/app/features/home/home.page.ts`, insert a semantic section after `ol.steps` inside `.how`. Use a heading tied to the section, decorative phone image, localized badge link, and linked QR image. Store the Play URL once in the component and bind both links to it. Keep markup and compact CSS in this file; a new component or service is unnecessary.
2. **Add translations.** Add the four copy keys to `quivro_web/src/i18n/en.ts` and `quivro_web/src/i18n/bs.ts`. Use `lang.t()` and the existing `lang.lang()` value to select the supplied badge.
3. **Make the links accessible.** Use native anchors with the exact HTTPS destination, useful accessible names, and a visible focus outline. Keep them in normal tab order; never make the whole banner one extra link. Use explicit image dimensions and lazy-load the decorative artwork so it does not shift the page.
4. **Add one focused regression check.** Extend `quivro_web/src/app/features/home/home.page.spec.ts` to check the banner, exact store destinations, and localized title/badge when the language switches. Preserve the existing news/weekly dialog checks.

No API, Firebase, mobile app, router, or dependency changes are required.

## Verification and stop condition

During implementation:
- Run `npm test -- --watch=false --include=src/app/features/home/home.page.spec.ts` and `npm run build` from `quivro_web/`. Watch the existing component-style budget.
- Check English/Bosnian and day/night themes at the widths above; confirm the heading fits, the QR is not distorted, there is no horizontal overflow, and the footer remains clear.
- Test both links, keyboard focus, and the main game-start action.
- Decode the final served QR asset and scan the rendered desktop QR with a real phone at its final size. Increase the QR size if a comfortable scan fails.

Complete when the homepage visibly matches option 2, both download paths reach the listing, and the focused checks and build pass. App analytics, smart device redirects, extra store buttons, and lobby changes are outside this pass.

## Evidence

- [Live Google Play listing](https://play.google.com/store/apps/details?id=com.quivro.app)
- [Official Google Play badge guidance](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86642)
- Existing insertion point: `quivro_web/src/app/features/home/home.page.ts:100–114`; width: line 216; breakpoint: line 619.
- Existing visual tokens: `quivro_web/src/styles.css:298`; English/Bosnian copy: `quivro_web/src/i18n/en.ts` and `bs.ts`.

