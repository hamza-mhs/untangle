# Untangle

A "quit doomscrolling" app for iOS and Android: schedule-based blocking rules (Pause, Earn,
Locked), unbreakable Focus sessions, three daily challenges, short attention reps, and a tangle
that loosens as the day goes well. No account, no backend, no analytics. Data lives on the
device. The only network SDK is RevenueCat (purchases).

> **Status: skeleton.** Structure, packages, native targets, design tokens, navigation, storage
> and domain logic are in place. Screens are stubs. See [What's stubbed](#whats-stubbed).

---

## Stack

| Area | Choice | Notes |
| --- | --- | --- |
| Framework | Expo SDK 58, React Native 0.88, React 19.3, New Architecture | Dev builds via `expo-dev-client`. **Expo Go won't work** (custom native code). |
| Language | TypeScript 6, `strict` + `noUncheckedIndexedAccess` | |
| Routing | `expo-router` 58 (typed routes) | Routes live in `src/app/` (the SDK 55+ default). |
| State | `zustand` 5 | Persisted to MMKV. |
| Key-value | `react-native-mmkv` 4 (Nitro) | Settings + every store. |
| History | `expo-sqlite` + `drizzle-orm` | Days, focus sessions, points ledger, rep results, emergency passes. |
| Animation | `react-native-reanimated` 4, `react-native-gesture-handler`, `@shopify/react-native-skia` | Respect Reduce Motion via `useMotion()`. |
| Haptics | `expo-haptics` behind `src/lib/haptics.ts` | ESLint blocks direct imports. |
| Notifications | `expo-notifications`, **local only** | No push entitlement is added. |
| Sensors | `expo-sensors` (DeviceMotion) | Face-down detection. |
| Speech | `expo-speech-recognition` | On-device recognition required. |
| Health | `@kingstinct/react-native-healthkit` (iOS), `react-native-health-connect` (Android) | Read-only aggregate step count. |
| Purchases | `react-native-purchases` (RevenueCat) | Entitlement `pro`. |
| Secure flag | `expo-secure-store` | Trial start mirrored to the iOS Keychain. |
| iOS targets | `@bacons/apple-targets` 5 | All extensions are generated from `targets/`. |
| Fonts | Inter Tight, Inter, JetBrains Mono (OFL) | Embedded at build time by the `expo-font` plugin. |

### Library decisions made during setup

- **`react-native-device-activity` was not used.** It was last released in Feb 2026, declares
  no SDK 58 support, and ships its own fork of the apple-targets plugin, which would conflict
  with `@bacons/apple-targets` for our widget and Live Activity targets. We own a thin Swift
  module instead (`modules/blocker-ios`).
- **`expo-document-picker` was dropped.** SDK 58's `expo-file-system` has
  `File.pickFileAsync`, which the backup import uses.
- **`expo-health-connect` is deprecated.** Its functionality now ships in
  `react-native-health-connect`'s own plugin.
- **`expo-widgets`** (first-party in SDK 58) was not used. We need hand-written Swift targets
  for the Screen Time extensions anyway, so widgets go through the same system.

---

## Setup

Prerequisites: Node 24, npm 12. For local native builds you also need Xcode 26+ on macOS (iOS)
or Android Studio with a JDK 17+ (Android). Otherwise build in the cloud with EAS.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in the RevenueCat **public** SDK keys (sandbox keys are fine). They're `EXPO_PUBLIC_*`, so
they end up in the JS bundle, and that's expected for RevenueCat public keys.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Metro for a dev build (`--dev-client`). |
| `npm run android` / `npm run ios` | Local native build + run (`expo run:*`). |
| `npm run prebuild` | `expo prebuild --clean`: regenerates `ios/` and `android/`. |
| `npm run check` | typecheck → lint → prettier check → jest. Run before every PR. |
| `npm run typecheck` / `lint` / `test` / `format` | Individually. |
| `npm run db:generate` | New drizzle migration after editing `src/storage/db/schema.ts`. |
| `npm run doctor` | `expo-doctor`. |

### Never edit `ios/` or `android/`

Both folders are generated and git-ignored. Native changes go in:

- `app.config.ts`: identifiers, entitlements, Info.plist, plugin options
- `plugins/withUntangleNative.js`: main-app entitlements and manifest tweaks no library covers
- `targets/*`: iOS extensions (Swift + `expo-target.config.js`)
- `modules/blocker-ios`, `modules/blocker-android`: our Expo native modules (autolinked)

---

## Web preview (design review only)

For checking screens without a device build, the app also runs on the web through React Native
Web, with Skia's CanvasKit (WASM) build:

```bash
cp node_modules/canvaskit-wasm/bin/full/canvaskit.wasm public/
```

```bash
npx expo start --web
```

- `index.web.js` loads CanvasKit before the router entry. Skia APIs must not run at module
  load time.
- Web skips SQLite (`DatabaseProvider.web.tsx`) and loads fonts at runtime (`useAppFonts.web.ts`).
  Native embeds fonts at build time.
- Not a product target: there are no safe areas, haptics, Screen Time or Health on the web.
- `design/onboarding-01-05/compare/` holds the design-vs-build screenshots. Copy it to
  `public/compare/` to view it at `/compare/index.html`.

## Running dev builds on a device

Screen Time, usage stats, Health and Live Activities **do not work on simulators or emulators**.
There, the JS wrappers in `src/native/` return mock data (`useMocks`), so the UI is still
buildable. To force mocks on a device, set `EXPO_PUBLIC_NATIVE_MOCKS=1`.

### With EAS (recommended, required for iOS on Windows)

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

```bash
npx eas-cli@latest build --profile development --platform ios
```

```bash
npx eas-cli@latest build --profile development --platform android
```

Install the build on the device, then run `npm start` and open the project from the dev client.

| Profile | Use | App variant |
| --- | --- | --- |
| `development` | Dev client, internal distribution | `com.TODO.untangle.dev`, "Untangle (Dev)" |
| `development-simulator` | iOS simulator dev client (mocks only) | same |
| `preview` | Internal QA build, no dev menu | `com.TODO.untangle.preview` |
| `production` | Store build, auto-incremented build number | `com.TODO.untangle` |

Each variant has its own bundle id **and** its own App Group (`group.<bundle id>`), so dev and
production installs can sit side by side.

### Locally

- **Android** (Windows/macOS/Linux): `npm run android` with a device connected over USB with
  USB debugging on.
- **iOS** (macOS only): `npm run ios -- --device`. Set `APPLE_TEAM_ID` first.

> Expo CLI refuses to generate the iOS project on Windows. On Windows, build iOS with EAS.

---

## iOS: Apple entitlements (FamilyControls)

Blocking uses Apple's Screen Time API (FamilyControls + ManagedSettings + DeviceActivity).

1. **Development**: the `com.apple.developer.family-controls` entitlement works in development
   builds signed with your team. No approval is needed to test on your own devices.
2. **Distribution (TestFlight / App Store)**: you must **request the Family Controls
   (Distribution) entitlement from Apple**:
   - Account holder: <https://developer.apple.com/contact/request/family-controls-distribution>
   - Submit **once per bundle identifier that uses it.** For us that's the app plus every Screen
     Time extension:
     - `com.TODO.untangle` (app)
     - `com.TODO.untangle.monitor` (DeviceActivityMonitor)
     - `com.TODO.untangle.shieldconfig` (ShieldConfiguration)
     - `com.TODO.untangle.shieldaction` (ShieldAction)
     - `com.TODO.untangle.report` (DeviceActivityReport)
   - Explain the use case: the user restricts their *own* app usage
     (`AuthorizationCenter.requestAuthorization(for: .individual)`).
   - Approval can take days to weeks. Request it **before** you need TestFlight.
3. After approval, regenerate provisioning profiles (EAS does this on the next build if it manages
   credentials).

Other iOS capabilities that are configured automatically: App Groups (app + all extensions),
HealthKit (read-only), Live Activities (`NSSupportsLiveActivities`), microphone/speech and
motion usage strings.

### The app cannot read screen-time numbers

Apple doesn't give the app raw usage data. Usage can only be **displayed** by the
`DeviceActivityReport` extension (`targets/device-activity-report`), which iOS renders
sandboxed inside the app's UI. It can't send data back to the app, the App Group or the network.
What that means for us:

- On iOS, "Verified" Screen Time challenges (for example "under 60 min on blocked apps") can't
  be scored in JS by reading usage. Use **DeviceActivity threshold events** instead:
  `DeviceActivityEvent(applications:threshold:)` makes the **monitor** extension fire
  `eventDidReachThreshold`, which *can* write a flag to the App Group. "Under X minutes" becomes
  "the threshold event did **not** fire before the end of the day."
- The evening receipt and Today screen embed the report view for screen-time totals. Those
  numbers never enter our database, backups or widgets.
- On Android, `UsageStatsManager` returns real numbers, so the platforms differ here. Keep the
  scoring API platform-neutral (`verified: true/false`).

### iOS targets (`targets/`)

| Folder | Type | What it does |
| --- | --- | --- |
| `device-activity-monitor` | DeviceActivityMonitor | Applies or clears a rule's shield when its schedule starts or ends. |
| `shield-config` | ShieldConfiguration | The block screen: icon, title, subtitle, two buttons. Apple allows only these fields. |
| `shield-action` | ShieldAction | Handles shield button taps (close / defer). |
| `device-activity-report` | DeviceActivityReport | Renders screen-time totals. **See the note below.** |
| `widgets` | WidgetKit + ActivityKit | Home and Lock Screen widgets, plus the focus Live Activity and Dynamic Island. |
| `_shared` | (linked into every target and the app) | `WidgetState.swift`, `FocusActivityAttributes.swift`, App Group helper. |

> **DeviceActivityReport workaround:** `@bacons/apple-targets` v5 has no type for this
> extension. The target uses the ExtensionKit-based `app-intent` type (same product type and
> embedding) with a hand-written `Info.plist` that sets
> `EXExtensionPointIdentifier = com.apple.deviceactivityui.report-extension`. apple-targets never
> overwrites an existing Info.plist. **Not yet verified in an Xcode build.**

---

## Android: permissions and Play Console declarations

Declared in `modules/blocker-android/android/src/main/AndroidManifest.xml` and merged into the
app at build time:

| Permission | Why | User action | Play policy |
| --- | --- | --- | --- |
| `PACKAGE_USAGE_STATS` | Detect which app is in the foreground; screen-time numbers. | User enables "Usage access" in Settings (`blocker.requestAuthorization()` opens it). | **Sensitive.** Declare it in the Permissions Declaration Form. Usage must be the app's core purpose, shown with a prominent in-app disclosure **before** sending the user to Settings. |
| `SYSTEM_ALERT_WINDOW` | **Required** to launch the block screen from the background. Android 10+ blocks background activity launches, and holding this permission is the exemption. The alternative (full-screen-intent notifications) is restricted by Play to calling and alarm apps. | User enables "Display over other apps". | Allowed for this use, but expect review questions. Explain it in the store listing and the in-app disclosure. |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_SPECIAL_USE` | The watcher service runs while rules or focus are active. No standard FGS type covers app blocking. | none | **Declare the `specialUse` foreground service in Play Console** (App content → Foreground service permissions) with a demo video. The subtype text is in the manifest `<property>`. |
| `POST_NOTIFICATIONS` | Ongoing watcher notification and focus countdown; local reminders. | Runtime prompt (Android 13+). | none |
| `RECEIVE_BOOT_COMPLETED` | Restart the watcher after a reboot. | none | none |
| `RECORD_AUDIO` (from expo-speech-recognition) | Read-aloud reps. | Runtime prompt | Data safety: audio is processed on device and not collected. |
| Health Connect `READ_STEPS` | Verified walk challenges. | Health Connect permission sheet | **Health Connect declaration form** in Play Console, plus a privacy policy URL. The rationale intent is wired by the library's plugin. |
| `<queries>` launcher intent | List installed apps for the picker. | none | Avoids `QUERY_ALL_PACKAGES`, which Play restricts. |

Also note:

- **Accessibility Service is deliberately not used.** It's the other common way to detect
  foreground apps, but Play's policy now heavily restricts non-accessibility uses of it.
- `android:allowBackup="false"` (set by `plugins/withUntangleNative.js`) so restoring to a new
  phone doesn't resurrect rules and trial state mid-schedule. Users can use the in-app backup
  file instead.
- **Data safety form:** no data is collected or shared, except purchase history handled by
  RevenueCat and Google Play.
- **Blocked library permissions** (`android.blockedPermissions` in `app.config.ts`):
  `ACTIVITY_RECOGNITION` (expo-sensors Pedometer), `USE_BIOMETRIC` / `USE_FINGERPRINT`
  (expo-secure-store biometrics), and legacy `READ/WRITE_EXTERNAL_STORAGE`. We don't use those
  features, and each permission is another data-safety question. Remove an entry if you start
  using that feature.
- `android.permission.health.READ_STEPS` is declared in `app.config.ts`, because the Health
  Connect plugin doesn't add record permissions itself.

Verified release manifest (`:app:processReleaseMainManifest`): `ACCESS_NETWORK_STATE`,
`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `INTERNET`, `PACKAGE_USAGE_STATS`,
`POST_NOTIFICATIONS`, `READ_APP_BADGE`, `RECEIVE_BOOT_COMPLETED`, `RECORD_AUDIO`,
`SYSTEM_ALERT_WINDOW`, `VIBRATE`, `WAKE_LOCK`, `health.READ_STEPS`.

### Building Android locally on Windows

Use Android Studio's bundled JDK. If Gradle fails with
`java.io.IOException: Unable to establish loopback connection`, Java can't create its socket in
the short-name temp folder. Point it at a plain path:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr" JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=C:/gtmp -Djava.io.tmpdir=C:/gtmp"
```

Also set `ANDROID_HOME` (prebuild regenerates `android/`, which removes any `local.properties`).
The first build downloads the NDK (about 1 GB). If it's interrupted, delete the half-installed
`Sdk/ndk/<version>` folder or Gradle reports "did not have a source.properties file".

### Android module (`modules/blocker-android`)

| File | Role |
| --- | --- |
| `BlockerAndroidModule.kt` | JS API: permissions, installed apps (with icons), `applyRules`, focus start/end, `writeSharedState`. |
| `BlockerService.kt` | Foreground service that polls `UsageStatsManager` every second and launches `BlockActivity`. Shows the ongoing notification; during focus it's a native countdown (`setChronometerCountDown`). |
| `BlockActivity.kt` | Full-screen block screen (placeholder native UI; we fully control it on Android). |
| `TangleWidget.kt` | Jetpack Glance home-screen widget. |
| `BootReceiver.kt` | Restarts the watcher after reboot. |
| `SharedState.kt` | Kotlin mirror of the widget-state contract and the rule payload. |

---

## Shared widget state contract

One small JSON document is the only thing widgets, the Live Activity, the iOS shield and the
Android block screen read. The app writes it on every relevant store change
(`src/features/widgetSync.ts` → `src/native/widgets.ts`).

| | Location |
| --- | --- |
| Schema (source of truth) | `shared/widgetState.ts` |
| Swift mirror | `targets/_shared/WidgetState.swift` |
| Kotlin mirror | `modules/blocker-android/.../SharedState.kt` |
| iOS storage | App Group `UserDefaults(suiteName: "group.<bundle id>")`, key `widgetState` |
| Android storage | `SharedPreferences("untangle.shared")`, key `widgetState` |

```ts
{
  version: 1,
  tangleProgress: number,   // 0..1, from today's challenges
  clarity: number,          // 0..100 habit score
  streak: number,           // days
  challenges: { id: string; title: string; done: boolean }[],  // max 3
  focus: { active: boolean; endsAt: number | null; lockedCount: number },
  rulesActive: number,      // rules currently inside their window
  blockingHealthy: boolean, // false → widgets warn (permission revoked, service dead)
  updatedAt: number,        // epoch ms
}
```

Rules:

- Bump `WIDGET_STATE_VERSION` on breaking changes. Readers ignore unknown fields.
- `src/__tests__/widgetState.test.ts` fails if a field is missing from the Swift or Kotlin mirror,
  or if the two copies of `FocusActivityAttributes` (module and widget target) drift apart.
  ActivityKit matches them by name and shape.
- Writes are de-duplicated, because iOS budgets widget reloads.

---

## Project layout

```
src/
  app/                   expo-router routes (stubs)
    (onboarding)/        19 steps, driven by src/features/onboarding/steps.ts
    (tabs)/              today, challenges, block, rewards + raised centre Focus button
    focus/               start, running, done, emergency-pass (no swipe-to-dismiss)
    reps/                maths, letter-guess, target, pairs, span, read-aloud, time-up
    paywall/ settings/ receipt/ lights-out/
    dev/kitchen-sink     every design-system component (dev builds only)
  design/                tokens, typography, useMotion, components/
  features/              rules, focus, challenges, reps, scoring, rewards, receipt, trial,
                         purchases, settings, onboarding, widgetSync
  native/                typed wrappers: blocker, widgets, liveActivity, health, speech, sensors
  storage/               MMKV (kv.ts), createStore, SQLite + drizzle (db/), backup export/import
  lib/                   haptics, notifications, time, bootstrap
modules/                 blocker-ios (Swift), blocker-android (Kotlin)
targets/                 iOS extensions (see above)
plugins/                 withUntangleNative.js
shared/                  widgetState.ts
drizzle/                 generated SQL migrations (committed)
```

## Conventions

- **Copy rule:** never "heal / cure / repair / rewire your brain." Clarity is always labelled
  a "habit score."
- **Reduce Motion:** animate through `useMotion()` (durations collapse to 0) and honour
  `reduceMotion` for movement.
- **Haptics:** only through `haptics.tap / select / success / warning / error`.
- **iOS corners:** spread `continuous` (`borderCurve: 'continuous'`) into rounded styles.
- **Big numbers:** `type.numberXL/L/M`: light/regular weight with tabular numerals.
- **Domain logic is pure TypeScript** with clocks and RNGs injected, and it's unit-tested.
  Stores are thin.

---

## What's done / stubbed / needs hardware

### Done

- Expo SDK 58 app, TS strict, ESLint (flat) + Prettier, Jest + RNTL + expo-router testing,
  `npm run check`.
- EAS profiles (`development`, `development-simulator`, `preview`, `production`), per-variant
  bundle ids and App Groups.
- Design tokens, typography, 12 components + `Screen`/`StubScreen`, `/dev/kitchen-sink`.
- Every route as a stub. Custom tab bar with a raised centre Focus button.
- MMKV + SQLite (first migration), six persisted zustand stores, backup export/import.
- Domain logic with tests: points and the "Your word" cap, earned minutes, verified share,
  streaks and freezes, Clarity, the reverse-trial state machine, the focus machine (no early
  exit), the morning draw and redraw, emergency passes, overnight schedules, all reps
  generators (target-24 only yields solvable hands), and the background-aware rep timer.
- Native scaffolding: both Expo modules, five iOS targets, the config plugin, the shared state
  contract with parity tests, and typed JS wrappers with mocks.
- RevenueCat wiring and `usePro()`, the haptics wrapper, local notifications (day-5 trial
  notice, focus end).

**Verified so far:** `npm run check` (typecheck, lint, format, 92 Jest tests) and `expo-doctor`
(20/20) pass. Android prebuild works, `modules/blocker-android` compiles with Gradle
(`:blocker-android:assembleDebug`), and the debug and release manifests merge. The full
Android app (`assembleDebug`, all native libraries) has not been built yet. iOS has not been
generated or built (Expo CLI won't prebuild iOS on Windows).

### Stubbed (scaffold only)

- All screen UI (stub cards), the tangle (Skia installed, not drawn), and the paywall UI.
- Swift and Kotlin bodies are minimal. See every `TODO(verify)` below.
- SQLite writes from stores (repos exist; stores keep fast-path aggregates).

### Needs a real device and/or an Apple/Google account

- **Anything Screen Time** (iOS device + FamilyControls entitlement); distribution needs
  Apple's approval.
- **iOS build of the targets.** Never compiled here (Windows). First EAS iOS build will surface
  Swift/signing issues. Needs an Apple Developer account and `APPLE_TEAM_ID`.
- **Android usage access, overlay, foreground service, block screen, Glance widget**: Android
  device. The code compiles, but none of it has run yet.
- **HealthKit / Health Connect**: device with Health data. Health Connect needs the Play
  declaration before release.
- **Live Activity / Dynamic Island**: iPhone 14 Pro or later for the Island.
- **RevenueCat purchases**: RevenueCat project + App Store Connect / Play Console products,
  sandbox testers.
- **Speech recognition (on-device)**: device. Simulator support is partial.
- **Face-down detection**: device.

---

## Every `TODO(verify)`

| Where | What to verify |
| --- | --- |
| `app.config.ts` | Replace `com.TODO.untangle` with the real reverse-DNS id (also the Android module namespace `com.todo.untangle.blocker` in `modules/blocker-android/android/build.gradle`). |
| `app.config.ts` | Set `APPLE_TEAM_ID` (EAS env or config). |
| `targets/device-activity-report/expo-target.config.js` | The `app-intent` type + custom Info.plist workaround builds and renders. |
| `modules/blocker-ios/ios/BlockerIosModule.swift` | Day-of-week schedules need one `DeviceActivityName` per rule × weekday (currently daily). |
| `modules/blocker-ios/ios/BlockerIosModule.swift` | Focus should also schedule a DeviceActivity interval so the shield clears even if the app is never reopened. |
| `targets/shield-action/ShieldActionExtension.swift` | The 10-second breath can't be drawn in the shield. Likely `.defer` + a notification that deep-links to an in-app breath screen. |
| `src/features/trial/secureFlag.ts` | Keychain survives reinstall on current iOS. On Android, uninstall clears it (a reinstall-proof check would need a server, which is out of scope). |
| `modules/blocker-android/.../BlockerService.kt` | 1-second polling: battery impact on device. |
| `modules/blocker-android/.../BlockerService.kt` | Focus allow-list (phone, maps, ...). |
| `src/native/sensors.ts` | Sign of gravity z when face down, on both platforms. |
| `src/native/speech.ts` | Fallback UX when on-device recognition isn't available. |
| `src/features/purchases/purchases.ts` | Final product ids. |
| `src/features/scoring/points.ts` | Point values, multipliers, "Your word" cap, earned minutes. |
| `src/features/scoring/clarity.ts` | Clarity formula (14-day decayed completion). |
| `src/features/rules/strengths.ts` | Is Earn free or Pro? |
| `src/features/rules/emergencyPasses.ts` | How long an emergency pass unlocks. |
| `src/app/(tabs)/_layout.tsx` | Drop the ref cast once expo-router fixes the `TabTriggerSlotProps` ref type. |

## Licences

Fonts in `assets/fonts` are under the SIL Open Font License (see `assets/fonts/FONTS.md` and `OFL.txt`).
