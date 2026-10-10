# End-of-day mobile release

Follow this when asked to bump the mobile version or cut a new bundle. Finish the version edit and the release build in the same task. Do not stop after writing the version.

## What changed

Use the description given for the day. If none is given, read git history and the diff since the last `version:` change in `pubspec.yaml`.

## Which number

Current form is `version: X.Y.Z+N` in `pubspec.yaml`. Pick one of X, Y, or Z, then always add 1 to N.

- **Patch** (`1.3.2+9` → `1.3.3+10`): fixes, copy, small usability.
- **Minor** (`1.3.2+9` → `1.4.0+10`): players get something new (a screen, a power-up, news). Reset patch to 0.
- **Major** (`1.3.2+9` → `2.0.0+10`): an older app can no longer play (room or protocol break), or the product is a different app. Reset minor and patch to 0.

## Edit

Write the same `X.Y.Z` in both places:

- `quivro_mobile/pubspec.yaml` — `version: X.Y.Z+N`
- `quivro_mobile/lib/widgets/credits_dialog.dart` — the credits label `vX.Y.Z`

## Build

From `quivro_mobile`, run the release build. Do not only print the command.

```bash
flutter build appbundle --release
```

The Play bundle is `quivro_mobile/build/app/outputs/bundle/release/app-release.aab`. Confirm that file exists before the reply.

## Reply

Player language. No file names. Lead with the new thing. One line per change. The name in parentheses is one or two words (`News`, `Lock Up`). Use `Fixes` when the day is only fixes. English and Bosnian.

```
Release 1.3.2 (News)

What's new
- What's New is on the home screen. Swipe through announcements, then open them again anytime.
- The app starts in your phone's light or dark theme until you pick one.

Šta je novo
- "Šta je novo?" je na početnom ekranu. Prevuci najave, pa ih ponovo otvori kad hoćeš.
- Aplikacija prati svijetli ili tamni način telefona, dok sama ne odabereš temu.
```
