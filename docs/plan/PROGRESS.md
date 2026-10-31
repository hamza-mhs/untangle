# Progress log

One entry per sub-batch: date, status, decisions, open issues.

## 2026-10-29 · 1.0 Safety commit — skipped (no git for now)

- **Status:** git steps not done. The owner doesn't want any git work yet ("I don't have any
  repo"), and git has no author identity on this machine. The repo still has nothing committed
  (everything staged on `master`).
- **Done:** `.gitignore` now ignores `/android`, `/ios`, `modules/*/android/build/`, `.cxx/`, so
  the eventual first commit won't pull in the 1.1 GB generated `android/` folder.
- **Decision:** sub-batch commits are skipped until git is wanted. Before 1.1 deletes anything,
  the legacy state is kept another way (see the 1.1 entry).
- **Open:** git author name/email, and when to start committing. When git starts, do 1.0 as
  written (legacy commit → `legacy` branch → `v1`).

## Open questions (from the Batch 1 read-through)

1. Welcome screen: B (3 slides, spec default) or A (one checklist)?
2. Pick apps default: 30 min a day, or blocked completely (0 min)?
3. Free tier: up to 3 locks + 3 daily training games, Pick apps capped at 3?
4. Unlock caps per day (3 Gentle, 2 Firm) and the "App unlocked" chip (needed by Batch 2).
5. Real package id (also the Kotlin namespace), before the first production-like build.
6. Figma access for icons and illustrations, or exported files from the owner.
7. OK to download Public Sans (OFL) from the official Google Fonts repository?
8. App icon: placeholder until the logo is decided?
9. Before 1.5: Play Console subscriptions, RevenueCat project, public Android key.
10. `BootReceiver.kt`: delete (spec says no `RECEIVE_BOOT_COMPLETED`)?
11. "Start my first round" in 1.4 goes to Home until a game exists?
12. "+ Add websites" on Pick apps: build the website sheet early in 1.4, or hide until Batch 2?

## 2026-10-29 · 1.1 Cleanup — done

- **Backup instead of a git commit:** the whole project (minus `node_modules`, `android`, `.expo`,
  module build output) is copied to `C:\Work\Hamza Projects\setup-legacy-backup\` before any
  deletion.
- **Packages:** removed every package in §A Step 1. Added `expo-audio`, plus `expo-asset`
  (a required native peer of `expo-audio`; `expo-doctor` fails without it). `expo-audio` is
  configured with recording and background playback off, so it adds no foreground service.
- **iOS:** `targets/`, `modules/blocker-ios/`, `shared/` deleted; `app.config.ts` Android-only
  (`platforms: ['android']`); `withIos` removed from the plugin (Windows CMake fix kept);
  `development-simulator` removed from `eas.json`; `ios` npm script removed.
- **Web:** `index.web.js`, `*.web.ts(x)`, `public/` (Skia web wasm + old comparison PNGs) and the
  web favicon deleted.
- **Old code:** everything in §A Step 3 deleted, plus code that only served removed packages
  (`src/native` speech/health/widgets/liveActivity, the points ledger, backup, guides, DevSkip)
  and old screen pieces (`features/rules/components`, `features/home`, the old paywall UI).
  `src/app` = `_layout.tsx` + placeholder `index.tsx`.
- **Native widget:** the Glance home-screen widget removed from `modules/blocker-android`
  (class, receiver, XML, Glance/Compose dependencies). The rest of that module (foreground
  service, block activity, boot receiver, its permissions) is replaced in 1.3.
- **Manifest:** `SYSTEM_ALERT_WINDOW` (added by the Expo template) is now blocked in
  `app.config.ts`. The old module still declares `FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`,
  `RECEIVE_BOOT_COMPLETED` until 1.3 replaces it.
- **Decisions / deviations (please check):**
  1. `LiveText` was on the delete list, but `Countdown` (keep list) is built on it. It now
     lives inside `Countdown/` as a private helper; it is no longer a design-system component.
  2. `PaywallScreen.tsx` (keep list) could not compile without `paywallMachine`, `PlanOption`
     and `FeatureTable` (delete list), so it was removed with `usePaywall`; 1.5 builds the one
     new paywall. `usePro` now reads only the RevenueCat entitlement; `paywallStore` keeps only
     `lastShownAt`.
  3. `Icon` renders an empty outlined square until the Figma icon set lands in 1.2.
  4. `DatabaseProvider` skips migrations until 1.2 adds the new schema and migration 0001.
  5. `src/services/devMocks.ts` kept (needed by the purchases mock and the dev menu).
  6. `src/i18n/en.json` still holds old strings; 1.2 replaces it with `src/i18n/en/*.json`.
- **Checks:** `npm run check` passes (44 tests). `npx expo-doctor` 20/20.
  `npx expo prebuild --clean -p android` + debug build succeed.
- **Device run:** the owner's phone wasn't detected over USB, so (owner's choice) 1.1 was
  verified on the Android Studio emulator (Android API 37): installs, launches, shows the
  placeholder. Real-phone testing starts at 1.3, where it is required.
- **Open:** USB connection to the owner's phone (needed for 1.3).

## 2026-10-29 · Order change (owner's decision)

The owner's phone isn't reachable over USB yet, so the order is now design first, native later:
1.2 → 1.4 (onboarding screens on the JS bridge mock) → 1.5 (paywall on the mock store) → 1.3
(Kotlin module) and real RevenueCat once a phone and the Play/RevenueCat setup are available.
Answers: Public Sans downloaded (official release, OFL); icons and art from `design/prototype/`
(Figma later); Welcome = version B (3 slides).

## 2026-10-29 · 1.2 Foundations — done in code, emulator check pending

- **Fonts:** Public Sans 400/500/600/700 (github.com/uswds/public-sans v2.001, OFL) in
  `assets/fonts/`; Inter, Inter Tight, JetBrains Mono deleted.
- **Tokens** (`src/design/tokens/`): `color` (palette + semantic, focus-group colours, monogram
  colours), `space` + `layout`, `radius`, `type` (13 roles, font-scale caps), `motion`, `size`,
  `elevation`, all from 00-foundations §4 and the prototypes' CSS. Old token files deleted.
- **Icons** (`src/design/icons/glyphs.ts`): 46 glyphs from the app prototype's icon set and tab bar,
  drawn with react-native-svg by one `Icon` component. *Deviation:* one data table instead of one
  file per icon (spec §3), easier to extend from Figma later.
- **Components** (`src/design/components/`, each with a test): Screen, Header, StepProgress,
  ProgressDots, Button (primary/brand/secondary/ghost/danger, lg/md, loading, disabled),
  OptionRow, ChoiceChip, CategoryChip, Card, ListGroup/ListRow, Toggle, Stepper, Segmented, Sheet,
  AppIcon/SiteIcon (monogram fallback), StatTile/StatsGrid, BarChart, HourChart, Ring, TabBar,
  Toast/ToastHost, EmptyState, Banner, GameCard, GameIcon (placeholder art), Text, Icon,
  PressableScale, Skeleton, Countdown, RadioDot, ErrorBoundary. Old components deleted.
  `Text` uses `variant` (not `role`, which clashes with React Native's accessibility `role`).
- **Navigation:** root `Stack.Protected` on `onboarding.completedAt`; `(onboarding)` stack with
  19 placeholder screens (progress bar per chapter, back rules, resume on the saved screen);
  `(tabs)` with the custom floating tab bar (expo-router/ui headless tabs) and 4 empty tabs;
  `/dev` (menu + kitchen sink), redirected away in production builds.
- **Storage:** new drizzle schema (game_results, game_bests, daily_summary, detours,
  focus_sessions) and first migration (`drizzle/0000_init.sql`; drizzle numbers from 0000). The
  database file is now `untangle-v1.db` so the old scaffold's tables are never reused.
  Onboarding store holds `answers`, `step`, `completedAt`; settings defaults (gentle, 5 min, goal 3).
- **i18n:** `src/i18n/en/{app,common,dev,onboarding,tabs}.json`.
- **Lint:** hex colours, raw `fontSize` literals, `expo-haptics` imports and deep imports into
  another feature (`@/features/x/...`) are errors in `src/app` and `src/features`.
- **Removed in this step:** old onboarding UI, old `accessStore` (Screen Time), old dev controls.
- **Checks:** `npm run check` passes (80 tests).

## 2026-10-30 · 1.4 Onboarding screens — done (emulator, mock bridge)

- **Screens:** all 18 onboarding routes except the paywall (`trial`, 1.5) are built in
  `src/features/onboarding/screens/` (routes are one-line re-exports): Welcome B (3 slides,
  swipe or Get started), Age / Scroll time / Pick-ups (single choice, auto-advance 500 ms,
  tapping the picked row also advances), Focus signs (multi, exclusive "None"), Studying (2.4 s
  bar → green → moves on; 0.8 s with Reduce motion; no back), N days of your year (365-square
  grid fills in 0.9 s), Problems 1–3 (with dots), Hours back, Moment of pause, Step one, Focus
  grow, Permissions + Accessibility disclosure, Pick apps, You're all set. Shared frame:
  progress header, back rules (system Back = chevron; none on Studying), 24 dp slide + fade on
  enter, per-screen glow.
- **COPY CHANGES applied:** welcome slide 1 body, "Not sure" year body, k = 0 foggy variant
  (calm cloud), pause mock "Instagram · You've had your 30 min today.", step-one body, three
  permissions (no notifications), "Reminders on" row removed, allowance row on Pick apps.
- **Logic (pure, tested):** `features/onboarding/logic.ts` (daysPerYear, ×5 line, goal cut
  15/30 min, hoursBack, year lines, sign toggling, app-name summary),
  `features/onboarding/permissions.ts` (walk order, CTA label, Not on yet, Skip after 2
  failures, restricted-settings sheet once), `features/locks/suspects.ts` (suspects list and
  ranking by 7-day usage), `features/locks/domain.ts` (website normalisation),
  `features/locks/locksStore.ts` (MMKV copy, every change written through `blocker.setLocks`).
- **Pick apps:** top 3 suspects on, one lock per target (30 min/day, opens unlimited, strictness
  from Settings, Gentle by default), "Add other apps" sheet (full list), "Add websites" sheet
  (validation + duplicates), allowance sheet (Block all day / 15 / 30 / 45 / 60 min), free
  plan capped at 3 targets with the "Free plan blocks up to 3" message, skeleton rows while
  loading, "None of the usual ones" + inline full list.
- **Resume:** reopens on the saved screen after the app is killed (tested for every step);
  the disclosure resumes on Permissions. The welcome route does the redirect (an effect in the
  layout called the router before it was ready, found by the new tests).
- **Dev menu state gallery:** mock phone (accessibility grant / deny / restricted on return,
  usage and battery grant / deny, installed apps usual / no suspects / loading), reset
  permissions + locks, answer presets (typical, under 1 hour, not sure, no signs), jump to any
  screen.
- **Deviations (please check):**
  1. Illustrations are react-native-svg components (`src/design/illustrations/`) redrawn from
     the prototype's SVG paths, not WebP exports: the prototype art is looping CSS animation
     with particles, so a clean still couldn't be captured, and vectors stay sharp and can
     follow Reduce motion. Swap for Figma exports later if wanted.
  2. `onboarding.completedAt` is set when the user leaves "You're all set" (both buttons),
     not when it is shown: the root guard would otherwise switch to the tabs at once.
  3. "Start my first round" goes Home until the games arrive (Batch 3.1).
  4. "Not now" on the disclosure counts as a failed attempt, so "Skip for now" is reachable.
  5. Website validation uses a short bundled list of two-part suffixes (co.uk, com.au, …),
     not the full public-suffix list.
  6. Toggles use the design-system green (`signal.success`); the Pick apps screenshot shows
     violet.
- **Checks:** `npm run check` passes. Walked the whole flow on the API 37 emulator (welcome →
  all set → tabs). Real-phone permission tests wait for 1.3.

## 2026-10-30 · 1.5 Onboarding paywall — done on the mock store

- `features/paywall/PaywallScreen.tsx`: one reusable paywall (onboarding `trial` now, Settings
  and the 4th lock in Batch 2). Yearly (selected, SAVE %, "Just {weekly} a week") and Monthly
  from the RevenueCat offering `default` (`$rc_annual`, `$rc_monthly`); CTA "Start 3-day free
  trial" when the plan has a free phase, else "Subscribe"; fine print "Cancel any time in
  Google Play" (COPY CHANGE); Restore · Terms · Privacy; ✕ after 2 s (at once when prices fail)
  → Set up on the free tier.
- States: loading skeletons (CTA disabled), offline + Retry, purchasing spinner (cards
  disabled), success → Set up with Pro saved, cancelled (nothing), failed / billing
  unavailable / offline toasts, pending → toast and continue as free, restore found ("Welcome
  back. Pro is active.") / none ("No purchase found for this Google account."). All reachable
  from the dev menu (Mock Play store: prices ready / loading / offline, purchase result,
  restore result) plus Force Pro.
- `features/paywall/pricing.ts` (tested): SAVE % = round((1 − yearly / (monthly × 12)) × 100),
  weekly = yearly / 52 (monthly × 12 / 52), formatted in the store currency with `Intl`.
- `services/purchases`: plans now carry `price`, `currencyCode`, `hasTrial`; the offering is
  `all.default` (falls back to `current`); key from `EXPO_PUBLIC_RC_ANDROID_KEY` (the old
  `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` still works); iOS key removed from `.env.example`.
  Mock prices are the designed Play base prices ($29.99 / $6.99), used only by the mock.
- **Not done (needs you):** sandbox purchase with a Play license tester. Needs the Play Console
  app with the two subscriptions, the RevenueCat project and its public Android key in
  `.env.local`.
- **Open:** Terms and Privacy URLs are placeholders (`LEGAL_URLS` in `PaywallScreen.tsx`).
- **Known (dev only):** deep-linking to an onboarding route after onboarding is complete
  trips the tab layout ("Tab trigger 'index' … must point to a route within the tabs layout").
  The dev menu resets state first; users can't reach it.
- **Checks:** `npm run check` passes; paywall checked on the emulator.

## 2026-10-30 · 1.3 Native module — done in code (+ the 2.1 engine), device checks pending

- `modules/untangle-blocker` replaces `modules/blocker-android` (foreground service, overlay
  block activity, boot receiver and widget code deleted). Kotlin, Expo Modules API, module name
  `UntangleBlocker`, namespace still `com.todo.untangle.blocker` (TODO with the package id).
- **Bridge** (`UntangleBlockerModule.kt`, mirrors `src/native/untangleBlocker.types.ts`):
  permission checks and openers (accessibility, usage access, battery list, OEM autostart, app
  info), service health, installed launchable apps + cached PNG icons, usage today / range,
  setLocks / getLocks, setSettings, focus start / end, today's counters, grantUnlock,
  openTarget, goHome, `blocked` event.
- **Built ahead (2.1):** `EnforcementEngine` + `Tracker` (pure Kotlin: focus, unlock window,
  0-minute locks, the over-the-limit open, time with exact re-check, 30 s same-open rule,
  screen off, midnight), `BlockerStore` (SharedPreferences `untangle_blocker`, JSON, parsed
  once), `UsageRepository` (queryEvents; KEYGUARD_HIDDEN pick-ups; launcher, system UI and
  Untangle excluded), `AppCatalog`, `BrowserTable`, `Domains` (same rules as the JS),
  `UntangleAccessibilityService` (window events, browser address bar throttled to 500 ms,
  screen receiver, 15 s tick only while a target is in front, one `nextCheckAt`, 60 s
  heartbeat while the screen is on, opens the pause screen).
- **Pause screen route:** the v1 fallback (deep link `untangle://pause?...` into the main
  activity), not a second ReactActivity. Decision noted per 02 §2.1.
- **Manifest:** PACKAGE_USAGE_STATS, launcher / home / https `<queries>`, the service with
  `BIND_ACCESSIBILITY_SERVICE`; no QUERY_ALL_PACKAGES, FOREGROUND_SERVICE,
  REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED.
  SYSTEM_ALERT_WINDOW appears only in the **debug** APK (React Native's debug manifest, for the
  dev menu); check the release APK before submitting.
- **Tests:** 17 JVM unit tests (`./gradlew :untangle-blocker:testDebugUnitTest`) pass.
- **Emulator:** the debug build installs; Untangle is listed under Accessibility › Downloaded
  apps with our description; coming back without turning it on shows "Not on yet" / "Try
  again". I did not approve Android's "full control" dialog myself (a system security
  setting); the owner turns it on when testing.
- **Needs a real phone (owner):** turn the service on and check `isAccessibilityEnabled()`,
  usage numbers vs Digital Wellbeing, the app list, blocking (time, opens, browsers), Back on
  the pause screen.

## 2026-10-30 · Batch 2 Core app — done in code (emulator + mock phone), device checks pending

- **2.1 engine:** built with 1.3 (see above). The pause screen opens by deep link
  (`untangle://pause?...`, route `src/app/pause.tsx`, outside the onboarding/tabs guards).
- **2.2 Locks and Block tab** (`features/locks`): Block tab (Focus card, apps / websites
  sections, row states: used of allowance + ring, Over today's limit, Blocked all day, Off, Not
  installed, Paused by the free plan; new-row highlight 1.5 s), 3-step new-lock flow (kind →
  apps with search / Most used today / All apps A–Z, or website with popular chips, normalising
  and validation → allowance chips + custom steppers + live summary → done sheet with Preview),
  lock detail (toggle, today, allowance sheet, strictness sheet, preview, delete confirm),
  loosening rule (`allowance.ts`, tested matrix) with the "Play a game first" gate (the change
  applies when the game is completed; quitting applies nothing), free cap 3 → paywall.
- **2.3 Pause screens** (`features/pause`): variants Gentle, Firm (30 s wait, 3-min unlock),
  Locked, cap reached, blocked all day, website, Time's up, Focus session; Take a breath
  (3 breaths, 4 s in / 6 s out); game offer → placeholder game → result → "Open {App} for N
  min" (grantUnlock + openTarget) or "stays locked"; detours logged (not for Time's up or
  preview); preview mode with a Preview pill; system Back = Back to my day (go home).
- **Placeholder game** (`features/games/shell`): intro → "tap the circle 10 times in 10 s" →
  result with stars; results and bests saved to SQLite; the 12 hero games are in the catalogue
  with names, groups and lengths so training, the Games tab and the pause offer already use
  them.
- **2.4 Home, Screen time, streak, training** (`features/home`): Home C1 (sky drawn in code,
  streak pill + sheet, settings gear, banners for blocking off / battery, screen time card
  with usual delta and blocked bar, training carousel, blocked apps card with the relevant
  status line, trial-ended card), Screen time (today, pick-ups by hour with detour hours in red,
  tiles, most used with "Limit {App}?" → lock flow at the allowance step, no-access state),
  streak rules and daily training pick (seeded by the date, tested over 1,000 days), daily
  summary sync on launch / return to the app.
- **2.5 Progress** (`features/progress`): week / month, average screen time + % change + bars,
  time back vs first week, detours, games played, pick-ups + "You guessed …", personal bests,
  first-week note, no-usage state, Pro lock on the month view.
- **2.6 Focus now** (`features/focus`): start sheet (15/25/45/60, which targets), running
  screen (countdown ring, targets, breather → Breath count), end-early sheet (play first /
  keep going / end), completion card; one session at a time; logged to `focus_sessions`; native
  end time.
- **2.7 Settings** (`features/settings`): summary line, plan card (free / trial / Pro), warning
  banners, default strictness, unlock length (2/5/10/15, pushed to native), permissions screen
  (+ OEM autostart), What Untangle sees, delete my data (clears SQLite, MMKV except the cached
  entitlement, the native locks and focus; back to Welcome), about + version (7 taps → dev
  menu in dev builds).
- **2.8 In-app paywall + subscription:** `/paywall` (in-app copy, features list, "billed
  yearly" fine print), Subscription screen (plan, weekly price, renewal, switch plan, manage in
  Google Play); free plan pauses locks beyond 3 (oldest kept unless the user's chosen three are
  stored) and the native side only gets the active ones.
- **Fixes found on the emulator:** tab triggers now use group paths (`/(tabs)…`; "/" clashed
  with the onboarding index), missing `format.*` and `settings.*` copy (a new test checks every
  literal i18n key exists), the onboarding resume no longer relies on a module flag.
- **Deviations / open (please check):**
  1. Pause screen = deep link into the main activity (02 §2.1 fallback), not a second
     ReactActivity: it sits in the app's back stack; Back always goes home.
  2. Home sky: a gradient drawn in code instead of `assets/images/home/sky-c1.webp` (no asset).
  3. Focus start sheet has no strictness row (focus never unlocks, so it changes nothing).
  4. "Choose which 3 stay" when Pro ends: the data and native side are done (`freeKeep`); the
     picker UI is still to build (for now the oldest three stay on).
  5. Plan switch on Subscription buys the other package; Play's product-change mode needs the
     real products (device).
  6. Time's up "You stopped on time" shows as a toast and logs nothing.
- **Checks:** `npm run check` passes (213 tests); 17 Kotlin tests pass; walked Home, Screen
  time, the lock flow, preview pause → game → result, Block tab, Focus start / end early,
  Settings and Progress on the emulator with the mock phone.
- **Needs a real phone (owner):** every "On a real phone" item in BATCH-2 (blocking at 1 min,
  opens limit, browsers, Back, battery < 1 %).

## 2026-10-30 · Batch 3.1 Game engine + hero set — done in code, device checks pending

- **Engine** (`features/games/engine`): pause-aware `GameClock` (timers, waits and animations
  freeze together; tested), intro (game badge, group + length chips, how-to, Start / Begin,
  pause-screen kicker), 3-2-1-Go countdown (620 ms beats, ring pulse; calm games show the
  settle line instead), HUD (✕ pause, title + round label, 52 dp timer ring with normal /
  warning ≤ 40 % / last 5 s / time up states, time bar, rolling score, streak pill hot at 3,
  hearts, hint line), FX layer (ring, burst, float "+pts", oops shake or red flash with Reduce
  motion, toast), backgrounds (grid / dots / perspective, quiet mode), pause sheet (Resume with
  3-2-1, Restart, Quit; also on leaving the app and on system Back), result (stars landing
  0.25 / 0.5 / 0.75 s, score roll-up, New best, stats; calm variant with check and line).
  Results and bests saved; quitting saves an incomplete round.
- **12 games** (`features/games/list`): Stack tower, Rocket hop, Lane dash, Block fit, Colour
  word, Middle arrow (reaction-time stat), Don't tap red, Echo (2-back), Card pairs, Breath
  count (9 × 4 s in / 6 s out), Silence (2 / 3 / 5 min), Urge surfing (75 s wave). Pure logic in
  `list/logic.ts`, tested over 1,000 seeds where there is a generator (solvable boards, a free
  lane in every Lane dash row, exactly 5 two-back matches, 6 pairs, 28 % red, a placeable Block
  fit tray).
- **3.1e wiring:** the placeholder game is deleted; training, the Games tab, Focus (breather,
  "play first") and the pause screen (with the "You opened {App}. Play this instead?" kicker)
  all open the real games through `REGISTRY`.
- **Checked on the emulator:** Colour word (play, hit, slip, pause sheet, result), Stack tower,
  Block fit.
- **Deviations (please check):**
  1. FX and backgrounds are Reanimated views + SVG, not Skia; the intro shows the game badge,
     not a live autoplay demo of the round.
  2. Game boards are drawn with simple toy shapes in the token colours, not the Enamel / Candy
     gloss pieces; Rocket hop uses an emoji rocket. Figma pieces can replace them later.
  3. Interactive rules were written fresh (the prototype rounds are scripted demos). The
     prototype's top star thresholds are kept; a 1-star band was added for poor rounds.
  4. No sound files exist in the repo, so games are silent (haptics work).
  5. Block fit uses tap-to-pick, tap-to-place instead of dragging.
  6. ESLint's React Compiler purity rules are off for the game engine and boards (imperative
     loops by design); everywhere else they stay on.
- **Checks:** `npm run check` passes (239 tests).
- **Needs a real phone:** 60 fps on a mid-range device, TalkBack pass, pause → Stack tower →
  "Open Instagram for 5 min" end to end with real blocking.

## Batch 3.2.0 · Housekeeping

- **Git:** repo-local identity "Untangle Dev <dev@untangle.local>" (placeholder, as asked).
  The legacy scaffold was recovered from `../setup-legacy-backup` into branch `legacy`
  (`dc873f9`); `v1` starts from it with batch-1 (`93bd458`), batch-2 (`0810dc4`) and batch-3.1
  (`35c9c68`). `main` is untouched.
- **One folder per game:** `src/features/games/games/<gameId>/` (index.ts with a lazy
  `Round`, Round.tsx, logic.ts, `__tests__/logic.test.ts`) for all 12 games; shared board parts
  moved to `src/features/games/kit/`; `list/` is gone. `registry.ts` imports each game's
  definition; the board loads on first play (`React.lazy` + `Suspense` in GameScreen).
- **Sound:** `tools/sounds/generate.mjs` synthesizes 10 WAVs (16-bit mono, 22.05 kHz) into
  `assets/sounds/`: tap, tick, good, bad, go, beep, chime, tone-low/mid/high.
  `src/lib/sound.ts` (the only file allowed to import expo-audio, enforced by ESLint)
  preloads one player per sound when a game opens, respects Settings › Sound and mutes in
  silent and vibrate mode. `GameApi.sound(id)` added.
  - Engine: countdown tick ×3 + go, `good` on every `fx.hit`, `bad` on every `fx.oops`,
    chime when a calm game ends.
  - Games: tap on input (Block fit, Card pairs, Colour word, Echo, Lane dash, Middle arrow,
    Rocket hop, Stack tower), tick per Echo shape, low/high tone per breath in/out, chime when
    Silence starts.
- **Bug fixed:** the result screen showed each game's own formula (e.g. Block fit
  `lines × 25` = 0) instead of the points on the HUD. Once a round has called `addScore`, the
  engine now uses the HUD total as the result score and best (`RoundResult.score` is still
  optional, so the GameApi contract is unchanged).
- **Deviations (please check):**
  1. Silent mode uses expo-audio's own `playsInSilentMode: false` (Android suppresses
     playback in silent and vibrate mode), so no native `getRingerMode()` and no native rebuild
     were needed. Found and fixed on the emulator: a finished player restarted by `seekTo(0)`
     bypassed that check, so `playSound` now pauses before seeking.
  2. Echo plays a neutral tick per shape, not a pitch per shape, so sound doesn't give away
     matches.
- **Checked on the emulator:** Colour word (countdown → hit → result), Stack tower (also
  quit from the pause sheet), Block fit (result score = HUD score). Audio log: 15 plays in
  normal mode, 0 in silent, 0 in vibrate, sound back when normal again. Screenshots in
  `docs/evidence/3.2.0/`.
- **Checks:** `npm run check` passes (63 suites, 242 tests).
- **Needs a real phone:** sound latency and volume on a speaker, silent / vibrate switch.

## FIX F1 · Skia glow

- `src/design/components/Glow` rebuilt on Skia 2.14: real-pixel canvas (measured box), a circle
  unless an ellipse is asked for (canvas squash about the centre), ≥ 3 gradient stops, `dither`
  on the paint, a fractal-noise grain at 3 % composited `srcATop` (only inside the glow's own
  alpha), optional `BlurMask` for CSS `box-shadow` halos, optional pulse (Reanimated shared
  value on the UI thread, off with Reduce motion).
- Presets in `src/design/tokens/glow.ts`, every value from the prototypes (exact colours added
  as `color.glow.*`):
  - Onboarding `.p2 .glow`: 560 px circle on the 320 px phone → r = 0.875·W, centre 42 %,
    CSS `closest-side` linear falloff (a → a/2 at 0.5 → 0). Welcome violet .14, About you white
    .035 (new), Your year red .12, Problems red .10, Hours back mint .12, Moment of pause violet
    .24, Step one violet .16, Focus grows mint .12, Paywall violet .20, Permissions violet .16,
    Accessibility violet .14, Pick apps violet .12, All set mint .16.
  - Studying orb `.orb .oh` (#C9A8FF .35 → #8B3DFF .12 at .55 → 0, 2.6 s breathing) and core
    halos (`box-shadow` 24 px white .55, 60 px #A57BFF .40).
  - Take a breath `.bcirc` (cobalt .55 → .08 at .7) + 60 px halo .35.
  - Game result `.succ` ellipse 70 % × 45 % at (50 %, 32 %), accent .30 → 0 at 70 %.
- Evidence: `docs/evidence/F1/index.html` (app vs design side by side). Measured on the
  emulator: a 16-level glow has a longest flat run of 14 px (no rings).
- **Deviations / notes (please check):**
  1. Problems 1–3 all use the carousel's red .10 (the prototype shows them as one carousel), also
     the calm "Your focus is holding up" variant, which used to be violet.
  2. The paywall uses the onboarding paywall glow (centre violet .20), not the in-app `.pw` top
     glow, because one screen serves both.
  3. The pause screen itself has no glow (the app prototype's pause sheet has none); only the
     Take a breath orb changed.
  4. A Skia canvas paints its first frame a moment after layout, so a glow can appear ~0.2 s
     after the screen.
- **Left for later sub-batches:** the game background's stretched oval (visible under the game
  result) → F2; Studying stars (stretched SVG dots), FogCloud mist ellipses and the Hours back
  chart (stretched, oval end dots) → F3; Breath count orb → F4; Home sky (stretched SVG clouds)
  is not in the fix file — flagged for STEP 7.
- **Checks:** `npm run check` passes (243 tests).

## Batch 3.2a · Attention

- **Order change (owner, 2026-10-30):** games first; visual fixes F2–F5 resume after the game
  batches. F1 (Skia glow) is done.
- Four games, one folder each under `src/features/games/games/`, ported from
  `_g2games.js`, `_g2live.js` and `_g2b4.js`:
  - **Swap it** (`swapIt`, persp, card back `#5B4BC4` → new token `color.game.indigo`, glow
    cobalt): 5 rounds, star shown 900 ms, `2 + r` swaps at `max(240, 440 − 45r)` ms with one card
    lifting and one dipping, `20 + 5r` points; 3★ no misses.
  - **Flash count** (`flashCount`, dots, sun): 8 trials, `min(9, 3 + ⌊0.8n⌋ + 0/1)` beads ≥ 40 px
    apart in the 264 × 200 well, flash `max(450, 900 − 50n)` ms with the `beep` sound, beads come
    back faint after the answer, `10 + 2·count` points; 3★ right ≥ 7.
  - **Spot the odd one** (`spotTheOddOne`, dots, sun): 8 rounds of 4 × 4, odd tile mixed toward
    white by `max(8, 30 − 3r)` % or flipped every third round, tiles pop in 18 ms apart (off
    with Reduce motion), `10 + 5r` points; 3★ found ≥ 7.
  - **Track the stars** (`trackTheStars`, dots, sky, glow cobalt): 4 rounds, 8 beads, 2/3/4/4
    targets glow 1.3 s, 3.6 s drift (prototype speed, with repulsion so beads don't overlap),
    +15 each; 3★ none lost. The drift is precomputed per seed and played on the UI thread; it
    holds while the game is paused.
- Each game: haptics + sounds, TalkBack labels on cards/keys/tiles/beads, results + best saved by
  the engine, 1,000-seed logic tests. The prototype's top star thresholds are kept; a 1-star band
  was added.
- Shared: `Well` (recessed field) in `kit/`; optional `glow` accent in the catalog for games
  whose background glow differs from their accent; GameRoute no longer navigates during render
  (it logged a React warning for unknown ids).
- **Checked on the emulator:** all four start → result (`docs/evidence/3.2a/index.html`, side by
  side with the design); the Games tab lists 16 games.
- **Deviations (please check):**
  1. The streak pill reads "Streak N" (a real streak). The prototype pill shows "Found N" /
     "Rounds N"; that needs a label on `api.combo`, which is a GameApi change, so I'm asking first.
  2. Pieces are flat token colours (no Enamel / Candy gloss materials), as in 3.1.
- **Checks:** `npm run check` passes (257 tests).

## Batch 3.2b · Memory

- **Pattern recall** (`patternRecall`, grid, violet): 3 × 3 toy pads in the prototype's colours,
  5 rounds of `round + 2` pads lit 420 ms / 170 ms gap while the background is quiet, 3 lives
  (a wrong pad costs one and replays the round with a fresh pattern), +10 per pad, +30 per
  perfect round, 32 s; 3★ all 5 cleared. Each pad also plays a tone (low / mid / high) as it lights.
- **Number span** (`numberSpan`, grid, cobalt): 4 → 6 digits shown 620 ms / 140 ms gap, keypad
  1–9 · ⌫ · 0 · ✓ (new `backspace` icon), digits drop into wells that turn mint / red on ✓,
  3 lives, +10 per digit, +30 per perfect span, 45 s; 3★ cleared 6.
- **Deviation (please check):** Number span checks the answer on ✓ (so ⌫ is useful, as in the
  design); the prototype checked each digit as it was tapped.
- **Checked on the emulator:** both start → result, a life lost on a wrong pad / digit
  (`docs/evidence/3.2b/`). Fixed on the way: "Longest" now counts only spans actually cleared.
- **Checks:** `npm run check` passes (263 tests).

## Batch 3.2c · Flexibility & self-control

- **Stop on the beep** (`stopOnTheBeep`, grid, mint, glow sky): 16 trials, 4 stops in random
  slots (never first, never back to back), red flash + `beep` 120–220 ms after the arrow, hold
  900 ms to score (+20), go trials +10 within a 1.1 s window; 3★ no failed stops.
- **Opposite day** (`oppositeDay`, dots, violet): 14 arrows (no direction twice in a row) on a
  pink token, toy D-pad with a recessed centre, `10 + 3·(streak − 1)` points; 3★ right ≥ 13.
- **Rule flip** (`ruleFlip`, dots, pink): 16 pieces, rule colour → shape → colour before the 7th
  and 13th, badge flips (FlipInXUp; off with Reduce motion), piece flies to the tapped bin,
  `10 + 2·(streak − 1)` points; 3★ sorted ≥ 14.
- **Sort the stream** (`sortTheStream`, dots, mint, glow sky): 20 cards, one switch colour →
  shape before the 9th, swipe the card (PanResponder) or tap the side buttons, `8 + streak`
  points; 3★ sorted ≥ 19.
- Shared in `kit/`: `Arrow` (stroke arrow, as in the designs), `sortRules.ts` (sides, rule
  timeline, trap pieces), `SortPiece` / `SortBin`. The first piece after every rule change is a
  "trap" where the two rules disagree, so the flip always matters (tested over 1,000 seeds).
- **Deviations / questions (please check):**
  1. The prototype rounds are scripted demos, so real-play rules were added: Stop on the beep's
     1.1 s go window and random (not every 4th) stops; trap pieces after each rule change.
  2. **Sort the stream vs Rule flip:** the prototype's designer note says "Overlaps Rule flip,
     so keep only one in the app". The batch spec lists both, so both are built; tell me if one
     should be hidden.
  3. Sort the stream uses React Native's `PanResponder` for the swipe (one discrete swipe; the
     side buttons cover TalkBack). Gesture Handler 3's new hook API wasn't needed for this.
- **Checked on the emulator:** all four start → result (`docs/evidence/3.2c/`). Fixed on the way:
  Rule flip bins lost their labels (flex in an unsized cell), and the "New rule" hint now only
  shows on the piece right after a flip.
- **Checks:** `npm run check` passes (277 tests).

## Batch 3.2d · Numbers & timing

- **Quick maths** (`quickMaths`, grid, orange): 10 sums (+, −, ×) with 4 toy-key answers
  (prototype near-miss distractors), a small per-question ring (new `kit/RingTimer`, 4.5 s,
  white → amber → red) under the 30 s game timer, `10 + 5·(streak − 1)` points; 3★ right ≥ 9.
- **Bigger total** (`biggerTotal`, grid, orange, glow sun): 12 pairs of three 1–9 tiles (ties
  nudged apart), a 3.5 s bar, totals flip up over the bins after the pick, `10 + streak` points;
  3★ right ≥ 11.
- **Time it right** (`timeItRight`, persp, orange): 5 tries, hand sweeps 2 s then hides (quiet
  background), one big toy button, white 5.00 s / orange you markers on a 3–7 s line, tries row,
  "Closest yet" toast, `max(5, 100 − |err|·300)` points; best = closest error (lower); 3★ < 0.1 s.
  No tap by 8 s counts as a try.
- **Orbit switch** (`orbitSwitch`, dots, sky, glow violet): marble on two rings, tap to hop,
  `min(4, 2 + laps)` red blocks alternating rings with a spark opposite each, +0.12 rad/s per
  lap, 3 lives, +20 per lap, +10 per spark; 3★ no bumps.
- **Deviations (please check):**
  1. Orbit switch starts on the **inner** ring. The prototype (a self-playing demo) starts outer,
     which meets the first block ~0.5 s after the board appears; inner gives ≥ 1.5 s and a free
     first spark (tested over 1,000 seeds).
  2. Pieces are flat token colours (no Enamel / Candy gloss materials), as in 3.1–3.2c.
- **Checked on the emulator:** all four start → result, plus pause → quit (`docs/evidence/3.2d/`).
  Fixed on the way: Quick maths and Bigger total boards now sit under the HUD as in the designs
  (Bigger total: totals above narrower tiles); Orbit switch's marble no longer sits at the
  top-left corner before the round starts.
- **Dev note:** `CI=1 npx expo start` turns off Metro's file watching, so edits never reach the
  app; start Metro without `CI` when testing on the emulator.
- **Checks:** `npm run check` passes (290 tests).

## Batch 3.2e · Wiring

- **New tag:** a game is New when it's in the latest batch (`latestBatch()`, dotted-number
  compare) and fewer than 14 days have passed since this install first saw that batch (new
  `newGames` MMKV store, marked when the Games tab opens). So the 14 daily-core games are New
  for two weeks after the update (or the install), and the 3.1 hero set no longer is. The New
  filter shows only those games, with its own empty line ("Nothing new right now…").
- **Training rotation and pause pool:** both already build from the whole catalogue
  (`pickTraining`, `pickPauseGame` with `isQuickGame`), and every 3.2 game is ≤ 45 s and not
  Calm/Active, so all 14 are in. New `__tests__/wiring.test.ts` checks it: every game has a
  board and strings, exactly the 14 are New on day 0–13 and none on day 14, each of them turns
  up in training within 60 days and in the pause pool.
- **Note:** a card shows one tag, and Pro wins over New (existing `GameCard` rule), so a free
  user sees New only on today's training games; Pro users see it on all 14.
- **Checked on the emulator:** Games tab All / New filter (`docs/evidence/3.2e/`).
- **Checks:** `npm run check` passes (295 tests).

## Batch 3.3.0 · Content pipeline

- **`npm run content`** (`tools/content/build.ts`, run with `tsx`, now a devDependency) writes
  `games/<gameId>/content.json` for 11 games, deterministic (fixed seeds, stable ids). Each
  game's generator is in `generate.ts` (build-time only) and its solver in `logic.ts`, shared
  by the build, the tests and (later) the rounds. Details in `tools/content/README.md`.
- **Word list:** ENABLE (public domain, `tools/content/data/enable1.txt`, downloaded once with
  the owner's OK). Accepted = ENABLE 3–8 letters minus `blocklist.txt` (79,898 words); answers
  come from the hand-curated `common.txt` (3,095 words) so puzzles never hinge on obscure words.
- **No repeats within 30 days:** `RoundResult.items` (new optional field) is saved in
  `game_results.stats_json`; `recentItemIds()` reads it back and `kit/content.ts`
  `pickUnplayed(items, recentIds, seed, n)` serves fresh items first, then the oldest
  (tested over 1,000 seeds). `servableItems()` hides `reviewed: false` content outside dev
  builds; `kit/roundContent.ts` `pickRoundItems()` puts it together for a round.
- **Packs (every item re-checked by a test):** Flow lines 300 (5×5 + 6×6, unique solution),
  Slide escape 220 (BFS minimum moves 4–14 recorded), Path painter 220 (one-stroke path
  exists, ≤ 8 working starts), One-line art 200 (12 hand icons, 0 or 2 odd points), Mini
  nonogram 160 (26 hand pictures, line-solvable), Word bridge 220 (BFS shortest 3–5 steps,
  doable with common words, plus the 4-letter dictionary), Word trails 220, Letter forge 220
  (each rack has a 6+ letter word and lists every word it makes, so no dictionary ships),
  Mini crossword 103.
- **Hand-written (drafted by Claude Code, `reviewed: false`, dev builds only until the owner
  reviews):** Category clusters 132 puzzles, Letter guess 419 clue + word pairs, and the
  3-letter crossword clues (`tools/content/clues/clues3.json`, 381 words).
- **Deviation (please check):** Mini crossword is **3×3** (rows 1/4/5 across, columns 1/2/3
  down, six different words), as in the design and prototype; the plan text said 5×5.
- **For the owner to review before release:** `blocklist.txt`; the three hand-written packs.
  Notes from the drafts: a few clues use British words (bin, hob, cot, mum, biscuit); some
  clues could fit two answers (e.g. "Forest animal with antlers" deer/elk); Category clusters
  puzzles flagged as weaker: cc-0043, 0049, 0055, 0057, 0062, 0064, 0072, 0080, 0091, 0095,
  0102, 0104, 0111, 0129, 0131.
- **Checks:** `npm run check` passes (331 tests).

## Batch 3.3a + 3.3b · Grid and mechanical puzzles (one commit)

Committed together because they share the catalog, registry and strings changes.

- **Shared:** `kit/useDrag.ts`: `useGridDrag` (snaps to cells, fills in skipped cells one
  orthogonal step at a time) and `usePointDrag` (nodes/beads), both Gesture Handler 3 Pan with
  hit-testing on the UI thread; JS only hears about changes. Every drag game also works by
  tapping (start, then neighbouring cells), which is the TalkBack path.
- **Flow lines** (`flowLines`, dots, mint/sky): one 5×5 and one 6×6 board from the pack;
  entering another colour's tube cuts it; redraw = a joined pair that gets broken; board lights up.
- **Slide escape** (`slideEscape`, grid, mint/sky): an easy (≤ 5 moves) then a harder board;
  drag along the axis, snaps on release; quiet "Can be done in N moves" line.
- **Path painter** (`pathPainter`, dots, sky/mint): one stroke over every free square; drag back
  to undo; trapped → wipe and retry the same board.
- **One-line art** (`oneLineArt`, grid, sun/orange): one named icon per round when possible;
  repeat a line, reach a dead end or lift mid-stroke → reset with the odd-points tip.
- **Laser lab** (`laserLab`, grid, pink/violet): 3 generated labs (route-first generator,
  1,000-seed tests: solvable, not solved at start, minimum turns exact); beam above the mirror
  bases, below the bars.
- **Merge garden** (`mergeGarden`, dots, mint): 4×4 plot, prototype spawn rule plus a rescue
  rule so a plot is never stuck (1,000-seed tests); "Moves N" pill on the board.
- **Mini nonogram** (`miniNonogram`, grid, pink/violet): tap to fill, hold to mark empty; a
  wrong square shows ✕ and costs a life; round label "MYSTERY PICTURE" (the prototype showed the
  answer).
- **Bridge builder** (`bridgeBuilder`, persp, orange/sun): 3 generated bridges, decoys always
  one unit off so the fit is unique; Pip (placeholder sprite, `PipPlaceholder.tsx`) walks across.
- **Fixed on the emulator:** Pan translation starts at activation, not at touch-down, so drags
  came up a cell short (Slide escape, Bridge builder): now measured from the touch-down point.
  Rounds that complete nothing get a gentler title (Slide escape, Path painter, One-line art,
  Laser lab, Bridge builder).
- **Deviations (please check):**
  1. The combo pill always reads "Streak N" (engine), where the prototypes say "Boards N" /
     "Labs N"; games pass a sensible count. A label option on `api.combo` would need an engine change.
  2. Enamel / Candy materials toggles aren't built (flat token colours), as in 3.1–3.2.
  3. Laser lab: 3★ needs all 3 labs lit with no extra turns (the prototype rule alone gave 3★
     to a 1-lab round). Bridge builder follows the prototype rule as written (a clean 1-bridge
     round is 3★); say if completion should count.
- **Checked on the emulator:** all eight start → result (`docs/evidence/3.3a/`, `3.3b/`).
  Still for a real phone: drag feel, TalkBack on cells inside the gesture detector.
- **Checks:** `npm run check` passes.

## Batch 3.3c + 3.3d · Word games (one commit)

Committed together because they share the catalog, registry, strings and wiring changes.

- **Shared:** `kit/WordTiles.tsx` (letter wells and the in-game letter keys, used by all but
  Category clusters; the system keyboard is never opened).
  Every word game reads its pack through `pickRoundItems()`.
- **Word trails** (`wordTrails`, dots, violet/pink): six beads on a ring, slide through them
  (`usePointDrag`) and lift to try; sliding back onto the last bead takes a letter off; tap
  path for TalkBack (tap beads, tap the last one again to try). Five tray words per board.
- **Letter forge** (`letterForge`, dots, orange/sun): tap rack tiles into the tray, Forge;
  each rack lists every word it makes, so no dictionary ships; "Long one" cheer for 6+.
- **Word bridge** (`wordBridge`, dots, mint/sky): tap a letter of the rung, then a key; the
  last step into the target word fills itself in. 7 keys: the letters the route needs plus decoys.
- **Letter guess** (`letterGuess`, dots, mint): two words per round, 10-key rack (word letters +
  common distractors), five misses per word (reset each word, as in the prototype).
- **Category clusters** (`categoryClusters`, dots, pink/violet): 4 lives, "One away" on three of
  four, herring hint when the trap word is the odd one out; with two groups found the last one
  solves itself.
- **Mini crossword** (`miniCrossword`, grid, sky/violet): 3×3 (see 3.3.0), rows 1/4/5 across
  typed on 9 board keys; down clues listed under the grid.
- **Review flag:** `GameMeta.devOnly` on Letter guess, Category clusters and Mini crossword
  (their packs are `reviewed: false`). `PLAYABLE` / `playableGames()` hide them from the Games
  tab, training and the pause pool in release builds; dev builds show all 40 games. Training
  coverage test widened from 60 to 150 days for the larger rotation.
- **Checked on the emulator:** all six start → result, best saved, quit from the pause sheet
  (`docs/evidence/3.3c/`, `3.3d/`); all six listed under New in the Games tab.
  Notes from the run: adb injects a whole slide in one burst, so Word trails' UI-thread hit test
  only saw some beads and judged those words as misses; drawn slowly the same words are
  accepted. Worth a look on a real phone with fast swipes. When a round ends while the player is
  still tapping keys, a tap can land on "Done for now" (the result button sits where the keys
  were); happened twice on the slow emulator.
- **Deviations (please check):** the combo pill still reads "Streak N" (as in 3.3a/b); Enamel /
  Candy toggles not built.
- **Checks:** `npm run check` passes (457 tests).

## Still needed from the owner

1. A real phone over USB for the device checks (permissions, blocking, browsers, battery,
   60 fps, TalkBack).
2. The real package id (replaces `com.TODO.untangle` and the Kotlin namespace).
3. Play Console app + subscriptions, RevenueCat project and `EXPO_PUBLIC_RC_ANDROID_KEY` in
   `.env.local` for the sandbox purchase and restore.
4. Terms and Privacy URLs.
5. Optional: Figma exports for illustrations, game pieces, the Home sky; recorded sounds if the synthesized set should be replaced.
