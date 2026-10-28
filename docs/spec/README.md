# Untangle v1 — build spec (Android)

This folder is the single source of truth for building Untangle v1. It replaces the old
scaffold README for anything about *what* to build. Read in this order:

| # | File | What it covers |
|---|---|---|
| 00 | [00-foundations.md](00-foundations.md) | Scope, decisions, stack, folder structure, design system (tokens, type, components), naming, data, testing, definition of done |
| 01 | [01-cleanup.md](01-cleanup.md) | Exactly what to delete, keep and rewrite in this repo before any new screen is built |
| 02 | [02-android-platform.md](02-android-platform.md) | The blocking engine on Android: Accessibility service, usage stats, website detection, permissions, Play policy, OEM battery issues, every edge case |
| 10 | [10-phase1-onboarding.md](10-phase1-onboarding.md) | Phase 1: all 23 onboarding screens with copy, logic, states and edge cases |
| 20 | [20-phase2-core-app.md](20-phase2-core-app.md) | Phase 2: Home, Screen time, Streak, Progress, Block tab, the new short lock flow, the pause (block) screens, Focus now, Settings, Paywall |
| 30 | [30-phase3-games.md](30-phase3-games.md) | Phase 3: the game engine (shell, countdown, HUD, FX, results) and all 59 games in 5 build batches, ordered by fun and impact |

## Where the designs live

- **Figma:** file `pinterest` (`JpKhDmGZZdqwAZpn0hA4vx`), page **Untangle · Screens**. Every
  screen in these docs has its Figma node id next to it, e.g. `117:587`. Open with
  `https://www.figma.com/design/JpKhDmGZZdqwAZpn0hA4vx/pinterest?node-id=117-587`
  (replace `:` with `-`).
- **Reference flow for game animations:** section *Games · Reference flow* (`131:16493`):
  17 frames of Colour word covering every engine state (countdown, hit, streak, wrong,
  timer warning, last 5 s, time up, success, pause, resume, backgrounded).
- **Playable prototypes** (behaviour, timing and game rules are the source of truth when a
  frame is ambiguous): copied into `design/prototype/` in this repo (see 01-cleanup.md).

## Phases at a glance

| Phase | Ships | Depends on |
|---|---|---|
| 0 · Foundations | Repo cleaned, tokens, fonts, core components, navigation skeleton, storage, native module skeleton, a dev menu | — |
| 1 · Onboarding | All onboarding screens, real permission flows, app picker, first locks created | 0 |
| 2 · Core app | Home, Progress, Block tab + new lock flow, enforcement engine (apps + websites), pause screens, Focus now, Settings, Paywall | 0, 1, and the game shell + Stack tower from 3·B1 (the pause screen offers a game) |
| 3 · Games | Engine + Batch 1 (12 games) → Batch 2 (14) → Batch 3 (14) → Batch 4 (15) → Batch 5 (4) | 0 |

Phase 3·B1 can start in parallel with Phase 1. Recommended order for a single developer:
**0 → 3·shell + Stack tower → 1 → 2 → 3·B1 rest → B2 → B3 → B4 → B5.**

## Rough effort (one developer, full-time)

| Phase | Estimate |
|---|---|
| 0 · Foundations + cleanup | 1.5–2 weeks |
| 1 · Onboarding | 2–3 weeks |
| 2 · Core app incl. blocking engine | 5–7 weeks (device testing on several phone makers is the long pole) |
| 3 · Game engine + Batch 1 | ~7 weeks |
| 3 · Batches 2–5 | ~27 weeks |

A sensible first release (Play internal/closed testing) = Phases 0–2 + Batch 1: about
4 months for one developer. Later batches ship as updates.

## Decisions made in this spec (change them here first if you disagree)

1. **Android only.** iOS targets, Screen Time extensions, widgets and Live Activities are removed from v1 (kept in git history on the `legacy` branch).
2. **No backend, no account.** All data on the phone. The only network use is Google Play Billing through RevenueCat.
3. **Out of v1:** notifications/reminders, home-screen widgets, crash reporting, analytics, cloud backup, iOS.
4. **Games are native** (React Native + Skia + Reanimated), not web views.
5. **One font family: Public Sans** (400/500/600/700) for app and games. Inter Tight is retired.
6. **A lock is one app or one website with a daily allowance.** No names, no schedules, no "kind" step. Flow: *App or website → pick → how much a day / how many times a day → done.* Picking several apps creates one lock per app with the same allowance.
7. **Strictness** (Gentle / Firm / Locked) is not asked in the flow. Every new lock uses the default from Settings (Gentle) and can be changed on the lock's detail screen.
8. **Free vs Pro** (needs your confirmation): 3-day free trial through Google Play. Without Pro (trial ended or paywall closed): up to 3 locks (apps or sites) and the 3 daily training games; the Games tab shows the rest with a Pro tag. Pro: unlimited locks, every game any time, full Progress history.

Open questions are collected at the end of each phase doc under **Open questions**.
