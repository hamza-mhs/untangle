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

## Still needed from the owner

1. A real phone over USB for the device checks (permissions, blocking, browsers, battery,
   60 fps, TalkBack).
2. The real package id (replaces `com.TODO.untangle` and the Kotlin namespace).
3. Play Console app + subscriptions, RevenueCat project and `EXPO_PUBLIC_RC_ANDROID_KEY` in
   `.env.local` for the sandbox purchase and restore.
4. Terms and Privacy URLs.
5. Optional: Figma exports for illustrations, game pieces, the Home sky; recorded sounds if the synthesized set should be replaced.
