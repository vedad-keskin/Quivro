# Mobile coaching marks — implementation plan

Status: implemented in `quivro_mobile`. The hosting step follows the Host rooms banner or its collapsed footer TV button; the old hosting dialog remains removed. The final step uses the empty code input, with no demo code or automatic join.

## Design

Use `main.png` as the visual reference: a rounded coach card, bold title, short supporting text, Skip at the upper right, compact yellow Next button at the lower right, and a small triangular pointer aimed at the highlighted control. Match the heavy outline and offset shadow. Dim the surrounding screen while revealing the target's own border and hard shadow. Draw no additional selection frame or glow: the native control supplies the same shape and contrast in both themes.

Replace the numeric progress label with **five dots**, using only the dot treatment from `addition.png`: the current dot is yellow and the others are muted. Keep the card layout and triangular pointer from the main reference. Dots indicate progress; they do not jump between steps. Screen readers still announce “Step 1 of 5,” etc.

Reuse `showPanel`, `showDisplay`, `showBulb`, and the existing palette. The night appearance should closely follow the reference; day mode uses the matching light palette. Place the card above or below its target according to available space, keep the pointer aligned, and avoid covering the target. Respect safe areas, scrolling, the keyboard, and larger text.

Next uses a 160ms fade/slide out, measures the new target, then a 200ms fade/slide in. Keep the scrim visible throughout and ignore repeated Next taps until the transition finishes. Scroll an offscreen target into view over 280ms. Skip, Back, or disposal cancels pending advancement; reduced motion makes these transitions immediate.

## Five steps and proposed English copy

1. **News — “Catch up anytime”**
   - Target: the bottom-right megaphone.
   - Body: “Tap here to revisit news and discover what's new in Quivro.”
   - Next advances to themes. Tapping the target opens the real news pile; hide the coach while news is open and return to this step when it closes.
2. **Theme — “Make it day or night”**
   - Target: the theme chip itself, not the whole settings row.
   - Body: “Tap here to switch between day and night themes.”
   - Tapping changes the actual theme. Keep this step visible and update its colors immediately; Next advances to language.
3. **Language — “Choose your language”**
   - Target: the language chip.
   - Body: “Tap here to change Quivro's language.”
   - Allow the actual language sheet to open. Hide coaching while it is open, then return to this step in the selected language. Dismissing the sheet without choosing also returns here. Next advances to hosting.
4. **Hosting — “Create a room on the big screen”**
   - Target: the Host rooms banner above the navbar, including its TV artwork and X, or the bottom-left TV button after collapse. Entering this step expands a previously collapsed banner.
   - Body, restored from the old dialog: “Open this website on your PC or laptop to create a room. For the best experience, display the game on the largest screen available.”
   - The banner body is informational and opens nothing. Its top-right X collapses it into the footer TV button; tapping that button expands it again. Pause coaching during the motion, then remeasure and resume this same step on the visible target. Next advances to the code field.
5. **Code — “Enter the host's room code”**
   - Target: the room-code input.
   - Body: “After the host creates a room on quivro.org, type the code shown on their screen here. Then tap Join.”
   - Use the empty input, as clarified. Do not generate or insert a demo code. Preserve anything the user has already typed and let them tap/type normally. Do not automatically focus the field, open the keyboard, or join a room.
   - Replace Next with **Got it**. Closing the tour restores the normal home screen and Join action.

Provide equivalent Bosnian copy through the existing `AppStrings` system. News and language interactions retain the current step; advancement is always explicit through Next/Got it. Skip is available on every step.

## First-open and overlay lifecycle

- Determine eligibility before initial profile setup saves a profile. Checking at Home would incorrectly classify every new user as returning.
- Add one dedicated local flag, proposed as `quivro.firstOpenConsumed`. During the first successful, nonfatal bootstrap, capture eligibility and persist the flag before navigating onward. Carry eligibility only in memory through Splash → Setup → Home. Offline bootstrap counts as successful.
- On upgrade, pre-existing profile or news history means returning user: consume the flag without showing the tour. Previously used installations with no remaining saved data cannot be distinguished from fresh ones.
- Start step 1 only after the initial news pile has actually closed and the home layout is ready. Finishing all news, closing its X, or dismissing its backdrop must all use the same handoff. If there is no news to show, start once news loading confirms that and Home is ready.
- A process restart never repeats the tour, including an interruption during setup, initial news, or a coaching step. Background/resume within the same running session retains the current step. Fatal bootstrap retries must not consume eligibility; unreliable preference reads/writes suppress coaching without blocking the app.
- Skip, Got it, leaving Home, or system Back while a coach is visible ends the tour. Back while a news/language panel is open dismisses that panel first. Returning Home does not restart coaching.
- Keep later announcement delivery independent: new news drops may still open as they do today, without reopening coaching.
- Make only the current highlighted control interactive through the dimmed overlay, along with the coach's own buttons. Keep unrelated navigation blocked until the tour closes. Outside taps do not advance or dismiss the tour.
- Measure the real target bounds after layout; recompute for theme/language changes, scrolling, rotation, keyboard insets, text scaling, and banner/chip changes. Reveal an offscreen target before showing its coach. Pause during other panels and hosting-banner motion rather than layering competing explanations.
- Use accessible labels, a step announcement, accessible Skip/Next/Got it controls, and at least 48dp tap targets. Keep reading/focus order on the coach and highlighted control. Respect reduced motion with a static highlight and immediate transitions.

## Implementation areas

Paths below are relative to `quivro_mobile/`.

- `lib/core/bootstrap.dart`, `lib/core/profile_store.dart`: first-open claim using the existing preferences dependency and pre-setup profile/news evidence; expose eligibility on `BootResult`.
- `lib/screens/splash_page.dart`, `lib/main.dart`, `lib/screens/setup_page.dart`: forward optional eligibility through initial navigation, defaulting to false for ordinary routes and profile editing. Preserve current profile/session extras.
- `lib/screens/home_page.dart`: own the current step, consume the incoming eligibility once, attach target keys, coordinate panels and banner collapse/expansion, and place the overlay around the existing controls. Leave joining/session behavior intact.
- `lib/widgets/home_coach_marks.dart`: focused native Flutter overlay containing the scrim/cutout, positioned card/pointer, dots, buttons, and cancellable Next transition. Measure the expanded banner's artwork/close bounds or the exact collapsed chip bounds. No general onboarding framework or new package.
- `lib/widgets/news_pile.dart`: small ready/visibility callbacks covering automatic display and manual reopening, plus a dismissal hook so Home can close news on Back during the tour. Start the tour from actual lifecycle events, not a timer or the news-history preference alone.
- `lib/widgets/settings_chips.dart`: optional target keys and language-sheet lifecycle hooks for Home. Preserve its existing use on Setup.
- `lib/widgets/host_hint.dart`: informational `HostHomeBanner` with optional `onClose`, plus a 48dp `HostTvChip` that expands it. Home owns the two target keys and animation state; neither control opens a dialog.
- `lib/core/strings.dart`: English/Bosnian titles, descriptions, actions, and accessibility copy.

The current mobile client joins rooms; it does not create them. The banner shows the hosting website, which generates the real code. The empty-input step fits this flow without web, backend, or app-link changes.

## Verification for implementation

Use the existing Flutter test setup; keep coverage focused on the lifecycle and interactions:

- Fresh install: initial news appears alone; each dismissal path starts exactly one five-step tour in the requested order.
- First boot without news, successful offline boot, and fatal-boot retry follow the same eligibility rules. Restart during setup/news/tour, Skip, completion, Home re-entry, and an existing-user upgrade never replay coaching.
- News, theme, and language targets perform their real actions. News/language panels pause and resume the same step; a theme change keeps the coach visible. The hosting body stays informational; X/TV collapse and expand it, pausing coaching during motion and resuming on the correct target. Outside controls cannot accidentally navigate or join.
- Check intermediate Next fade/slide frames, rapid taps advancing only once, Skip/Back/disposal cancellation, and immediate reduced-motion behavior. Collapse/expand during the hosting step must retain that step without reviving the old dialog.
- Last step leaves the code field untouched, allows typing, retains typed text after Got it, and sends no join request. Normal joining remains available after the tour.
- Check English/Bosnian, day/night, 320px-wide phones, large text, keyboard-visible layout, and reduced motion for readable cards, accurate pointers, and reachable actions. Perform device visual QA against both supplied references.

Run `flutter analyze`, the focused coaching/news/settings tests, then the existing mobile test suite. No new test framework is needed.

The current iteration passes 28 focused tests and static analysis. Coverage includes collapse/expansion, reduced motion, disposal during animation, and coaching transitions. Native Flutter renders of the updated hosting coach and expanded/intermediate/collapsed banner are in `outputs/mobile-host-banner/`.

Original implementation checks, before the hosting-banner update: static analysis and the Android debug APK build passed. The full mobile suite had 53 passing tests and two existing failures: the missing-current-question session assertion and the avatar index 19 assertion. Both failures were reproduced independently on unchanged HEAD `20d38fa`.

Visual QA previews are in `outputs/coaching-marks/` at the repository root. They cover the news/theme/code steps, day/night, narrow Bosnian text, and a simulated keyboard inset. The widget-test renderer does not draw the OS keyboard or color emoji; those limitations affect previews only.
