# Code standards · Untangle (Expo / React Native)

## First, on "proper classes"

Modern React Native means **function components and hooks**. Class components are legacy. There is exactly one place React still needs a class: an **error boundary** (`componentDidCatch` has no hook equivalent). So:

- **UI:** function components only, plus one `ErrorBoundary` class at the root and around each tab.
- **Services:** classes are fine where an object really has state and a lifecycle, such as a `PurchasesService` that wraps RevenueCat, a `BlockingService` that wraps the native module, or typed errors (`class PurchaseError extends Error`). Everything else is plain functions in modules.
- **Organisation** comes from folders, types and naming, not from class hierarchies. No inheritance chains, no "BaseScreen".

## Stack (already agreed)

| Concern | Choice |
|---|---|
| App | Expo SDK + dev client, expo-router |
| State | zustand, one store per feature, persisted with MMKV |
| Relational data | expo-sqlite: sessions, shield events, logs |
| Animation | Reanimated (+ Gesture Handler); Skia for the ghost and stars |
| Purchases | `react-native-purchases` (RevenueCat) |
| Haptics | expo-haptics behind `lib/haptics` |
| Native, iOS | Swift: FamilyControls, ManagedSettings, DeviceActivity, Shield extensions, WidgetKit, Live Activity, as one local Expo module plus config plugins for the extension targets |
| Native, Android | Kotlin: UsageStats, foreground service, overlay activity, Glance widgets, in the same Expo module |

## Folder structure

```
app/                              # routes only: thin, no logic, no styles beyond layout
  _layout.tsx                     # providers, fonts, ErrorBoundary, splash gate
  (onboarding)/_layout.tsx
  (onboarding)/index.tsx          # 01 splash … 15 trial   (kebab-case route files)
  (tabs)/_layout.tsx              # TabBar
  (tabs)/today.tsx  challenges.tsx  block.tsx  rewards.tsx
  focus/start.tsx  run.tsx  done.tsx  emergency.tsx
  rule/new.tsx  rule/[id].tsx
  paywall/index.tsx  paywall/gate.tsx  pro/success.tsx
  settings/billing.tsx  settings/cancel.tsx
src/
  design/
    tokens/  colors.ts  typography.ts  spacing.ts  radius.ts  motion.ts  index.ts
    components/  PrimaryButton/ PrimaryButton.tsx  PrimaryButton.test.tsx  index.ts
                 Card/  ListGroup/  Sheet/  Banner/  StatCard/  Ghost/  …
    theme.ts                      # useTheme() returns semantic tokens
  features/
    onboarding/  components/  hooks/  onboardingStore.ts  steps.ts  types.ts
    home/        components/  hooks/  useHomeState.ts
    blocking/    components/  rulesStore.ts  rules.ts (pure logic)  types.ts
    focus/       components/  focusStore.ts  focusMachine.ts  types.ts
    clarity/     score.ts  score.test.ts
    paywall/     components/  usePaywall.ts  featureRows.ts  paywallCopy.ts
    challenges/  …
  services/
    blocking/    BlockingService.ts (interface)  blocking.ios.ts  blocking.android.ts
    purchases/   PurchasesService.ts  errors.ts  entitlementStore.ts
    notifications/  storage/ (mmkv.ts, db.ts, migrations/)  sensors/
  lib/   haptics.ts  time.ts  format.ts  linking.ts  logger.ts
  i18n/  en.json  index.ts
modules/untangle-native/          # local Expo module: ios/ (Swift), android/ (Kotlin), src/ (TS bindings)
targets/                          # iOS extensions: ShieldConfiguration, ShieldAction, DeviceActivityMonitor, DeviceActivityReport, Widget
```

**Dependency direction:** `app` → `features` → `design` / `services` / `lib`. A feature never imports another feature's internals; share through `services` or a small exported hook. `design` imports nothing from features.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Component file and name | PascalCase | `BlockedAppsCard.tsx` |
| Hook | `use` + PascalCase | `useFocusCountdown` |
| Other modules | camelCase | `focusMachine.ts`, `paywallCopy.ts` |
| Route files | kebab-case (they're URLs) | `screen-time-access.tsx` |
| Types and interfaces | PascalCase, no `I` prefix | `Rule`, `FocusSession` |
| Union literals | camelCase strings | `'pause' \| 'earn' \| 'locked'` |
| Booleans | `is` / `has` / `can` / `should` | `isLocked`, `hasPro`, `canUsePass` |
| Event props / handlers | `onX` prop, `handleX` inside | `onPress={handleStart}` |
| Constants | `SCREAMING_SNAKE` only for true compile-time constants | `MAX_FREE_RULES = 2` |
| Stores | `<feature>Store`, hook `use<Feature>Store` | `useRulesStore` |
| Test IDs | `screen.element` | `testID="paywall.plan.yearly"` |
| i18n keys | `feature.screen.element` | `"paywall.main.ctaKeep"` |

Use domain words from the spec and nothing else: **rule**, **strength** (pause/earn/locked), **focus session**, **emergency pass**, **shield**, **Clarity**, **challenge**, **points**, **earned minutes**. Don't introduce synonyms like "block", "lock", "restriction" or "session" for the same thing in different files.

## Styling and tokens

- **No raw hex, font sizes or radii in components.** Import from `src/design/tokens`. Enforce it with ESLint `react-native/no-color-literals` and `react-native/no-inline-styles` (from `eslint-plugin-react-native`).
- Tokens have two layers: primitives (`palette.yellow500`) stay private to `tokens/`, and components use semantic names (`color.accent.primary`, `color.text.muted`). Renaming a colour then means changing one line.
- `StyleSheet.create` at the bottom of each component file. Use the `[styles.base, isSelected && styles.selected]` pattern; never build style objects inside render.
- Every rounded rect gets `borderCurve: 'continuous'`. Put it in a `radius` helper so nobody forgets.
- Text goes through one `<Text variant="title.m" tone="muted">` component that applies the type tokens, `maxFontSizeMultiplier` and tabular numbers. Don't use raw RN `Text` in features.

## State and logic

- **Pure logic in plain TypeScript files with unit tests:** Clarity score, rule overlap, schedule maths and the trial day count. No React in these files.
- **Discriminated unions for anything with states:**
  ```ts
  type FocusState =
    | { status: 'idle' }
    | { status: 'running'; startedAt: number; endsAt: number; passesLeft: number }
    | { status: 'done'; earnedMin: number; points: number };
  ```
  Render with an exhaustive `switch` and a `never` check, so adding a state breaks the build until it's handled. Do the same for paywall load (`loading | ready | offline | error`) and purchase (`idle | purchasing | pending | failed | success`).
- **Stores** hold data plus actions. Components read with selectors (`useRulesStore(s => s.activeCount)`) to avoid re-renders.
- **Time:** store absolute epoch ms (`endsAt`), never "remaining seconds". Countdowns derive from a Reanimated clock on the UI thread.
- **Services** return typed results; don't throw across the UI boundary:
  ```ts
  type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };
  purchase(plan): Promise<Result<CustomerInfo, 'cancelled' | 'failed' | 'pending' | 'offline'>>
  ```
  Each error maps 1:1 to an edge screen (cancelled → nothing, failed → E05, pending → E06, offline → E04).

## TypeScript

`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any`; use `unknown` plus narrowing at the boundaries (native module returns, MMKV reads, RevenueCat payloads). Validate persisted data with zod when reading it.

## Copy

All user-facing strings go in `src/i18n/en.json`, even with one language for now. Plurals go through the i18n library, not ternaries. Prices and dates come from `Intl` and the store's `priceString`.

## Accessibility (a review blocker, not a nice-to-have)

- Every pressable has a role and a label. Selection controls set `accessibilityState`.
- Countdowns and scores have sensible announcements (see SPEC §6).
- Reduce Motion is respected everywhere animation is used, through one `useReducedMotion()` hook.

## Testing

| Level | Tool | What |
|---|---|---|
| Unit | Jest | `features/*/` pure logic: score, rules, schedules, trial, paywall state mapping |
| Component | `@testing-library/react-native` | Every shared component's states: selected, disabled, loading, error |
| Flow (e2e) | Maestro | Onboarding 01 → 15; paywall in sandbox (purchase, cancel, fail, restore); focus start, kill app, relaunch |
| Native | XCTest / JUnit | Schedule creation, shield application, service restart |

Rule: a bug fix comes with the test that would have caught it.

## Performance

- Animate only `transform` and `opacity` on the UI thread (Reanimated worklets). Never animate React state.
- The ghost is a single Skia canvas. Don't stack several on one screen (Home + sheet: pause the one behind the sheet).
- Use `React.memo` on list rows and `useCallback` only where profiling shows re-renders. Don't sprinkle them everywhere.
- Target 60 fps on a mid-range Android device. Profile before and after any animation work.

## Git and review

- Conventional commits (`feat(focus): …`, `fix(paywall): …`), small PRs, one feature per PR.
- PR checklist: matches the PNG at 390 and 375 · all states from SPEC/EDGE_CASES handled · no colour literals · strings in i18n · a11y labels · tests added.
