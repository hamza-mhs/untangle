# BATCH 1 — Cleanup, foundations and onboarding

**Goal:** turn the old scaffold into a clean Android-only base with the new design system,
then build the complete onboarding flow (23 designed screens) with real permission flows,
the app picker and the trial paywall. At the end of this batch a new user can install the
app, go through onboarding, grant permissions, pick apps to block (saved, not yet enforced:
enforcement is Batch 2) and land on an empty Home.

Read `docs/plan/README.md` first for the rules that apply to every batch.

## Sub-batches (do them in order, stop after each)

| # | Sub-batch | Done when |
|---|---|---|
| 1.0 | Safety commit | Old scaffold committed on a `legacy` branch, work continues on `v1` |
| 1.1 | Cleanup | Old screens, features, packages and iOS parts removed; app boots to a placeholder |
| 1.2 | Foundations | Tokens, Public Sans, core components, navigation skeleton (onboarding stack + 4 tabs), storage, i18n, dev menu with kitchen sink |
| 1.3 | Native module, part 1 | `modules/untangle-blocker` with permission checks/openers, installed apps + icons, usage stats reading, locks store (`setLocks`), JS bridge + mock |
| 1.4 | Onboarding screens | All screens of §D below, with every state, resume after process death |
| 1.5 | Onboarding paywall | RevenueCat Google Play offering, trial purchase, restore, close → free tier |

---

## 1.0 · Safety commit

The folder already has a local git repository with everything staged and **no commits**.

- [ ] `git add -A && git commit -m "Legacy scaffold (pre-v1 cleanup)"`
- [ ] `git branch legacy`
- [ ] `git checkout -b v1`
- [ ] Add to `.gitignore`: `/android`, `/ios`, `modules/*/android/build/`, `.cxx/` and remove those
      paths from the index (`git rm -r --cached android modules/blocker-android/android/build`).
- [ ] Commit: `batch-1.0: ignore generated native folders`

## 1.1 · Cleanup

Follow **§A Cleanup** below exactly. Old screens are deleted, not reused: every screen in
this app is rebuilt from the new designs.

Acceptance:
- [ ] `package.json` contains only the packages listed under "Keep" (+ `expo-audio`).
- [ ] No `ios`, `targets/`, HealthKit, speech, sensors, notifications, widgets, web files left.
- [ ] `src/app` contains only `_layout.tsx` and a temporary `index.tsx` placeholder.
- [ ] `npm run check` passes, `npx expo-doctor` clean, app runs on a device.
- [ ] Commit: `batch-1.1: remove legacy scaffold`

## 1.2 · Foundations

Build everything in **§B Foundations**: tokens (§B.4), fonts, the core components table
(§B.4.5), folder structure (§B.3), navigation skeleton, storage (MMKV + SQLite schema and
migration 0001), i18n, haptics wrapper, ESLint rules, and the dev menu
(`src/app/dev/`) with a kitchen sink showing every component in every variant.

Acceptance:
- [ ] Kitchen sink renders every component and state; screenshots match the look of
      `design/screens/onboarding/*.png` (black UI, white primary buttons, Public Sans).
- [ ] Lint fails if a hex colour is written in `src/features` or `src/app`.
- [ ] Navigation: root decides onboarding vs tabs from `onboarding.completedAt`; 4 empty tabs
      (Today, Games, Progress, Block) with the custom tab bar.
- [ ] Commit: `batch-1.2: design system and app skeleton`

## 1.3 · Native module, part 1

Create `modules/untangle-blocker` (rename/replace `modules/blocker-android`). In this batch
implement only what onboarding needs (see **§C**): permission status and settings openers,
`getInstalledApps`, `getAppIcon`, `getUsageToday`, `getUsageRange`, `setLocks`/`getLocks`
persisted natively, `getServiceHealth`. Add the `UntangleAccessibilityService` class and its
XML config so the system lists it in Accessibility settings, but it only records a heartbeat
for now (no blocking yet). Write the JS bridge `src/native/untangleBlocker.ts` with types and a
mock used by tests and the dev menu.

Acceptance:
- [ ] On a real phone: Untangle appears under Settings › Accessibility › Downloaded apps; turning
      it on makes `isAccessibilityEnabled()` true when returning to the app.
- [ ] Usage access toggle → `hasUsageAccess()` true; `getUsageToday()` returns plausible
      numbers (compare with Android's Digital Wellbeing).
- [ ] `getInstalledApps()` lists launchable apps with icons; no `QUERY_ALL_PACKAGES`.
- [ ] Manifest contains no `SYSTEM_ALERT_WINDOW`, `FOREGROUND_SERVICE`,
      `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `POST_NOTIFICATIONS`.
- [ ] Commit: `batch-1.3: native module part 1`

## 1.4 · Onboarding screens

Build every screen in **§D Onboarding** with all states and edge cases. Use the screenshot
and Figma node for each screen (table below). Copy marked **COPY CHANGE** overrides the
screenshot.

| Screen | Route (`src/app/(onboarding)/`) | Screenshot (`design/screens/onboarding/`) | Figma |
|---|---|---|---|
| Welcome slide 1 | `index` | `02-splash-b-1-block-the-apps.png` | `117:419` |
| Welcome slide 2 | `index` | `03-splash-b-2-play-instead.png` | `117:462` |
| Welcome slide 3 | `index` | `04-splash-b-3-get-your-focus-back.png` | `117:520` |
| (alt. single welcome, not built unless chosen) | — | `01-splash-a-checklist.png` | `117:332` |
| Your age | `age` | `05-your-age.png` | `117:587` |
| Scroll time | `scroll-time` | `06-your-scroll-time.png` | `117:634` |
| Pick-ups | `pickups` | `07-your-pick-ups.png` | `117:681` |
| Focus signs | `focus-signs` | `08-your-focus.png` | `117:725` |
| Studying your answers | `studying` | `09-studying-your-answers.png` | `117:782` |
| N days of your year | `your-year` | `10-thats-38-days-of-your-year.png` | `117:814` |
| Problem 1 | `problem-focus` | `11-problem-1-your-focus-is-shrinking.png` | `117:1199` |
| Problem 2 | `problem-distracted` | `12-problem-2-you-get-distracted-easily.png` | `117:1239` |
| Problem 3 | `problem-foggy` | `13-problem-3-your-focus-feels-foggy.png` | `117:1300` |
| Hours back | `hours-back` | `14-hours-back.png` | `117:1361` |
| Moment of pause | `moment-of-pause` | `15-moment-of-pause.png` | `117:1400` |
| Blocking is step one | `step-one` | `16-blocking-is-step-one.png` | `117:1433` |
| Watch your focus grow | `focus-grow` | `17-watch-your-focus-grow.png` | `117:1474` |
| Paywall (1.5) | `trial` | `18-paywall-yearly-selected.png` | `117:1523` |
| Permissions | `permissions` | `19-permissions.png` | `117:1587` |
| Accessibility disclosure | `accessibility` | `20-accessibility-disclosure.png` | `117:1631` |
| (system dialog — not built, Android shows it) | — | `21-accessibility-system-dialog.png` | `117:1669` |
| Pick apps | `pick-apps` | `22-pick-apps.png` | `117:1705` |
| You're all set | `all-set` | `23-youre-all-set.png` | `117:1753` |

Illustrations: export from the Figma frames (or the prototype) as WebP into
`assets/images/onboarding/` named after the screen (`moment-of-pause.webp`, `fog-cloud.webp`,
…). Charts (365-dot grid, bars, year lines) are drawn in code (Skia/SVG), not images.

Suggested order (commit after each): about-you questions → results → the fix → permissions +
disclosure → pick apps → all set → resume/back behaviour → dev-menu state gallery.

Acceptance:
- [ ] Every screen matches its screenshot (allowing COPY CHANGES) at 360×800 and 412×915.
- [ ] Every state listed in §D for that screen is reachable from the dev menu.
- [ ] Killing the app on any screen and reopening resumes on that screen with answers kept.
- [ ] Maths unit-tested (days per year, ×5 line, hours back 15/30 min).
- [ ] Permission flow tested on a real phone: grant all, deny accessibility twice ("Skip for
      now" appears), restricted-settings help sheet.
- [ ] Pick apps creates one lock per selected app via `setLocks` (30 min/day default) and the
      locks survive an app restart.
- [ ] Commit per group, final: `batch-1.4: onboarding complete`

## 1.5 · Onboarding paywall

Implement §D 2.15 with RevenueCat (`react-native-purchases`), Google Play only, entitlement
`pro`, offering `default` with packages `$rc_annual` (3-day free trial) and `$rc_monthly`.
Keys from `.env.local` (`EXPO_PUBLIC_RC_ANDROID_KEY`). Add a dev-menu switch "Force Pro".

Acceptance:
- [ ] Prices, SAVE % and weekly price come from the store (no hard-coded amounts).
- [ ] All paywall states in §D 2.15 reachable (use dev menu to simulate offline / errors).
- [ ] Sandbox purchase with a Play license tester grants `pro`; restore works.
- [ ] Closing the paywall continues to Set up on the free tier (max 3 picked apps on Pick apps).
- [ ] Commit: `batch-1.5: onboarding paywall`

**Needs from you before 1.5:** a Play Console app with the two subscription products, a
RevenueCat project linked to it, and the public Android SDK key.

---

# Full requirements


## §A · Cleanup (sub-batch 1.1)

The current folder is a scaffold for the **old** product: challenges, rewards vault,
reading aloud, step-count walks, the ghost, a Clarity score, nine paywall variants, iOS
Screen Time extensions. Almost no screen UI was built (they are stubs), so cleaning up is
cheap. The tooling, storage and native wiring are worth keeping.

### Step 0 · Make it reversible

The repo has **no commits** (everything is staged on `master`). Before deleting anything:

1. `git add -A && git commit -m "Legacy scaffold (pre-v1 cleanup)"`
2. `git branch legacy` (keeps the old work reachable forever)
3. `git checkout -b v1`

Also add to `.gitignore`: `/android`, `/ios`, `modules/*/android/build/`, `.cxx/`.
(`android/` is currently present and not ignored; it is generated by `expo prebuild` and
must not be committed.)

### Step 1 · Remove packages

| Package | Why it goes |
|---|---|
| `@kingstinct/react-native-healthkit` | iOS step counts (old walk challenges) |
| `react-native-health-connect` | Android step counts (old walk challenges) |
| `expo-speech-recognition` | Old reading reps. *Read aloud* (games batch 5) will re-add a speech solution when that batch starts. |
| `expo-sensors` | Old face-down detection. Re-added in games batch 5 (tilt, squats, face-down). |
| `expo-image-picker`, `expo-document-picker` | Unused |
| `expo-local-authentication`, `expo-secure-store` | Old app-lock and trial flag; trial is now Google Play's |
| `expo-glass-effect`, `expo-symbols`, `@expo/ui` | iOS-only UI |
| `expo-notifications` | No notifications in v1 |
| `expo-sharing`, `expo-web-browser` | Unused in v1 (Terms/Privacy open via `Linking`) |
| `@bacons/apple-targets` (dev) | iOS extensions |
| `lucide-react-native` | Replaced by our own icon set from Figma (`Components · Icons`) |
| `react-native-web`, `react-dom`, `index.web.js`, `*.web.ts(x)` | No web target |

Keep: expo, expo-router, expo-dev-client, expo-font, expo-splash-screen, expo-status-bar,
expo-system-ui, expo-constants, expo-application, expo-device, expo-linking, expo-haptics,
expo-image, expo-file-system, expo-sqlite, expo-build-properties, drizzle-orm, zustand,
react-native-mmkv, react-native-nitro-modules, reanimated, worklets, gesture-handler, screens,
safe-area-context, react-native-svg, skia, react-native-purchases, i18next, react-i18next, zod.
Add: `expo-audio`.

After removing, run `npx expo install --fix` and `npx expo-doctor`.

### Step 2 · Remove iOS

- Delete `targets/` (all five Swift extensions), `modules/blocker-ios/`, `shared/widgetState.ts`.
- `app.config.ts`: drop the `ios` block, `expo.icon`, FamilyControls entitlement, Live
  Activities, App Group, HealthKit/speech/sensor plugin entries, `blockedPermissions` that
  belonged to removed packages. Set `platforms: ['android']`.
- `plugins/withUntangleNative.js`: drop `withIos`; keep the Android `allowBackup=false` and the
  Windows short-CMake-path fix.
- `eas.json`: drop `development-simulator`.

### Step 3 · Remove old features and screens

Delete entirely:

```
src/app/(onboarding)/*          (16 old screens — rebuilt in phase 1)
src/app/(tabs)/challenges.tsx  rewards.tsx  today.tsx  block.tsx  (rebuilt)
src/app/challenge/  challenges/  lights-out/  reading/  receipt/  rewards/  reps/
src/app/rule/  shield/  pro/  focus/  paywall/  fix-access.tsx  notifications-off.tsx
src/app/settings/billing.tsx  cancel.tsx  draw-time.tsx  guide/
src/features/challenges/  clarity/  reading/  receipt/  rewards/  reps/  scoring/clarity.ts
src/features/focus/ladder.ts  suggestions.ts  focusNotifications.ts
src/features/paywall/moments.ts  usePricingMoments.ts  paywallMachine.ts  trial*.ts  secureFlag.ts
src/features/rules/emergencyPasses.ts  strengths.ts  schedule.ts  draftStore.ts
src/features/lock/AppLockGate.tsx
src/features/backup/            (cloud/backup out of v1)
src/features/widgetSync.ts
src/services/sensors/  services/notifications/
src/design/components/: AnswerBox ChallengeCard ChallengeList ClarityScore DayGhostStrip
  FocusCard Ghost LetterKeyboard ListeningBar LiveText NumberPad PlanOption StarField
  StrengthOption StubScreen VaultItem FeatureTable ResultStats GameIntro GameShell
design/onboarding-01-05/  design/screens-06-to-block-focus/  design/screens-challenges-to-widgets/
  (old exports only — KEEP design/screens/ and design/prototype/, they are the new references)
scripts/build-ghost-scene.mjs  build-standing-ghost.mjs  (and the design:ghost npm script)
drizzle/ (old migrations — schema is replaced, see 00-foundations §6)
```

Delete their tests too (`src/features/__tests__/pack2.test.ts`, `phase2to4.test.ts`, the reps
and trial tests). Keep `domain.test.ts` / `stores.test.ts` only for code that survives.

### Step 4 · Keep and adapt

| Keep | Change |
|---|---|
| `app.config.ts` variants (`development`/`preview`/`production`) | Real package id: replace `com.TODO.untangle` (needs your reverse-DNS, e.g. `ai.fleetzero.untangle`), also in the Kotlin namespace. Name: "Untangle"; Play listing title "Untangle: App Blocker & Focus". |
| `src/storage/kv.ts`, `createStore.ts`, `db/client.ts`, `DatabaseProvider.tsx` | New schema + migration 0001 (00-foundations §6). |
| `src/lib/*` (haptics, time, format, result, links, toast) | `useNotificationLinks.ts` deleted. |
| `src/i18n` | New key structure per screen. |
| `src/design/tokens/*`, `theme.ts`, `useAppFonts.ts`, `useReducedMotion.ts` | Rewrite values to 00-foundations §4; Public Sans. |
| Components: Screen, Text, PrimaryButton→`Button`, IconButton, Card, Chip, ChoiceChip, ChoiceRow→`OptionRow`, ListGroup, Toggle, Segmented, Sheet, Toast/ToastHost, ProgressBar, PressableScale, Skeleton, TabBar, ErrorBoundary, Icon, Banner, Countdown, StatCard→`StatTile`, StatsGrid, OnboardingHeader→`Header`, RadioDot | Restyle to tokens; rename as shown; tests updated. |
| `src/features/onboarding/` store/navigation/steps pattern | Steps list replaced (23 screens). |
| `src/features/rules/` | Renamed `locks/`; model replaced by the one-target `Lock`. |
| `src/features/focus/machine.ts`, `store.ts` | Becomes `focusSession/` (no-early-exit logic kept, with the new "end early" sheet). |
| `src/features/paywall/usePro.ts`, `paywallStore.ts`, `PaywallScreen.tsx` | One paywall; RevenueCat offerings. |
| `src/features/home/` | Rebuilt around Home C1. |
| `src/features/dev/` | Dev menu: jump to any screen/state, fake usage data, force Pro, reset onboarding. |
| `src/services/blocking/*` | Becomes `src/native/untangleBlocker.ts` + mock. |
| `modules/blocker-android/` | Renamed `modules/untangle-blocker/`. Keep `SharedState.kt` pattern and `BootReceiver.kt`; replace the 1-second `UsageStatsManager` polling `BlockerService` with an `AccessibilityService`; remove `TangleWidget.kt` (no widgets); `BlockActivity.kt` removed (the pause screen is the RN app). See 02-android-platform.md. |
| `assets/fonts` | Replace with Public Sans; delete Inter, Inter Tight, JetBrains Mono. |
| `assets/images` | New icon (logo decision pending), splash, adaptive icon layers. |
| `README.md` | Shorten to setup + scripts; link to `docs/spec/`. `AGENTS.md` kept. |

### Step 5 · Add

- `design/prototype/` — copies of the HTML prototypes (games, app, onboarding V10) and their JS,
  read-only, for behaviour reference.
- `docs/spec/` — this spec.
- `src/app/dev/` — state gallery for every screen (Definition of done #2).

### Step 6 · Verify the clean base

1. `npm run check` passes.
2. `npx expo prebuild --clean -p android` then `npx expo run:android` launches a blank app with
   the tab bar and dev menu on a real device.
3. `npx expo-doctor` clean.
4. Commit: "v1 base: Android-only, cleaned scaffold".


## §B · Foundations (sub-batch 1.2)

Everything every screen depends on. Build this first (Phase 0), together with the cleanup in
[01-cleanup.md](01-cleanup.md).

---

### B.1 Scope of v1

**In:** Android phones (minSdk 26, portrait only, phones only). Onboarding, blocking apps and
websites with daily allowances, the pause screen, Focus now sessions, Home, Progress, Games
(59, shipped in batches), Settings, Paywall with a Google Play free trial. Works fully offline
except buying and restoring Pro.

**Out (v1):** iOS, notifications of any kind (reminders, streak, trial ending, lock starting),
home-screen widgets, Live Activities, schedules (time-of-day locks), accounts, backend, cloud
backup, crash reporting, analytics, sharing, localisation beyond English (strings still go
through i18n so translation is possible later).

> **Why no notifications matters:** two designed features depend on them and change in v1.
> The Reminders screen (`122:8292`) is not built, and the Permissions onboarding step asks for
> three permissions, not four (notifications removed). See 10-phase1-onboarding.md.

---

### B.2 Stack (kept from the existing repo)

| Area | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19.3, New Architecture | Dev client builds. Expo Go cannot run this app (custom native code). |
| Language | TypeScript strict, `noUncheckedIndexedAccess` | |
| Routing | expo-router (typed routes), routes in `src/app/` | |
| State | zustand 5, persisted to MMKV | One store per feature. |
| Key-value | react-native-mmkv 4 | Settings, onboarding answers, lightweight flags. |
| History | expo-sqlite + drizzle-orm | Game results, daily summaries, detours, focus sessions. |
| Graphics | @shopify/react-native-skia 2 | Game backgrounds, FX, charts, timer ring. |
| Animation | react-native-reanimated 4 + gesture-handler 3 | All motion on the UI thread. Respect *Remove animations* (system setting) via `useReducedMotion`. |
| Haptics | expo-haptics behind `src/lib/haptics.ts` | Lint rule blocks direct imports. |
| Audio | expo-audio (add) | Game sounds (taps, chime, tones for Odd sound out / Rhythm relay). Short, preloaded, respects the Sound setting. |
| Purchases | react-native-purchases (RevenueCat) | Google Play only. Entitlement id `pro`. |
| Native | One local Expo module `modules/untangle-blocker` (Kotlin) | Accessibility service, usage stats, app list, pause-screen launch. See 02-android-platform.md. |
| Fonts | Public Sans 400/500/600/700 (OFL), embedded via expo-font plugin | Replaces Inter / Inter Tight / JetBrains Mono. |

Packages to remove are listed in 01-cleanup.md.

---

### B.3 Folder structure (target)

```
src/
  app/                          # expo-router routes ONLY. No logic, no styles beyond layout.
    _layout.tsx                 # fonts, providers, splash, redirect to onboarding or tabs
    (onboarding)/               # phase 1, one file per screen (see 10-…)
    (tabs)/_layout.tsx          # bottom tab bar: Today · Games · Progress · Block
    (tabs)/index.tsx            # Today (Home)
    (tabs)/games.tsx
    (tabs)/progress.tsx
    (tabs)/block.tsx
    screen-time.tsx             # Home → Screen time detail
    lock/new/…                  # new lock flow (3 steps)
    lock/[lockId].tsx           # lock detail
    focus/…                     # Focus now
    pause/…                     # the pause screen family, opened by the native service
    game/[gameId].tsx           # game shell host (intro → countdown → play → result)
    settings/…
    paywall.tsx
    dev/…                       # dev menu, kitchen sink (stripped from production builds)
  design/
    tokens/                     # color.ts space.ts radius.ts type.ts motion.ts elevation.ts index.ts
    components/<Name>/          # <Name>.tsx, index.ts, <Name>.test.tsx
    icons/                      # SVG icon components, one per file, generated from Figma "Components · Icons"
    useReducedMotion.ts
  features/
    onboarding/  locks/  enforcement/  usage/  home/  progress/
    focusSession/  streak/  training/  settings/  paywall/
    games/
      engine/                   # GameShell, Countdown, Hud, TimerRing, FxLayer, ResultScreen, PauseSheet, GameBackground
      catalog.ts                # metadata for all 59 games (generated from 30-phase3-games.md table)
      registry.ts               # gameId → lazy import of the game module
      <gameId>/                 # one folder per game: index.ts, Round.tsx, logic.ts, logic.test.ts, content.json?
  native/untangleBlocker.ts     # typed JS bridge to modules/untangle-blocker, plus a mock for tests/web
  storage/                      # kv.ts, db/schema.ts, db/migrations, repos/
  lib/                          # haptics, sound, time, format, rng, result
  i18n/en/*.json                # all user-facing strings, keyed by screen
modules/untangle-blocker/       # Kotlin Expo module (Android only)
assets/
  fonts/        PublicSans-*.ttf
  images/       app icon, splash, onboarding illustrations (webp)
  games/<gameId>/   game-specific images and sounds
  sounds/       shared UI and game sounds (.ogg)
design/prototype/               # read-only copies of the HTML prototypes, for reference
docs/spec/                      # this spec
```

Rules:

- Routes are thin: a route file renders one feature screen component and passes params.
- A feature never imports another feature's internals; it imports from that feature's
  `index.ts`.
- Anything visual comes from `src/design`. No hex colours, raw font sizes or magic spacing
  numbers in feature code. Lint enforces this (see §9).

---

### B.4 Design system

Source of truth in Figma: variable collections **Untangle 26 · Colour** and **Untangle 26 ·
Space & radius**. The older collection *Untangle · Colour* and the text styles named
`Untangle/…` (Inter) are obsolete; delete them in Figma when the Public Sans text styles
below are created.

#### B.4.1 Colour tokens

Two layers: private `palette` primitives, and the semantic `color` object components use.

| Token | Value | Use |
|---|---|---|
| `color.bg.app` | `#000000` | App background (all non-game screens) |
| `color.bg.ink` | `#05050A` | Game screen base under the background art |
| `color.surface.card` | `#111114` | Cards, rows, option tiles |
| `color.surface.raised` | `#18181C` | Sheets, selected-but-not-primary, inputs |
| `color.surface.line` | `rgba(255,255,255,0.07)` | Hairlines, card borders |
| `color.surface.lineStrong` | `#24252A` | Unselected radio rings, dividers on cards |
| `color.text.primary` | `#FFFFFF` | |
| `color.text.secondary` | `#8A8B92` | Subtitles, captions |
| `color.text.tertiary` | `#5F6066` | Hints, disabled, legal |
| `color.text.onLight` | `#000000` | Text on white primary buttons |
| `color.brand.violet` | `#8B3DFF` | Brand accent, selected states, Pro, streak flame base |
| `color.brand.violetLight` | `#A57BFF` | Gradients, selected borders |
| `color.signal.success` | `#3BE3B2` | Right answers, "less than usual", saved time |
| `color.signal.danger` | `#FF4848` | Wrong, over limit, destructive buttons |
| `color.signal.warning` | `#FFC53D` | Timer warning, "needs attention" |
| `color.game.pink` | `#FF3D8E` | Game accent palette (also used by app icons in mocks) |
| `color.game.sky` | `#22A6FF` | |
| `color.game.cobalt` | `#4A5BFF` | |
| `color.game.violet` | `#8B3DFF` | |
| `color.game.orange` | `#FF7A1F` | |
| `color.game.mint` | `#17D9A3` | |
| `color.game.sun` | `#FFC53D` | |
| `color.game.coral` | `#FF4848` | |

**Colour rule:** the app is black and white. Colour belongs to games, game icons, chips that
name a game category, data (charts) and signals. No coloured backgrounds on app screens except
the Home sky image (C1) and onboarding illustrations.

Focus-group colours (category chips, Games tab filters, intro chip):

| Group id | Label | Chip colour |
|---|---|---|
| `memory` | Memory | `game.mint` |
| `attention` | Attention | `game.sky` |
| `selfControl` | Self-control | `game.pink` |
| `quickDecisions` | Quick decisions | `game.orange` |
| `logic` | Logic & spatial | `game.cobalt` |
| `words` | Words | `game.sun` |
| `calm` | Calm | `game.violet` |
| `active` | Active | `signal.success` |

#### B.4.2 Spacing and radius

`space`: 4, 8, 12, 16, 20, 24, 32, 48, 80 → `space[1]`…, exposed as `space.xs=4, sm=8, md=12,
lg=16, xl=20, '2xl'=24, '3xl'=32, '4xl'=48, '5xl'=80`.

Screen gutters: 24 on onboarding, 18 on tab screens (prototype `padding: 46px 18px 110px`),
16 inside cards.

`radius`: `sm=8, md=12, lg=16, xl=18, card=20, '2xl'=22, '3xl'=24, '4xl'=28, pill=999`.
`card=20` is the most used value in the prototype (cards). Option rows use `xl` (18),
chips and buttons `pill`, app icons 22% of their size (squircle). Add `Radius/20` to the
Figma collection so both sides match.

#### B.4.3 Typography (Public Sans)

Named by role, not size. Line heights are absolute px. Letter-spacing in px (negative only on
large titles).

| Token | Size / line | Weight | Tracking | Used for |
|---|---|---|---|---|
| `type.display` | 40 / 44 | 700 | −0.8 | Splash headline, big result numbers in onboarding |
| `type.titleLg` | 30 / 33 | 700 | −0.6 | Onboarding titles |
| `type.title` | 27 / 31 | 700 | −0.4 | Tab screen titles (Games, Progress, Block, Settings) |
| `type.heading` | 19 / 24 | 600 | −0.2 | Card titles, sheet titles |
| `type.bodyLg` | 17 / 23 | 600 | 0 | Option row labels, list primary text |
| `type.body` | 15 / 21.7 | 400 | 0 | Subtitles, paragraphs |
| `type.bodyStrong` | 15 / 21 | 600 | 0 | Buttons (secondary), emphasis |
| `type.button` | 16 / 20 | 700 | 0 | Primary buttons |
| `type.caption` | 12.5 / 16 | 500 | 0 | Meta lines, chart labels |
| `type.micro` | 11 / 14 | 700 | +0.4, uppercase | Section labels ("WHAT'S BLOCKED", "MOST USED TODAY") |
| `type.statXl` | 68 / 70 | 700 | −1.5, tabular | Game result score |
| `type.statLg` | 34 / 38 | 700 | −0.8, tabular | "1h 42m", "183 hours" |
| `type.statMd` | 22 / 26 | 700 | −0.3, tabular | Stat tiles, timer number |

Font files: `PublicSans-Regular.ttf`, `-Medium`, `-SemiBold`, `-Bold`. Map weight → file in
`type.ts`; never rely on synthetic bold.

#### B.4.4 Motion

| Token | Value | Use |
|---|---|---|
| `motion.duration.instant` | 120 ms | Press-in, toggles |
| `motion.duration.fast` | 200 ms | Chip select, small fades |
| `motion.duration.base` | 320 ms | Screen content enter, sheet |
| `motion.duration.slow` | 480 ms | Hit ring, result reveal steps |
| `motion.duration.countdownBeat` | 620 ms (+20 ms gap) | 3-2-1-Go |
| `motion.easing.standard` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | Most enters, rings |
| `motion.easing.pop` | `cubic-bezier(0.3, 1.2, 0.5, 1)` | Countdown digit, streak pill pop |
| `motion.spring.press` | damping 18, stiffness 320 | `PressableScale` (scale 0.97) |

Reduced motion: replace movement with fades, keep the countdown (it carries timing), drop
particles and rays.

#### B.4.5 Core components (build in Phase 0)

Each lives in `src/design/components/<Name>/` with a test and a story in `/dev/kitchen-sink`.

| Component | Variants / props | Figma reference |
|---|---|---|
| `Screen` | `variant: 'app' \| 'game'`, safe areas, optional scroll, bottom CTA slot | all |
| `Header` | back chevron (`‹` 30×30 chip), title, right action | onboarding & detail screens |
| `ProgressDots` / `StepProgress` | onboarding progress bar, carousel dots | `117:587` |
| `Button` | `primary` (white, black text), `brand` (violet gradient), `secondary` (card), `ghost` (text), `danger`; `size: lg (52) \| md (44)`; `loading`, `disabled` | `Button / Primary`, `Button / Brand` layers |
| `OptionRow` | emoji/icon, label, sublabel, `selected`, `multi` (checkbox) or single (radio) | About-you screens |
| `ChoiceChip` | text chip, selected state; used for minutes/opens presets, filters | lock flow, Games tab |
| `CategoryChip` | coloured by focus group | game intro, game cards |
| `Card` | `surface.card`, radius 20, padding 16, optional pressable | everywhere |
| `ListRow` / `ListGroup` | icon, title, detail, chevron, switch | Settings, lock detail |
| `Toggle` | | Settings |
| `Stepper` | − value + | Daily goal |
| `Sheet` | bottom sheet with grabber, title, body, actions | confirms (turn off, delete, end early) |
| `AppIcon` | real installed app icon (from native) with fallback monogram tile (e.g. "IG") coloured from a hash | lock rows, pause screen |
| `SiteIcon` | favicon is NOT fetched (offline); monogram tile from domain | websites |
| `StatTile` | label, big number, delta line (good/bad) | Progress, Screen time |
| `BarChart` | stacked bars (blocked vs everything else), week labels, "today" highlight | Home, Progress |
| `HourChart` | 24 bars pick-ups by hour | Screen time |
| `Ring` | progress ring (Skia), used by timer and allowance | game HUD, lock rows |
| `TabBar` | 4 tabs: Today, Games, Progress, Block | tab screens |
| `Toast` | | errors, saved |
| `EmptyState` | icon, title, body, action | no locks, no history |
| `Banner` | warning banner with action ("Blocking might stop · Fix it") | Settings, Home |
| `GameCard` | game icon (badge art), name, group · duration, NEW tag | Games tab |
| `GameIcon` | the badge-style icon per game (PNG/WebP asset per game) | Games tab, intro |

---

### B.5 Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files | Components PascalCase; everything else camelCase | `OptionRow.tsx`, `lockRepo.ts` |
| Route files | kebab-case | `screen-time.tsx`, `pick-apps.tsx` |
| Game ids | camelCase, stable forever (used in DB) | `colourWord`, `dontTapRed`, `stackTower` |
| Tokens | `group.role.variant` | `color.surface.raised`, `type.titleLg` |
| i18n keys | `<area>.<screen>.<element>` | `onboarding.age.title`, `pause.gentle.playGame` |
| testID | `<screen>.<element>` | `onboarding.age.option.25to34` |
| Assets | kebab-case, prefixed by area | `games/stack-tower/icon.webp`, `onboarding/moment-of-pause.webp` |
| DB tables | snake_case plural | `game_results`, `daily_usage` |
| Stores | `use<Feature>Store` | `useLocksStore` |
| Native methods | verbs | `getInstalledApps()`, `openAccessibilitySettings()` |

---

### B.6 Data model (JS side)

Enforcement state that the Kotlin service needs while the app is closed lives **native-side**
(see 02-android-platform.md §5). JS reads and writes it only through `native/untangleBlocker.ts`.

```ts
// features/locks/types.ts
type LockTarget =
  | { kind: 'app'; packageName: string; label: string }
  | { kind: 'site'; domain: string };          // registrable domain, lowercase, no scheme/www

type Strictness = 'gentle' | 'firm' | 'locked';

interface Lock {
  id: string;                 // uuid
  target: LockTarget;         // exactly one target per lock
  dailyMinutes: number | null; // null = no time limit; 0 = blocked all day
  dailyOpens: number | null;   // null = no open limit
  strictness: Strictness;
  enabled: boolean;
  createdAt: number;           // epoch ms
}
// Invariant: dailyMinutes !== null || dailyOpens !== null  (a lock limits something)
```

SQLite tables (drizzle, `storage/db/schema.ts`, fresh migration 0001):

| Table | Columns | Written by |
|---|---|---|
| `game_results` | id, game_id, started_at, duration_ms, score, stars, stats_json, source (`training`\|`browse`\|`pause`), completed (bool) | game shell |
| `game_bests` | game_id PK, best_score, best_stat_json, updated_at | game shell |
| `daily_summary` | date (YYYY-MM-DD local) PK, screen_time_ms, blocked_time_ms, pickups, detours, games_played, goal_met (bool) | usage sync (on app open + midnight rollover) |
| `detours` | id, at, target_key, choice (`game`\|`breath`\|`back`), lock_id | pause screen |
| `focus_sessions` | id, started_at, planned_ms, ended_at, ended_early (bool) | focus session |

MMKV keys (`storage/kv.ts`, one typed accessor each): `onboarding.answers`,
`onboarding.completedAt`, `settings.*`, `streak.*`, `training.day`, `paywall.lastShownAt`.

---

### B.7 Time and dates

- A "day" is the device's local calendar day, keyed `YYYY-MM-DD`. Allowances reset at local
  midnight.
- Time zone or clock change: compute the key from the current local time each time; never add
  24 h to a stored timestamp. If the clock moves backwards into a day that already has usage,
  keep that day's usage (do not grant a fresh allowance).
- Durations shown: `<1 min` → "under a minute"; `<60 min` → "42m"; else "1h 42m".
- Times: device 12/24 h setting (`Intl.DateTimeFormat` with `hour: 'numeric'`).

---

### B.8 Offline behaviour

Every feature works with no network except: buying Pro, restoring purchases, and reading the
current Play price. RevenueCat caches the last customer info, so Pro status survives offline
restarts. If prices cannot be fetched the paywall shows a "Can't load prices. Check your
connection." state with Retry, and nothing else on the paywall is tappable except Close.

---

### B.9 Quality gates

- `npm run check` (typecheck, lint, prettier, jest) passes before every merge.
- ESLint rules: no raw hex/rgb in `src/features` and `src/app` (`no-restricted-syntax` on
  string literals matching `#[0-9a-f]{3,8}`); no direct `expo-haptics` import; no imports
  across feature internals.
- Unit tests for every pure function: allowance math, open counting, day rollover, streak,
  training pick, onboarding results math, each game's `logic.ts` (generators always produce
  solvable boards; scoring thresholds).
- Component tests for each design-system component.
- Manual device test matrix before release: Pixel (stock Android 14/15/16), Samsung One UI,
  Xiaomi/HyperOS (aggressive battery), one Android 8/9 device (minSdk).

### B.10 Definition of done (per screen)

1. Matches the Figma frame at 360×800 and 412×915 (text may wrap differently; nothing clips).
2. Every state in the screen's **States** table exists and is reachable from the dev menu.
3. All strings in i18n, all colours/spacing/type from tokens.
4. TalkBack labels on every control, minimum touch target 44×44 dp, font scale 1.3 does not
   break layout.
5. Back button (system back) behaviour as specified.


## §C · Native module, part 1 (sub-batch 1.3)

> Batch 1 implements only: permission checks/openers, `getServiceHealth`, `getInstalledApps`, `getAppIcon`, `getUsageToday`, `getUsageRange`, `setLocks`/`getLocks`, and the accessibility service shell (heartbeat only). Everything about blocking (EnforcementEngine, PauseActivity, unlocks, focus sessions, browsers) is Batch 2.

### C.2 Native module `modules/untangle-blocker` (Kotlin, Expo Modules API)

#### C.2.1 Classes

| Class | Responsibility |
|---|---|
| `UntangleAccessibilityService` | Receives window events; tracks foreground package; reads browser URL; screen on/off receiver; heartbeat; calls the engine; launches the pause screen; performs `GLOBAL_ACTION_HOME`. |
| `EnforcementEngine` | **Pure Kotlin, unit-tested.** Input: event (package, url, time) + state. Output: `Allow(nextCheckAt)` or `Block(reason)`. Owns counting rules (§4). |
| `BlockerStore` | Persistent state in `SharedPreferences` (`untangle_blocker`) as JSON: locks, settings, focus session, today's counters, active unlocks, heartbeat. Single writer per key, `commit()` on writes the service depends on. (Rename/extend existing `SharedState.kt`.) |
| `UsageRepository` | `UsageStatsManager.queryEvents` → per-app foreground time today, pick-ups today, hourly pick-ups, 7-day baselines. |
| `AppCatalog` | Installed launchable apps (label, package, icon as PNG base64 cached on disk, category from `ApplicationInfo.category`). |
| `PauseActivity` | A separate `ReactActivity` (`taskAffinity=":pause"`, `excludeFromRecents=true`, `launchMode=singleTask`, no animation) that renders the JS component `Pause` (pause screen → game → result). Keeps the main app's navigation untouched. |
| `BlockerModule` | The JS bridge (§2.2). Emits events to JS when the app is running. |

> **Fallback if a second React root is too much trouble:** deep-link the main activity to
> `untangle://pause?...`. It works, but the pause screen then sits in the app's own back stack
> and Recents, and the "back" behaviour needs more care. Decide in the first week of Phase 2.

#### C.2.2 JS bridge (`src/native/untangleBlocker.ts`)

```ts
// permissions
isAccessibilityEnabled(): Promise<boolean>
openAccessibilitySettings(): Promise<void>          // Settings.ACTION_ACCESSIBILITY_SETTINGS
hasUsageAccess(): Promise<boolean>                  // AppOpsManager OPSTR_GET_USAGE_STATS
openUsageAccessSettings(): Promise<void>            // Settings.ACTION_USAGE_ACCESS_SETTINGS
isIgnoringBatteryOptimizations(): Promise<boolean>  // PowerManager
openBatteryOptimizationSettings(): Promise<void>    // ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS (list; no special permission)
openOemAutostartSettings(): Promise<boolean>        // best-effort per maker, false if none matched
getServiceHealth(): Promise<{ enabled: boolean; lastHeartbeatAt: number | null }>

// apps & usage
getInstalledApps(): Promise<InstalledApp[]>          // launchable apps only
getAppIcon(packageName): Promise<string>            // file:// uri of cached PNG
getUsageToday(): Promise<{ screenTimeMs; pickups; perApp: {packageName, ms}[]; pickupsByHour: number[24] }>
getUsageRange(fromDate, toDate): Promise<DailyUsage[]>   // for Progress & "usual" baselines

// enforcement state (JS is the editor, native is the source of truth)
setLocks(locks: Lock[]): Promise<void>
setSettings(s: { unlockMinutesGentle: number; unlockMinutesFirm: number; firmWaitSeconds: number }): Promise<void>
startFocusSession(endAt: number, targetKeys: string[]): Promise<void>
endFocusSession(): Promise<void>
getTodayCounters(): Promise<Record<TargetKey, { usedMs: number; opens: number; unlocksUsed: number }>>
grantUnlock(targetKey: TargetKey, minutes: number): Promise<void>
openTarget(targetKey: TargetKey): Promise<void>      // launch app / open site in default browser
goHome(): Promise<void>                             // GLOBAL_ACTION_HOME via the service
// events (only while JS is alive)
addListener('blocked' | 'usageTick' | 'serviceHealth', cb)
```

`TargetKey` = `app:<packageName>` or `site:<domain>`.

A full mock (`untangleBlocker.mock.ts`) with fake apps and usage drives the dev menu, jest and
the emulator.

#### C.2.3 Manifest (merged from the module)

- `<service android:name=".UntangleAccessibilityService" android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" android:exported="false">` with `<intent-filter><action android:name="android.accessibilityservice.AccessibilityService"/></intent-filter>` and `<meta-data android:name="android.accessibilityservice" android:resource="@xml/untangle_accessibility"/>`.
- `res/xml/untangle_accessibility.xml`:
  `accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged"`,
  `accessibilityFeedbackType="feedbackGeneric"`, `notificationTimeout="150"`,
  `canRetrieveWindowContent="true"` (needed to read the browser address bar),
  `accessibilityFlags="flagReportViewIds|flagIncludeNotImportantViews"`,
  `android:description="@string/a11y_description"` (short, honest; the in-app disclosure is
  the real one), **no** `isAccessibilityTool` (we are not an accessibility tool).
- `<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions"/>`
- `<queries>`: `<intent><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent>` (to list launchable apps) and a `VIEW https` intent (to find installed browsers). **Do not** use `QUERY_ALL_PACKAGES` (Play restricts it to apps where seeing every package is the core purpose; the launcher query is enough).
- Not needed and must not be added: `SYSTEM_ALERT_WINDOW` (the service can draw `TYPE_ACCESSIBILITY_OVERLAY` windows if ever needed), `FOREGROUND_SERVICE`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `RECEIVE_BOOT_COMPLETED` (the system rebinds accessibility services after boot), `POST_NOTIFICATIONS`.
- `PauseActivity` declared with `excludeFromRecents`, `noHistory=false`, `screenOrientation=portrait`, theme with black window background (no white flash).

---

### C.3 Permissions and Google Play policy

| Permission | Why | How it's granted | Play requirement |
|---|---|---|---|
| Accessibility service | Detect the app/site in front and show the pause screen | User turns on Untangle in *Settings › Accessibility › Downloaded apps* (we deep-link to the accessibility list). | **Accessibility declaration** in Play Console + a **video** showing the in-app disclosure, both the accept and decline paths, and the blocking feature. Our disclosure screen (onboarding `117:1631`) is the "prominent disclosure": separate screen, explains what is read (app name and site address only) and why, needs an explicit tap ("Agree and open settings"), and offers "Not now". It must stay in the app (also reachable from Settings › Privacy). Changing how we use the API later means resubmitting the declaration. |
| Usage access | Screen time, pick-ups, per-app minutes in lists | User toggles Untangle in *Usage access* settings. | None beyond the Data safety form. |
| Battery: Unrestricted | Some phones stop background services | We open the battery optimisation list; the user picks Untangle → Unrestricted (exact UI differs per maker). | Using the list screen avoids the restricted `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission. |

Data safety form: no data collected or shared (everything stays on the device); purchases are
handled by Google Play/RevenueCat (declare RevenueCat's purchase-history processing as
required by its documentation at submission time).

**Android 13+ "Restricted settings" (VERIFY ON DEVICE):** for apps installed outside an app
store (e.g. a sideloaded test APK), Android may grey out the Accessibility toggle until the
user opens *App info › ⋮ › Allow restricted settings*. Play-installed builds are not affected.
Internal testers should install through a Play internal-testing track, or the onboarding must
detect "toggle greyed out" cases: if the user returns from settings without enabling it twice,
show a help sheet with these steps.

---

### C.5 Usage numbers for Home and Progress (UsageRepository)

- **Screen time today:** sum of foreground durations from `UsageEvents` (`ACTIVITY_RESUMED`/
  `ACTIVITY_PAUSED`, or `MOVE_TO_FOREGROUND`/`BACKGROUND` before API 29) since local midnight,
  excluding our app and the launcher. (Do not use `queryUsageStats` daily buckets; they are
  UTC-aligned on some versions.)
- **Pick-ups:** count of `KEYGUARD_HIDDEN` events (API 28+). On API 26–27 fall back to counting
  `ACTION_USER_PRESENT` broadcasts received by the service (only accurate while the service is
  on; show "—" for days with no data).
- **"Usual":** average of the same metric over the previous 7 full days that have data. Fewer
  than 3 days of data → hide the "less/more than usual" line and show "We'll compare once we
  have a few days."
- **Blocked apps time:** sum of locked targets' time from the engine's counters (accurate,
  includes websites), "Everything else" = screen time − blocked.
- Without Usage access: Home shows only what the engine knows (locked targets) and a card
  "See your full screen time · Allow usage access".

---

### C.6 OEM battery and background (VERIFY ON DEVICE)

- Samsung: *Settings › Battery › Background usage limits* can put apps in "Deep sleeping".
  Our help sheet tells users to add Untangle to "Never sleeping apps".
- Xiaomi / HyperOS / Oppo / Vivo / Realme: an *Autostart* toggle; `openOemAutostartSettings()`
  tries known component names and returns false if none resolve, in which case we show text
  steps.
- Accessibility services are generally kept alive by the system, but some makers still kill
  them. The heartbeat check (§4.5) is how we notice.


## §D · Onboarding (sub-batches 1.4 and 1.5)

23 designed screens, Figma section ids: Splash `117:330`, About you `117:585`, Your results
`117:780`, The fix `117:1359`, Paywall `117:1521`, Set up `117:1585`.
Behaviour reference: `design/prototype/untangle-onboarding-v10.html`.

---

### D.1 Flow

```
Welcome (splash)
  → About you: Age → Scroll time → Pick-ups → Focus signs
  → Your results: Studying (auto) → 38 days → Problem 1 → Problem 2 → Problem 3
  → The fix: Hours back → Moment of pause → Blocking is step one → Watch your focus grow
  → Paywall (trial)
  → Set up: Permissions → (Accessibility disclosure → system settings) → (Usage access settings)
            → (Battery settings) → Pick apps → You're all set
  → Home (or straight into the first game from "Start my first round")
```

Routes: `src/app/(onboarding)/` — `index` (welcome), `age`, `scroll-time`, `pickups`,
`focus-signs`, `studying`, `your-year`, `problem-focus`, `problem-distracted`,
`problem-foggy`, `hours-back`, `moment-of-pause`, `step-one`, `focus-grow`, `trial`,
`permissions`, `accessibility`, `pick-apps`, `all-set`.

**Shared rules**

- Progress bar at the top of every screen after the welcome (`StepProgress`), one segment per
  chapter: You · Results · The fix · Plan · Set up. Back chevron (`‹`) top-left on every screen
  except Welcome and Studying.
- System Back = the chevron. On Welcome, Back exits the app.
- Answers are saved to MMKV (`onboarding.answers`) on every change, and the current step to
  `onboarding.step`. **Resume:** if the app is killed mid-onboarding, it reopens on the last
  screen with answers intact. If the user is past the paywall, it reopens on Set up.
- Single-choice questions auto-advance 500 ms after a tap (the selected row shows its tick
  first). Tapping the already-selected row also advances. Continue stays visible for
  accessibility (TalkBack users).
- Multi-choice: Continue disabled until at least one row is picked.
- Screen transition: content slides 24 px + fades (`motion.duration.base`), the header and
  progress bar stay put.
- Onboarding is complete when "You're all set" is shown; set `onboarding.completedAt`.
  Root layout redirects to tabs when completed.
- Copy is final unless marked **COPY CHANGE**.

---

### D.2 Screens

#### D.2.1 Welcome — `117:330` (variants A `117:332`, B `117:419`/`117:462`/`117:520`)

**Decision needed:** ship **B (3 slides)** — recommended, it explains block → play → grow in
three swipes — or A (one screen checklist). Spec below is B; A reuses the same assets.

| Slide | Visual | Title | Body |
|---|---|---|---|
| 1 | Phone with "Instagram is paused" pause card | Block the apps that pull you in. | Pick the apps and sites. Untangle locks them at the times they get you. **COPY CHANGE** → "Pick the apps and sites. Untangle steps in when you've had enough." (no schedules in v1) |
| 2 | Four game badge tiles (Pattern recall, Don't tap red, Card pairs, Letter guess) + FOCUS letter tiles | When the urge hits, play instead. | A quick focus game takes the place of the scroll. One round, then back to your day. |
| 3 | Rising focus line | Get your focus back. | Short daily practice for your memory, focus and attention. |

- Swipe or tap **Get started** (same button on every slide) → next slide; on slide 3 → Age.
  Dots below the text. The illustration animates in on each slide (240 ms).
- States: default per slide. Edge: font scale 1.3 → title may wrap to 3 lines; the
  illustration shrinks (min 40% of height), never the text.

#### D.2.2 Your age — `117:587`

Title "How old are you?" · Subtitle "So we can show what your habits add up to over the years."
Options (single, auto-advance), stored value = midpoint age:
Under 18 (16) · 18 to 24 (21) · 25 to 34 (29) · 35 to 44 (39) · 45 to 54 (49) · 55 or older (60).

#### D.2.3 Scroll time — `117:634`

"How much do you scroll a day?" · "A guess is fine."
Options → hours used for maths: Under 1 hour (0.5) · 1 to 2 hours (1.5) · 2 to 3 hours (2.5) ·
3 to 4 hours (3.5) · More than 4 hours (4.5) · Not sure (2.65).

#### D.2.4 Pick-ups — `117:681`

"How often do you pick up your phone?" · "In a day. Most people guess low."
Under 50 · 50 to 100 · 100 to 200 · More than 200 · No idea. Stored only (used later on
Progress: "You guessed 50–100. Your real average is 74.").

#### D.2.5 Focus signs — `117:725` (multi-select)

"Do any of these sound like you?" · "Pick any that fit."
Losing focus at work or study · Long videos feel too long · Reading is harder than it was ·
Grabbing my phone without thinking · A foggy or restless mind · None of these.
"None of these" is exclusive: picking it clears the others; picking any other clears it.

#### D.2.6 Studying your answers — `117:782`

No back button. One bar fills over 2.4 s, turns green (`signal.success`), then the screen
fades into the next (no tap). Star field behind (subtle, Skia). If Reduce motion: bar fills in
0.8 s, no star drift.

#### D.2.7 That's N days of your year — `117:814`

- `daysPerYear = round(hours × 365 / 24)` → e.g. 2.5 h → 38.
- Title: "That's **{daysPerYear} days** of your year." (number in bold white).
- Body: "Full 24-hour days of scrolling, worked out from your answers. At this pace, that's
  {daysPerYear × 5} days by the time you're {ageMid + 5}."
- Visual: 365-dot grid, `daysPerYear` dots fill red row by row (0.9 s).
- CTA "Is there more?"
- Edge: "Under 1 hour" → 8 days; copy still reads fine. "Not sure" → 40 days and the body
  starts "If you're like most people, that's …" **COPY CHANGE (new line)**.

#### D.2.8 Problem 1 · Your focus is shrinking — `117:1199`

Bar chart: 2½ min (2004, green) vs 47 s (2016–20, red), "−69%" curved arrow. Source line
"Gloria Mark, UC Irvine · workplace studies, 2004 and 2016–2020". CTA "Can this change?".
Carousel dots 1/3. Bars grow on enter (480 ms, stagger 120 ms).

#### D.2.9 Problem 2 · You get distracted easily — `117:1239`

Laptop with "Q3 investor update" doc + phone stack, "20 min" timer chip. Body: "One
notification. One quick look. One more video. Twenty minutes later, you look up." Dots 2/3.

#### D.2.10 Problem 3 · Your focus feels foggy — `117:1300`

- Grumpy fog cloud illustration (asset), "{k} of 5 focus signs" pill progress (k red segments).
- `k` = number of signs picked (excluding "None").
- Body (k ≥ 1): "You ticked {k} of 5 signs of a scattered mind. That's common, and it's the
  part you can train."
- k = 0 ("None of these"): title "Your focus is worth guarding." Body "You didn't tick any
  signs. Good. Most people only notice the slide once it has happened." **COPY CHANGE (new
  variant)**, cloud swapped for a calm one.

#### D.2.11 Hours back — `117:1361`

- Two lines over a year: red "Same as now", green "30 min less a day".
- `goalCut = hours ≥ 1 ? 30 min : 15 min`; `hoursBack = round(goalCut/60 × 365)` → 183.
- Title: "But you can get **{hoursBack} hours** back." Body as designed. CTA "Show me how".

#### D.2.12 Moment of pause — `117:1400`

Phone mock with the pause card ("A moment of pause · Instagram is blocked until 6 pm") —
**COPY CHANGE** in the mock to "Instagram · You've had your 30 min today." (no schedules).
Title "Meet your moment of pause." Body "Open an app you've chosen to block and Untangle steps
in, so you get to choose what happens next." CTA "See how it works".

#### D.2.13 Blocking is step one — `117:1433`

Three numbered steps (Block the pull / Practise focus / Get your focus back). **COPY CHANGE**
step 1 body: "Locks the apps that hook you once you've had your share." CTA Continue.

#### D.2.14 Watch your focus grow — `117:1474`

Example bar chart Wk 1–6, last bar "48 min". Caption "Example. Yours fills in from your first
day." CTA Continue.

#### D.2.15 Paywall (trial) — `117:1523`

- Title "Try Untangle free for 3 days." Sub "Every block, every game and your full plan."
- Plan cards from RevenueCat offering `default`: **Yearly** (selected by default, "SAVE {x}%"
  badge, "Just {weekly} a week", price "a year") and **Monthly**.
  `x = round((1 − yearly / (monthly × 12)) × 100)`; `weekly = yearly / 52` formatted in the
  store currency. Never hard-code $ amounts; the designed $29.99 / $6.99 are the Play Console
  base prices.
- CTA "Start 3-day free trial" (yearly) / "Start 3-day free trial" (monthly, if the offer has a
  trial) else "Subscribe". Fine print: "3 days free, then {price} a year. Cancel any time in
  Google Play." **COPY CHANGE** ("in Settings" → "in Google Play").
- Footer: Restore · Terms · Privacy.
- **Close (✕)** top-right, appears after 2 s. Closing continues to Set up on the **free** tier
  (Play policy and user trust; see README decision 8).

| State | What shows |
|---|---|
| Loading prices | Skeleton cards, CTA disabled |
| Prices failed (offline) | "Can't load prices. Check your connection." + Retry; Close visible immediately |
| Purchasing | CTA spinner, cards disabled |
| Success | → Set up, Pro badge state saved |
| Cancelled by user | Back to paywall, no error |
| Error (billing unavailable, pending payment) | Toast with Play's message; "Pending" → "Your payment is pending. You can start setting up." and continue as free until confirmed |
| Already subscribed (restore finds Pro) | Toast "Welcome back. Pro is active." → Set up |
| Restore found nothing | Toast "No purchase found for this Google account." |

#### D.2.16 Permissions — `117:1587` (**COPY CHANGE: three permissions**)

Title "Three quick permissions." Body "Untangle can't block anything without them. Your phone
will ask for each one. Tap allow, and we'll bring you straight back."
Rows (each shows a tick when granted, checked live on every return to the app):

1. 🛡️ Accessibility — "So we can step in when a blocked app opens"
2. 📊 Usage access — "Your real screen time and pick-ups"
3. 🔋 Battery: Unrestricted — "So your phone never switches blocking off"

Footnote "Nothing leaves your phone. You can turn any of these off later in Settings."
CTA "Allow permissions" walks them in order, skipping granted ones:
Accessibility → disclosure screen (2.17) → system settings; on return → Usage access settings;
on return → battery list. After the last, CTA becomes "Continue".

| State | Behaviour |
|---|---|
| None granted | CTA "Allow permissions" |
| Some granted | Granted rows ticked; CTA "Allow the rest" |
| All granted | CTA "Continue" |
| User returns without granting Accessibility | Row shows "Not on yet" in warning colour; CTA "Try again"; a text link "Skip for now" appears after the second attempt (then Home shows the "Blocking is off" banner) |
| Accessibility toggle greyed out (restricted settings) | After 2 failed returns, sheet "Can't turn it on?" with steps: App info › ⋮ › Allow restricted settings, then try again |
| Usage access denied | Allowed to continue; Home uses engine-only numbers (02 §5) |
| Battery not changed | Allowed to continue; Settings shows the "Blocking might stop · Fix it" banner |

#### D.2.17 Accessibility disclosure — `117:1631` (prominent disclosure, Play policy)

Bottom sheet over a dimmed mock of the Accessibility settings. Title "Let Untangle see which
app is open." Body "So we can step in when you open a blocked app. We only check the app or
site name, never your messages, and nothing leaves your phone." Buttons **Agree and open
settings** (→ `openAccessibilitySettings()`) and **Not now** (closes sheet, row stays
unticked). Must not be skippable by tapping outside (explicit choice). This exact screen is
what the Play declaration video records.

`117:1669` (system dialog) is **not built**: it is the Android system's own dialog, shown here
for the video storyboard only.

#### D.2.18 Pick apps — `117:1705`

- Title "What should we block?" Sub "We picked the usual suspects from your phone. Change
  anything."
- List = installed launchable apps that match the **suspects list** (Instagram, TikTok,
  YouTube, X, Reddit, Snapchat, Facebook, Threads, Pinterest, Netflix, Twitch, Discord, Tumblr,
  9GAG…; package names in `features/locks/suspects.ts`), sorted by usage time in the last 7 days
  (if Usage access) else by that list's order. Top 3 pre-selected.
- "+ Add other apps" opens the full app picker (same component as in the lock flow).
- "+ Add websites" opens the website add sheet (20-core-app §6.3).
- Allowance row **(new, COPY)**: "Daily limit for each: 30 min · Change". Tapping opens the same
  allowance sheet as the lock flow. Default 30 min, opens unlimited, strictness Gentle.
- CTA "Block {n} apps" (or "Block {n} apps and {m} sites"); disabled at 0 with label "Pick at
  least one".
- Creates one Lock per target.

| State | Behaviour |
|---|---|
| Loading app list | 6 skeleton rows |
| No suspects installed | Empty block: "None of the usual ones are on this phone." + the full picker opens inline |
| Usage access missing | Rows show no minutes; sorting by list order |
| User deselects all | CTA disabled |

#### D.2.19 You're all set — `117:1753`

Checklist (animated ticks, 150 ms stagger): "Untangle can step in" (Accessibility),
"Real screen time on" (Usage), "Stays on in the background" (Battery), "{n} apps blocked".
**COPY CHANGE:** "Reminders on" row removed. Rows for permissions not granted show an amber dot
and "Off · Turn on" (tap → that setting).
Title "You're all set." Body "Next time you open {App1}, {App2} or {App3}, your moment of pause
will be there." (1 app: "Next time you open Instagram…"; 4+: first two + "and 2 more").
CTA **Start my first round** → today's first training game (game shell, source `training`),
then Home. Secondary text button "Go to home".

---

### D.3 Data written by onboarding

```ts
onboarding.answers = {
  ageMid: number; scrollHours: number; scrollAnswer: string; pickupsAnswer: string;
  signs: string[];            // ids, empty if "none"
}
// + Locks via setLocks(), + settings defaults (strictness gentle, unlock 5 min, daily goal 3)
```

### D.4 Tests

- Maths: daysPerYear, ×5 line, hoursBack (15 vs 30 min), SAVE %, weekly price.
- "None of these" exclusivity.
- Resume from each step after process death.
- Permission step state machine (all combinations of granted / denied / greyed out).

### D.5 Open questions

1. Welcome A or B? (Spec assumes B.)
2. Is the 30-minute default allowance on Pick apps right, or should onboarding block the apps
   completely by default (0 min, opens on the pause screen only)?
3. Free tier after closing the paywall: confirm "up to 3 locks + the 3 daily training games". On the free tier Pick apps caps the selection at 3 ("Free plan blocks up to 3. Go Pro for more.").
