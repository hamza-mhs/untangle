# 02 · Android platform: the blocking engine

This is the riskiest part of the app. Read it fully before Phase 2. Items marked
**VERIFY ON DEVICE** are behaviours that differ between Android versions or phone makers and
must be tested on real hardware, not the emulator.

---

## 1. How blocking works (one paragraph)

An **AccessibilityService** (`UntangleAccessibilityService`) receives an event every time the
foreground window changes. It knows which app (package) is in front and, for supported
browsers, reads the address bar. It counts **time used** and **opens** per locked target per
day, and when a lock's allowance is used up (or a Focus session is running) it opens the
**pause screen** on top. The pause screen is React Native UI (same design system). A
**Usage access** permission (`UsageStatsManager`) is used separately for the Home/Progress
numbers about *all* apps (screen time, pick-ups). Nothing leaves the phone.

```
foreground change ─▶ AccessibilityService ─▶ EnforcementEngine (Kotlin, pure logic)
                                              │  reads Locks + today's counters (native store)
                                              ├─ allow → keep counting, schedule "time runs out" check
                                              └─ block → launch PauseActivity (RN) with reason
RN app (JS) ◀── untangleBlocker bridge ──▶ native store (locks, settings, counters, unlocks)
```

---

## 2. Native module `modules/untangle-blocker` (Kotlin, Expo Modules API)

### 2.1 Classes

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

### 2.2 JS bridge (`src/native/untangleBlocker.ts`)

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

### 2.3 Manifest (merged from the module)

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

## 3. Permissions and Google Play policy

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

## 4. Enforcement rules (EnforcementEngine)

### 4.1 What counts

- **Foreground target:** the package of the active window from `TYPE_WINDOW_STATE_CHANGED`.
  Ignore our own package, the system UI (`com.android.systemui`), the input method (current
  IME package), and transient windows (toasts, dialogs from another package that last <1 s).
  The default launcher (resolved via `Intent.CATEGORY_HOME`) ends any target session.
- **Website target:** when the foreground package is a supported browser (§4.4), the current
  address bar text mapped to its registrable domain (`m.reddit.com/r/x` → `reddit.com`;
  subdomains match their parent lock). A browser with no matching site is not a target.
- **Time used:** accumulated while a target is in the foreground **and the screen is
  interactive**. Stops on `ACTION_SCREEN_OFF`, resumes on `ACTION_USER_PRESENT`/`SCREEN_ON`
  if the same target is still in front. Accumulate on every transition and every 15 s while in
  front (so a crash loses at most 15 s).
- **Opens:** +1 when a target comes to the foreground from a *different* foreground target or
  the launcher, **and** it has been away for more than 30 s (switching to reply to a message
  and coming back is the same open). Returning from the pause screen after an unlock is not a
  new open.
- **Day boundary:** counters are stored under the local date key. At midnight the service
  starts a new key; an app in the foreground at midnight starts the new day with 0 used.

### 4.2 Decision when a target comes to the foreground (and on every scheduled re-check)

```
if focusSession.active && target in focusSession.targets  → Block(FOCUS)
lock = locks[target]; if lock == null || !lock.enabled    → Allow
if unlock[target].until > now                             → Allow(nextCheckAt = until)
if lock.dailyMinutes == 0                                 → Block(ALWAYS)
if lock.dailyOpens != null && opensToday > lock.dailyOpens → Block(OPENS)      // the open that goes over
if lock.dailyMinutes != null && usedMs >= minutes*60000   → Block(TIME)
else Allow(nextCheckAt = now + (minutes*60000 - usedMs))   // re-check exactly when time runs out
```

When an allowed target reaches `nextCheckAt` while still in front, the engine returns
`Block(TIME_UP)` and the pause screen shows the **Time's up** variant.

### 4.3 What "Block" does

1. Launch `PauseActivity` with extras: `targetKey, label, reason, lockId, strictness,
   opensToday, usedMs, minutesAllowed, opensAllowed, unlocksUsed`.
2. The blocked app stays underneath. Every choice on the pause screen ends with either
   `goHome()` (Back to my day / close) or `grantUnlock()` + `openTarget()`.
3. If the user leaves the pause screen without choosing (Home button, Recents, notification
   shade → another app), the target is still blocked: the next time it comes to the
   foreground the pause screen opens again. Not a new open.
4. System **Back** on the pause screen = "Back to my day" (`goHome()`), never back into the
   blocked app.

### 4.4 Browsers (website blocking)

Read the address bar via `findAccessibilityNodeInfosByViewId` on the active window. Initial
table (**VERIFY ON DEVICE** for each, ids change between browser versions):

| Browser | Package | Address bar view id |
|---|---|---|
| Chrome | `com.android.chrome` | `com.android.chrome:id/url_bar` |
| Samsung Internet | `com.sec.android.app.sbrowser` | `…:id/location_bar_edit_text` |
| Firefox | `org.mozilla.firefox` | `…:id/mozac_browser_toolbar_url_view` |
| Edge | `com.microsoft.emmx` | `…:id/url_bar` |
| Brave | `com.brave.browser` | `…:id/url_bar` |
| Opera | `com.opera.browser` | `…:id/url_field` |

Keep this table in `BrowserTable.kt` so fixing an id is a one-line change. Unknown browsers:
not detected (stated honestly in the website screen's footnote: "Works in Chrome, Samsung
Internet, Firefox, Edge, Brave and Opera."). Private/incognito tabs work because the address
bar is still visible (verify per browser). **Not covered:** in-app browsers and web views
inside other apps, and Chrome Custom Tabs opened from apps (VERIFY: custom tabs may report
Chrome's package). Throttle content-changed events: re-read the URL at most every 500 ms per
window.

### 4.5 Edge cases (each needs a test or a device check)

| Case | Expected behaviour |
|---|---|
| Accessibility turned off by the user or killed by the system | Nothing can be blocked. In-app: red banner on Home and Settings "Blocking is off · Turn on". Detected on every app open via `isAccessibilityEnabled()` + heartbeat older than 10 min while the screen was on (VERIFY: OEM kills). |
| Phone reboots | The system rebinds the service after unlock. Counters for today are persisted; nothing resets. |
| App update of Untangle | Service rebinds; state persisted. |
| Blocked app updated or reinstalled | Same package → same lock. |
| Blocked app uninstalled | Lock stays, shown greyed with "Not installed" and a Delete action; not counted. |
| Split screen / freeform | Only the focused (active) window is evaluated in v1. Known limitation. |
| Picture-in-picture (e.g. YouTube) | Leaving the app to PiP ends its foreground time. PiP playback itself is not blocked in v1. Known limitation. |
| Incoming call over a blocked app | Dialer is in front → target session pauses; no block screen over a call. |
| Notification tap opens a blocked app | Normal open rules apply. |
| Same app in a work profile / "Dual apps" (Samsung/Xiaomi) | Different user id; not seen by our service. Known limitation. |
| Time zone change / manual clock change | See 00-foundations §7. Counters keyed by local date. |
| Midnight while blocked | Pause screen stays open; when the user acts, re-evaluate with the new day (allowed again). |
| Two triggers at once (time and opens) | Report the first that tripped: OPENS on open, TIME during use. |
| Focus session and allowance both apply | Focus wins (shows focus copy). |
| User tries to uninstall Untangle or turn off the service | Allowed. We never block Settings or the uninstall flow (Play policy and basic trust). |
| Low-RAM devices | Service work stays under 5 ms per event (no allocations in hot path; parse JSON state once and keep in memory, write on change). |
| Battery | No polling loops. The only timers are the 15 s accumulate tick while a target is in front, the single `nextCheckAt`, and a 60 s heartbeat while the screen is on. |

### 4.6 Unlock rules after the pause screen (from Settings)

| Strictness | Pause screen offers | After a game | Cap per target per day |
|---|---|---|---|
| Gentle (default) | Play a quick game · Take a breath · Back to my day | "Open <App> for N min" (N = Settings › Unlock length, default 5) | 3 unlocks |
| Firm | Same, game first, then a 30 s wait | 3-minute unlock | 2 unlocks |
| Locked | Play a quick game (no unlock) · Take a breath · Back to my day | "<App> stays locked until tomorrow." | 0 |

When the cap is reached, Gentle/Firm behave like Locked for the rest of the day and the copy
says so ("You've used today's 3 unlocks").

---

## 5. Usage numbers for Home and Progress (UsageRepository)

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

## 6. OEM battery and background (VERIFY ON DEVICE)

- Samsung: *Settings › Battery › Background usage limits* can put apps in "Deep sleeping".
  Our help sheet tells users to add Untangle to "Never sleeping apps".
- Xiaomi / HyperOS / Oppo / Vivo / Realme: an *Autostart* toggle; `openOemAutostartSettings()`
  tries known component names and returns false if none resolve, in which case we show text
  steps.
- Accessibility services are generally kept alive by the system, but some makers still kill
  them. The heartbeat check (§4.5) is how we notice.
