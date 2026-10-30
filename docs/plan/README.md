# Untangle v1 — build plan for Claude Code

Hand these files to Claude Code **one at a time, in order**. Each file is self-contained:
it has the goal, the rules, the full design and development requirements, the tasks
(split into sub-batches), and how to verify the work.

| Order | File | What gets built |
|---|---|---|
| 1 | [BATCH-1-cleanup-foundations-onboarding.md](BATCH-1-cleanup-foundations-onboarding.md) | 1.0 safety commit · 1.1 cleanup of the old scaffold · 1.2 design system and app skeleton · 1.3 native module (permissions, app list, usage) · 1.4 onboarding screens · 1.5 onboarding paywall |
| 2 | [BATCH-2-core-app.md](BATCH-2-core-app.md) | 2.1 blocking engine (Android) · 2.2 locks + Block tab · 2.3 pause screens · 2.4 Home, Screen time, streak, training · 2.5 Progress · 2.6 Focus now · 2.7 Settings · 2.8 in-app paywall |
| 3 | [BATCH-3.1-games-hero-set.md](BATCH-3.1-games-hero-set.md) | 3.1a game engine + Colour word (reference flow) + Stack tower · 3.1b arcade · 3.1c focus classics · 3.1d calm · 3.1e wiring into training and the pause screen |
| 4 | [BATCH-3.2-games-daily-core.md](BATCH-3.2-games-daily-core.md) | 3.2.0 housekeeping (git identity + first commits, one folder per game, sound service) · 14 daily-core games |
| 5 | [BATCH-3.3-games-puzzles-words.md](BATCH-3.3-games-puzzles-words.md) | Content pipeline (word list, generators + solvers, reviewed packs) · 14 puzzle and word games |
| 6 | [BATCH-3.4-games-variety.md](BATCH-3.4-games-variety.md) | 15 variety games incl. two audio games and Pocket terrarium |
| 7 | [BATCH-3.5-games-device-features.md](BATCH-3.5-games-device-features.md) | Owner decisions first · 4 sensor / voice games |
| 8 | [BATCH-3.6-games-polish.md](BATCH-3.6-games-polish.md) | Live intro demos, Toy/Enamel pieces, Block fit drag, fps pass, game icons |

## How to run each batch in Claude Code

1. Open Claude Code **in this folder** (`C:\Work\Hamza Projects\setup`).
2. Prompt: *"Read `docs/plan/BATCH-1-cleanup-foundations-onboarding.md` and do sub-batch 1.0
   and 1.1 only. Stop and report when done."* Then continue sub-batch by sub-batch.
   Small steps keep reviews easy.
3. After each sub-batch: run the app on your Android phone, check the acceptance list, then
   let Claude Code commit.

## Rules that apply to every batch (Claude Code must follow these)

- **Android only.** No iOS code, no web target.
- **Expo SDK 58.** Before using any Expo/RN API, check the versioned docs (see `AGENTS.md`).
  Install packages with `npx expo install`, never `npm install <pkg>` directly.
- **Never edit `android/` by hand.** It is generated (`npx expo prebuild --clean -p android`).
  Native code lives in `modules/untangle-blocker/` and config plugins.
- **Design system only.** No hex colours, raw font sizes or magic spacing in screens. Use
  `src/design/tokens` and `src/design/components`.
- **All user-facing text** in `src/i18n/en/*.json`.
- **Routes are thin.** `src/app/**` files only render a feature screen.
- **Tests** for every pure function and every design-system component.
- **Before saying a sub-batch is done:** `npm run check` passes, the app builds and runs on a
  device (`npx expo run:android`), and every item in that sub-batch's acceptance list is true.
- **Commit after each sub-batch** with a clear message: `batch-1.4: onboarding about-you screens`.
  The folder has a local git repository (no GitHub needed).
- If something in the spec is impossible or unclear, **stop and ask**; don't invent a
  workaround silently.

## Design references in this folder

| Folder | What |
|---|---|
| `design/screens/onboarding/` | PNG of every onboarding screen (from the prototype) |
| `design/screens/app/` | PNG of every app screen. `_superseded/` = screens **not** to build (old lock flow, schedules, bedtime, reminders) |
| `design/screens/games/` | Intro and Playing PNG for all 59 games (`<gameId>--intro.png`, `<gameId>--playing.png`) |
| `design/screens/games-reference-flow/` | 16 frames of Colour word showing every game-engine state (countdown, hit, streak, wrong, timer warning, last 5 s, time up, result, pause) |
| `design/prototype/` | The interactive HTML prototypes + game source code. Open in a desktop browser. They are the source of truth for behaviour and game rules |
| Figma | File `pinterest` (key `JpKhDmGZZdqwAZpn0hA4vx`), page **Untangle · Screens**. Node ids are given next to each screen (open with `?node-id=117-587`) |
| `docs/spec/` | The long-form spec these batch files are built from |

Screenshots are 1× captures of the prototype; when a detail is too small, open the
prototype HTML or the Figma node.
