# Mobile homepage hosting banner — implementation plan

Status: implemented on 2026-11-01, directly above the bottom navigation/settings row. A top-right X now collapses the banner into a bottom-left TV button; that button expands it again.

Current verification: 28 focused tests and static analysis pass, including the parameterized banner check covering 48 width/language/theme/text-scale combinations. Coverage includes placement, informational taps, the complete tour, code entry with the keyboard open, localized close controls and keyboard activation, collapse/reopen, reduced motion, and disposal during animation.

Earlier native Flutter renders with the app fonts measured 84dp banner height at 320px and 88dp at 360/390/430px, before adding the close control. The larger monitor slightly overhangs the top and clips at the card's bottom. English/night and Bosnian/day renders were inspected. [English preview](../outputs/mobile-host-banner/banner-v2-360-en-night-1.0.png); [Bosnian preview](../outputs/mobile-host-banner/banner-v2-390-bs-day-1.0.png).

The earlier banner also rendered without overflow at 200% text, growing naturally to 176dp in the 320px Bosnian capture. Full-home 200% text previously exposed a horizontal overflow in the existing Join control, which is unchanged in this feature; that large-text render therefore validates the banner independently.

## Proposed result

Add a compact reciprocal version of the approved web download banner: the website promotes the phone app; the phone app explains where to host.

Place it below the Nightfall Studio mark and directly above the bottom settings row, as in the supplied placement idea. Use the same yellow, heavy outline, hard shadow, rounded corners, white outlined headline, dark action pill, and vertically centered copy group as the web banner.

Use the new slim dark display illustration in place of the bulky silver monitor. It matches the approved phone artwork's navy rays, Quivro Q emblem, dark frame, and restrained edge highlights.

## Composition and height

- **Normal phone widths:** the updated shorter headline allows an 84–88dp card, plus a 4dp hard shadow.
- **Left:** a larger 160–180dp-wide monitor, painted independently of the text layout. Its top slightly overhangs the card and its bottom clips at the inner bottom edge. Ignore pointer events on the decorative artwork.
- **Right:** center the headline and website pill together vertically, with an 8dp gap. Allow native wrapping when needed at larger text sizes.
- **Website pill:** dark navy, `quivro.org` in white, and a native up-right arrow at the end. It is part of the informational banner and has no tap action.
- **Spacing:** approximately 10dp vertical / 12dp horizontal inner padding, 10–12dp between illustration and copy, at least 16dp above the card, and 12–16dp before settings.
- **320dp screens:** the existing 28dp page inset leaves a 264dp card. Use a smaller illustration slot and a 16–17sp headline so the copy stays legible. At 360dp and above, use roughly 18sp. Use native wrapping and allow the card to grow for large accessibility text; do not shrink all text to force a fixed height.
- Keep the yellow and dark pill consistent in day/night mode. Use explicit white headline/pill text and dark outlines rather than theme-dependent foreground colors.
- **Close control:** optional `onClose` adds 16dp headroom for the artwork and top-right X. The visible 28dp rounded square matches the News close control: card fill, thick outline, hard shadow, and styled ×. It retains a 48dp tap target and localized Close tooltip. Keep the compact yellow card height unchanged.

The default-height targets were confirmed in native widget renders; large text grows beyond the default range.

## Text

The updated localized banner titles are:

English:
- **Host rooms on**

Bosnian:
- **Kreiraj sobu na**

Use the banner title, website address, and `hostBannerDescription` as one informational accessible label. The website address is unchanged in both languages. Keep text native to Flutter, separate from the artwork.

The hosting coach uses the original dialog explanation: “Open this website on your PC or laptop to create a room. For the best experience, display the game on the largest screen available.” Bosnian: “Otvori ovu web stranicu na računaru ili laptopu i napravi sobu. Za najbolji doživljaj prikaži igru na što većem ekranu.”

## Tap behavior

The banner body and website pill remain informational and open nothing. The old hosting dialog and copy-link action remain removed. Only the X has a close action: shrink, fade, and slide the banner toward the bottom-left over 400ms while revealing a 48dp TV button in the footer. Tapping the TV button reverses the motion. Ignore the hosting controls during motion; reduced motion switches immediately. Expansion state belongs to the current Home instance.

The fourth coaching step targets the expanded banner or collapsed TV button. Pause the coach during banner motion, then measure the visible target and resume the same step. Entering the hosting step expands a previously collapsed banner. Next fades/slides between coach cards and advances to room-code entry; rapid Next taps cannot skip steps, and reduced motion is immediate.

## Existing layout and integration

The homepage uses `SafeArea`, `LayoutBuilder`, `SingleChildScrollView`, and `_CenteredHomeColumn`. Header, join controls/studio mark, and footer are its three main groups; the join group centers vertically on screen while clearing the header and footer.

The banner and `_footer()` share one bottom group, with the card above settings. Animate the banner's height, scale, opacity, and bottom-left translation. Always reserve the TV button's 48dp slot and 12dp gap, so News, language, and theme retain their collapsed-layout positions. Fade/slide the TV button without clipping its hard shadow. During expansion, native scrolling keeps the footer visible on short screens. Preserve the footer entrance completion callback that starts homepage coaching.

This uses spare vertical space on larger screens. On smaller screens, the existing scroll view accommodates the extra content; the room-code input and Join button retain their current sizes and reading order. The banner remains in the scrollable content when the keyboard opens. Do not pin it above the keyboard or reduce the join controls to make room.

Wrap both hosting controls in `_tourControl(step: 3, child: ...)`, using `_hostBannerKey` and `_hostChipKey`. Their information is exposed during the hosting step and hidden during other coach steps. The banner spotlight includes the artwork and close control; the chip uses its own bounds. Home waits for the banner animation to finish before restoring coaching. No hosting dialog remains.

## Files to change during implementation

1. **`quivro_mobile/lib/widgets/host_hint.dart`** — informational `HostHomeBanner` with optional `onClose`, plus `HostTvChip` for expansion, using the existing visual helpers and decorative asset.
2. **`quivro_mobile/lib/screens/home_page.dart`** — banner above settings, collapse/expand animation, and dynamic fourth coaching target. Footer contains the TV button when collapsed, plus language/theme/news controls.
3. **`quivro_mobile/lib/core/strings.dart`** — English/Bosnian banner title, description, and coaching instructions. Obsolete dialog strings have been removed.
4. **`quivro_mobile/pubspec.yaml`** — declare the optimized illustration after copying it to `assets/branding/host_monitor.webp`.
5. **`quivro_mobile/test/host_home_banner_test.dart`** — parameterized sizing, localization, informational-body semantics, close/expand actions, and overflow checks; hosting/coaching tests cover target changes and tour integration.

No app navigation, backend, account, room-joining, new package, or web changes are required.

## Prepared artwork

Stored outside the generated `outputs/` and scratch `temp/` folders so the selected sources can be versioned:

- [Optimized display artwork](assets/mobile-host-banner/host-monitor.webp): 600 × 400 RGBA WebP, 35,796 bytes; transparency and appearance inspected.
- [Source artwork](assets/mobile-host-banner/monitor-source.png): 1536 × 1024 RGBA PNG.
- [Exact generation prompt](assets/mobile-host-banner/imagegen-prompt.txt).

Generated using the built-in image_gen tool, with the user's placement concept, the approved website phone artwork, and the existing mobile Q emblem as references. The runtime copy is declared in pubspec as `assets/branding/host_monitor.webp`.

The frame is intentionally dark and slim, with a shallow stand and mild tilt. The text, address pill, arrow, outline, and yellow panel are native Flutter content.

## Validation for implementation

- Check the actual Flutter homepage at 320 × 568, 360 × 640, 390 × 844, and 430 × 932.
- Cover English/Bosnian, day/night, and default/large/200% text. At default size, confirm the compact height target. At larger text sizes, prefer natural growth and scrolling.
- Render and inspect native widget/homepage screenshots: monitor proportions, full readable Q emblem, balanced text/pill centering, clear gap after the studio mark, and settings reachable without overlap.
- Confirm the code field and Join button stay usable with the keyboard open.
- Tap the banner body/pill and confirm nothing opens. Use X to collapse it and the bottom-left TV button to expand it; check intermediate motion, final footer spacing, 48dp actions, and reduced motion.
- Confirm the fourth coach step pauses during collapse/expansion, resumes on the visible target with the restored PC/laptop copy, and advances only through Next. Check Next's fade/slide, repeated-tap guard, and cancellation.
- Run `flutter test test/host_home_banner_test.dart test/host_hint_coach_test.dart test/home_coaching_flow_test.dart test/home_coach_marks_test.dart`, then `flutter analyze` from `quivro_mobile/`.

The updated controls were inspected in native Flutter renders using the app fonts: [expanded at 320px](../outputs/mobile-host-banner/host-expanded-320.png), [during collapse](../outputs/mobile-host-banner/host-collapsing-320.png), [collapsed](../outputs/mobile-host-banner/host-collapsed-320.png), and [Bosnian hosting coach](../outputs/mobile-host-banner/host-coach-new.png). The existing full-home Join-control issue at 200% text is noted above.

The fixed footer and restyled close control were rechecked at 390px/night: [expanded](../outputs/mobile-host-banner/footer-fixed-390-expanded.png), [collapsed](../outputs/mobile-host-banner/footer-fixed-390-collapsed.png), and [reopened](../outputs/mobile-host-banner/footer-fixed-390-reopened.png). The TV shadow is fully visible and the other footer controls retain their positions. Regression checks cover both 320×568 and 390×844, with and without reduced motion.

## Code reference points

- Homepage centering, footer, and collapse/expand lifecycle: `lib/screens/home_page.dart` (`_CenteredHomeColumn`, `_footer`, `_setHostExpanded`, `_finishHostMotion`).
- Banner and TV button: `lib/widgets/host_hint.dart` (`HostHomeBanner`, `HostTvChip`).
- Spotlight geometry and Next transition: `lib/widgets/home_coach_marks.dart`.
- Shared visual helpers: `lib/core/theme.dart` (`showPanel`, `showDisplay`).

