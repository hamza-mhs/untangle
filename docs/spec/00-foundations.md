# 00 · Foundations

Everything every screen depends on. Build this first (Phase 0), together with the cleanup in
[01-cleanup.md](01-cleanup.md).

---

## 1. Scope of v1

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

## 2. Stack (kept from the existing repo)

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

## 3. Folder structure (target)

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

## 4. Design system

Source of truth in Figma: variable collections **Untangle 26 · Colour** and **Untangle 26 ·
Space & radius**. The older collection *Untangle · Colour* and the text styles named
`Untangle/…` (Inter) are obsolete; delete them in Figma when the Public Sans text styles
below are created.

### 4.1 Colour tokens

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

### 4.2 Spacing and radius

`space`: 4, 8, 12, 16, 20, 24, 32, 48, 80 → `space[1]`…, exposed as `space.xs=4, sm=8, md=12,
lg=16, xl=20, '2xl'=24, '3xl'=32, '4xl'=48, '5xl'=80`.

Screen gutters: 24 on onboarding, 18 on tab screens (prototype `padding: 46px 18px 110px`),
16 inside cards.

`radius`: `sm=8, md=12, lg=16, xl=18, card=20, '2xl'=22, '3xl'=24, '4xl'=28, pill=999`.
`card=20` is the most used value in the prototype (cards). Option rows use `xl` (18),
chips and buttons `pill`, app icons 22% of their size (squircle). Add `Radius/20` to the
Figma collection so both sides match.

### 4.3 Typography (Public Sans)

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

### 4.4 Motion

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

### 4.5 Core components (build in Phase 0)

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

## 5. Naming conventions

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

## 6. Data model (JS side)

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

## 7. Time and dates

- A "day" is the device's local calendar day, keyed `YYYY-MM-DD`. Allowances reset at local
  midnight.
- Time zone or clock change: compute the key from the current local time each time; never add
  24 h to a stored timestamp. If the clock moves backwards into a day that already has usage,
  keep that day's usage (do not grant a fresh allowance).
- Durations shown: `<1 min` → "under a minute"; `<60 min` → "42m"; else "1h 42m".
- Times: device 12/24 h setting (`Intl.DateTimeFormat` with `hour: 'numeric'`).

---

## 8. Offline behaviour

Every feature works with no network except: buying Pro, restoring purchases, and reading the
current Play price. RevenueCat caches the last customer info, so Pro status survives offline
restarts. If prices cannot be fetched the paywall shows a "Can't load prices. Check your
connection." state with Retry, and nothing else on the paywall is tappable except Close.

---

## 9. Quality gates

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

## 10. Definition of done (per screen)

1. Matches the Figma frame at 360×800 and 412×915 (text may wrap differently; nothing clips).
2. Every state in the screen's **States** table exists and is reachable from the dev menu.
3. All strings in i18n, all colours/spacing/type from tokens.
4. TalkBack labels on every control, minimum touch target 44×44 dp, font scale 1.3 does not
   break layout.
5. Back button (system back) behaviour as specified.
