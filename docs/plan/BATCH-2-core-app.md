# BATCH 2 — Core app

**Goal:** the app actually works as a blocker. Locked apps and websites are counted and
blocked on Android, the pause screen appears with its choices, and the user has Home,
Screen time, Progress, the Block tab with the new short lock flow, Focus now, Settings and the
in-app paywall.

Prerequisite: Batch 1 complete. Read `docs/plan/README.md` for the rules.

**About games in this batch:** the pause screen and Home offer games, but the game engine is
built in Batch 3.1. In this batch, `src/app/game/[gameId].tsx` renders a temporary
**placeholder game** (`features/games/placeholder`: "Tap the circle 10 times", 10 s, calls the
same `finish(result)` contract described in Batch 3.1 §2.1). Everything around it (pause →
game → result → unlock) must work end-to-end with the placeholder. Batch 3.1e swaps in the
real games.

## Sub-batches

| # | Sub-batch | Done when |
|---|---|---|
| 2.1 | Blocking engine (native) | Accessibility service counts time and opens per lock, blocks on limit, launches the pause activity, website detection for the listed browsers, heartbeat; `EnforcementEngine` fully unit-tested in Kotlin |
| 2.2 | Locks and Block tab | Block tab, new 3-step lock flow (app/site → pick → allowance), lock detail with loosening rule, delete, free-tier cap |
| 2.3 | Pause screens | All pause variants, take a breath, game offer → (placeholder) game → result → unlock, detours logged, preview mode |
| 2.4 | Home, Screen time, streak, training | Home C1 with live data, Screen time detail, streak sheet and rules, daily training pick |
| 2.5 | Progress | Week/month, all cards, empty and no-permission states |
| 2.6 | Focus now | Start sheet, running screen, end-early sheet, completion, native end time |
| 2.7 | Settings | All rows, permissions screen, privacy, delete my data, banners |
| 2.8 | In-app paywall | Paywall + subscription screen, entry points, free-tier behaviour when Pro ends |

## Screens for this batch

Screenshots in `design/screens/app/`. Files in `_superseded/` are **not** built.

| Screen | Screenshot | Figma | Sub-batch | Notes |
|---|---|---|---|---|
| Home (C1) | `01-home--home.png` | `119:4691` | 2.4 | Copy change in Blocked apps card |
| Screen time | `02-home--screen-time.png` | `119:4844` | 2.4 | |
| Streak sheet | `03-home--streak.png` | `119:4949` | 2.4 | |
| Progress | `06-progress--progress.png` | `120:5536` | 2.5 | |
| Block tab | `10-block-locks--block-tab.png` | `120:5648` | 2.2 | Rows reworked (one target per lock) |
| Lock detail | `11-block-locks--lock-detail.png` | `120:5775` | 2.2 | Reworked: no schedule, no "what's blocked" list |
| Strictness sheet | `14-block-locks--strictness.png` | `120:6003` | 2.2 | |
| Turning off mid-limit | `15-block-locks--turning-off-a-lock-mid-session.png` | `120:6115` | 2.2 | |
| Delete a lock | `16-block-locks--delete-a-lock.png` | `120:6215` | 2.2 | |
| Lock flow · pick apps | `18-create-a-lock--2-which-apps.png`, `26-…choose-apps.png`, `27-…search-apps.png` | `120:6364`, `120:6857`, `120:6960` | 2.2 | Step 2 (apps) |
| Lock flow · websites | `19-create-a-lock--3-websites.png`, `28-…blocked-websites.png`, `29-…add-a-website.png`, `30-…typo-caught.png` | `120:6463`, `120:6997`, `120:7044`, `120:7103` | 2.2 | Step 2 (website) |
| Lock flow · allowance | `22-create-a-lock--4-how-much-limit.png` | `120:6622` | 2.2 | Reworked step 3 (time + opens) |
| Lock created | `25-create-a-lock--lock-created.png` | `120:6821` | 2.2 | Becomes a sheet |
| Lock flow · step 1 | — (new) | — | 2.2 | Two option cards: An app / A website |
| Focus now | `31-…start-a-session.png`, `32-…session-running.png`, `33-…end-early.png` | `121:7165`, `121:7323`, `121:7375` | 2.6 | Duration chips reused from `21-create-a-lock--4-how-long-focus.png` |
| Pause · Gentle / Firm / Locked / Website | `35-…gentle.png`, `36-…firm.png`, `37-…locked.png`, `38-…blocked-website.png` | `122:7530`, `122:7583`, `122:7640`, `122:7693` | 2.3 | Reason chip copy change |
| Game offer / After game / After game locked | `40-…`, `41-…`, `42-…` | `122:7791`, `122:7833`, `122:7871` | 2.3 | |
| Take a breath | `43-lock-screens--take-a-breath.png` | `122:7909` | 2.3 | |
| App unlocked chip (optional) | `44-lock-screens--app-unlocked.png` | `122:7937` | 2.3 | Optional |
| Time's up | `45-lock-screens--times-up.png` | `122:7969` | 2.3 | |
| Settings (trial / Pro) | `46-settings--settings.png`, `47-settings--settings-pro-all-set.png` | `122:8010`, `122:8089` | 2.7 | Profile name row removed |
| Permissions | `48-settings--permissions.png` | `122:8193` | 2.7 | Notifications row removed |
| Unlock length | `51-settings--unlock-length.png` | `122:8350` | 2.7 | |
| Privacy | `52-settings--privacy.png` | `122:8447` | 2.7 | |
| Delete my data | `53-settings--delete-my-data.png` | `122:8548` | 2.7 | Copy change |
| Paywall / Monthly / Subscription | `54-…`, `55-…`, `56-…` | `122:8637`, `122:8696`, `122:8755` | 2.8 | Feature copy change |
| Games tab (built in 3.1) | `04-games--games-tab.png` | `119:5145` | 3.1 | Only the empty tab shell here |

## Acceptance per sub-batch

**2.1 Blocking engine**
- [ ] `EnforcementEngine` unit tests cover every rule in §A.4 (time, opens incl. the 30 s
      re-entry rule, 0-minute locks, unlock windows, focus sessions, midnight rollover, clock
      change, screen off).
- [ ] On a real phone: lock Instagram at 1 min → after 1 min of use the Time's up pause screen
      appears; reopening Instagram shows the pause screen immediately; next day it's allowed again
      (test by changing the date).
- [ ] Opens limit 2 → the 3rd open shows the pause screen.
- [ ] reddit.com locked → opening it in Chrome shows the pause screen (test every browser in the
      table you have installed; record results in `docs/device-tests.md`).
- [ ] System Back on the pause screen goes to the home screen, never back into the blocked app.
- [ ] No polling loops; battery use of Untangle after a day of normal use < 1% in Android's
      battery screen.

**2.2 Locks** — [ ] flow creates one lock per app; [ ] website normalisation + validation
tests; [ ] loosening rule works while over the limit; [ ] free tier blocks the 4th lock with the
paywall.

**2.3 Pause screens** — [ ] every variant in §B.8 reachable (dev menu + real blocking);
[ ] unlock grants N minutes and opens the app; [ ] caps per day respected; [ ] detours rows
written; [ ] preview mode logs nothing.

**2.4 Home etc.** — [ ] numbers match `getUsageToday()`; [ ] all Home states; [ ] streak tests
(goal met with games and detours, midnight); [ ] training pick deterministic per day.

**2.5 Progress** — [ ] week/month data from `daily_summary`; [ ] first-day and no-permission
states.

**2.6 Focus now** — [ ] session blocks chosen targets until the end time even if the app is
killed; [ ] end-early sheet; [ ] logged to `focus_sessions`.

**2.7 Settings** — [ ] every row works; [ ] delete my data resets to onboarding.

**2.8 Paywall** — [ ] all entry points; [ ] when `pro` disappears, locks beyond 3 are paused and
the user picks which 3 stay.

Commit after each sub-batch: `batch-2.N: …`.

---

# Full requirements

§A = Android blocking engine. §B = Core app screens.


## §A · Android blocking engine (sub-batch 2.1; the parts already built in Batch 1 are extended here)

This is the riskiest part of the app. Read it fully before Phase 2. Items marked
**VERIFY ON DEVICE** are behaviours that differ between Android versions or phone makers and
must be tested on real hardware, not the emulator.

---

### A.1 How blocking works (one paragraph)

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

### A.2 Native module `modules/untangle-blocker` (Kotlin, Expo Modules API)

#### A.2.1 Classes

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

#### A.2.2 JS bridge (`src/native/untangleBlocker.ts`)

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

#### A.2.3 Manifest (merged from the module)

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

### A.3 Permissions and Google Play policy

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

### A.4 Enforcement rules (EnforcementEngine)

#### A.4.1 What counts

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

#### A.4.2 Decision when a target comes to the foreground (and on every scheduled re-check)

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

#### A.4.3 What "Block" does

1. Launch `PauseActivity` with extras: `targetKey, label, reason, lockId, strictness,
   opensToday, usedMs, minutesAllowed, opensAllowed, unlocksUsed`.
2. The blocked app stays underneath. Every choice on the pause screen ends with either
   `goHome()` (Back to my day / close) or `grantUnlock()` + `openTarget()`.
3. If the user leaves the pause screen without choosing (Home button, Recents, notification
   shade → another app), the target is still blocked: the next time it comes to the
   foreground the pause screen opens again. Not a new open.
4. System **Back** on the pause screen = "Back to my day" (`goHome()`), never back into the
   blocked app.

#### A.4.4 Browsers (website blocking)

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

#### A.4.5 Edge cases (each needs a test or a device check)

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

#### A.4.6 Unlock rules after the pause screen (from Settings)

| Strictness | Pause screen offers | After a game | Cap per target per day |
|---|---|---|---|
| Gentle (default) | Play a quick game · Take a breath · Back to my day | "Open <App> for N min" (N = Settings › Unlock length, default 5) | 3 unlocks |
| Firm | Same, game first, then a 30 s wait | 3-minute unlock | 2 unlocks |
| Locked | Play a quick game (no unlock) · Take a breath · Back to my day | "<App> stays locked until tomorrow." | 0 |

When the cap is reached, Gentle/Firm behave like Locked for the rest of the day and the copy
says so ("You've used today's 3 unlocks").

---

### A.5 Usage numbers for Home and Progress (UsageRepository)

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

### A.6 OEM battery and background (VERIFY ON DEVICE)

- Samsung: *Settings › Battery › Background usage limits* can put apps in "Deep sleeping".
  Our help sheet tells users to add Untangle to "Never sleeping apps".
- Xiaomi / HyperOS / Oppo / Vivo / Realme: an *Autostart* toggle; `openOemAutostartSettings()`
  tries known component names and returns false if none resolve, in which case we show text
  steps.
- Accessibility services are generally kept alive by the system, but some makers still kill
  them. The heartbeat check (§4.5) is how we notice.


## §B · Core app screens (sub-batches 2.2–2.8)

Figma sections: App · Home `119:4689`, Games `119:5143`, Progress `120:5534`, Block & locks
`120:5646`, Create a lock `120:6312` (**superseded by §6**), Block apps & websites `120:6855`,
Focus now `121:7163`, Lock screens `122:7437`, Settings `122:8008`, Paywall `122:8635`.
Behaviour reference: `design/prototype/untangle-app-prototype.html` (Home option **C1**).

Prerequisites: Phase 0, the native module from 02-android-platform.md, and the game shell +
Stack tower (30-phase3-games.md §2, Batch 1) because the pause screen offers a game.

---

### B.1 Navigation

- Root: onboarding (until complete) → tabs.
- Tabs (bottom bar, `TabBar`): **Today** · **Games** · **Progress** · **Block**. Icons from
  `Components · Icons`. Active tab white, inactive `text.tertiary`. Bar floats over content
  with a black → transparent fade (as designed); content has bottom padding 110.
- Stack screens slide from the right; sheets slide up with a dimmed backdrop (60% black).
- Game screens are full-screen, no tab bar, status bar light.
- Deep links (internal only): `untangle://game/<gameId>`, `untangle://lock/<lockId>`,
  `untangle://paywall`.

---

### B.2 Today (Home, option C1) — `119:4691`

Layout top → bottom:

1. **Sky image** (C1 "Blue sky") in the top 40% of the screen, fading to black. Asset
   `assets/images/home/sky-c1.webp`. Scrolls with content (parallax 0.5).
2. Top row (glass pills, black 35% + blur 8): **streak pill** "🔥 {n} days" (tap → Streak sheet)
   and **settings** gear (→ Settings).
3. **Screen time today** card (glass): "1h 42m" `type.statLg`, delta line "38m less than
   usual" (green if less, `text.secondary` if more: "12m more than usual"), stacked bar
   (blocked apps red segments + everything else grey), legend "Blocked apps 20m · Everything
   else". Tap → Screen time (§3).
4. **Today's training** header "Today's training" + "{played} of 3 · about {m} min".
   Horizontal carousel of 3 `GameCard`s (248 wide, snap, dots below). Card: game icon, name,
   "{Group} · {duration}", **Play now** button (white). Played card: "Done today · {stars}
   stars", button becomes "Play again" (secondary).
5. **Blocked apps** card: title "Blocked apps" + "Edit" (→ Block tab). Up to 4 targets as icon
   + today's minutes, each icon with a small lock badge when currently blocked, and an allowance
   ring around the icon (used / allowed). **COPY CHANGE:** the subtitle "Locked until 6:00 PM ·
   Work time" becomes the most relevant status: "Instagram: 12 of 30 min left" or
   "2 apps over today's limit". "+ Add" tile → new lock flow.

| State | What changes |
|---|---|
| First day (no usual) | Delta line hidden; "We'll compare once we have a few days." |
| No Usage access | Screen time card shows only blocked-target time; card "See your full screen time · Allow usage access" |
| Accessibility off / service dead | Red `Banner` at the top: "Blocking is off. Turn on" → accessibility flow |
| Battery restricted | Amber banner "Blocking might stop · Fix it" (dismissible for 24 h) |
| No locks | Blocked apps card becomes empty state "Nothing blocked yet · Pick apps" |
| All 3 games done | Header "3 of 3 · done for today ✓", cards stay playable |
| Free tier, trial ended | Small card under training: "Your trial has ended · See plans" |

**Streak sheet** — `119:4949`: "{n}-day streak", "Play 3 games a day to keep it going. Detours
from a blocked app count too." Week row M–S with filled/empty circles. CTA "Play today's game".

**Streak rules:** a day counts when `completedGames + detours(choice ∈ {back, breath}) ≥
dailyGoal` (default 3, Settings). Streak = consecutive counted days ending today or yesterday
(today not counted yet does not break it until midnight). No freezes in v1.

**Training pick (3 per day):** deterministic seed = local date. Pick from available games
(shipped batches, and on the free tier these 3 are the free ones that day): 3 different focus
groups; first game ≤ 45 s and not Calm/Active; prefer games not played in the last 3 days; never
the same 3 as yesterday. Stored in MMKV `training.day`.

---

### B.3 Screen time — `119:4844`

Today card (big number + delta), **Pick-ups by hour** chart (24 bars, bars with detours tinted
red), tiles **Pick-ups** "71 · 12 fewer than usual" and **Detours taken** "5 · Times you played
instead", **Most used** list (icon, name, "Blocked in a lock" / "Not blocked", minutes).
Tapping a "Not blocked" row → sheet "Limit {App}?" → allowance step (§6.4) with the app
preselected. Footnote: "Numbers come from Android's usage access. Untangle never sees what you
do inside an app."

States: no Usage access (whole screen = permission empty state), first day, zero pick-ups.

---

### B.4 Games tab — `119:5145`, `119:5293`

- Title "Games" + pill "{n} games" (n = shipped and available).
- Filter chips (horizontal scroll): **All · New · Memory · Attention · Self-control · Quick
  decisions · Logic & spatial · Words · Calm · Active** (focus groups, coloured dot on chip).
- On All: "Up next in today's training" card (next unplayed training game).
- Grid of `GameCard` (2 columns): icon, name, "{Group} · {duration}", "New" tag for games
  shipped in the latest batch (for 14 days), best score small text if played.
- Free tier: non-training games show a lock badge; tap → paywall.
- Tap → game intro (30-phase3-games.md §2.2).

States: filter with no games (only possible during batch rollout) → "More {group} games coming
soon."

---

### B.5 Progress — `120:5536`

Title "Progress" + streak pill. Segmented **This week / This month**.

| Card | Content | Source |
|---|---|---|
| Average screen time | big number, "14% less than last week", 7-bar (week) or ~30-bar (month) stacked chart, legend | `daily_summary` |
| Time back | "2h 15m · vs your first week" (sum over period of max(0, firstWeekAvg − day)) | `daily_summary` |
| Detours taken | "23 · Played instead of scrolling" | `detours` |
| Games played | "19 · 11 different" | `game_results` |
| Pick-ups a day | "74 · 6 fewer" + under it "You guessed 50–100" (from onboarding) | usage |
| Personal bests | list of games with best score/stat, "Against yourself only" | `game_bests` |

States: day 1 ("Your first week fills in as you go", charts show today only), no Usage access
(screen time and pick-ups cards replaced with the permission card), free tier (month view and
history before 7 days shows a Pro lock).

---

### B.6 Locks — the new short flow (replaces `120:6312` frames)

#### B.6.1 Rules

- **One lock = one app or one website** with a daily allowance: `dailyMinutes` (0 = blocked all
  day, or 5–240) and/or `dailyOpens` (1–50). At least one must be set.
- No names, no icons to choose, no schedules, no "kind" step. A lock's title is the app label
  or the domain.
- Strictness is not asked. New locks use **Settings › Default strictness** (Gentle).
- Picking several apps creates one lock each, all with the same allowance.
- Free tier: max 3 locks; the 4th "New lock" opens the paywall.

#### B.6.2 Step 1 — "What do you want to limit?" (new frame)

Two large option cards: **An app** ("Instagram, TikTok, games…") and **A website** ("reddit.com,
youtube.com…"). Tap = next. Back closes the flow.

#### B.6.3 Step 2 — pick

**Apps** (reuse `120:6857` / `120:6960`): search field; "Most used today" section (with minutes
if Usage access); "All apps" A–Z. Multi-select with ticks. Apps that already have a lock show
"Locked · 30 min a day" and are disabled. CTA "Next · {n} apps" (disabled at 0).

**Website** (reuse `120:7044`, `120:7103`): input "Which site?", popular chips (reddit.com,
youtube.com, x.com, instagram.com, tiktok.com, facebook.com, news.ycombinator.com, 9gag.com).
Normalise input: trim, lowercase, strip scheme, `www.`, path, query; keep registrable domain.
Validation: must contain a dot and a valid TLD (bundled public-suffix list) → else inline error
"That doesn't look like a website address". Duplicate → "reddit.com is already locked".
Note under: "Blocks every page and subdomain, like old.reddit.com. Works in Chrome, Samsung
Internet, Firefox, Edge, Brave and Opera." Multiple sites can be added as chips before Next.

#### B.6.4 Step 3 — "How much a day?" (rework of `120:6622`)

- **Time:** chips `Block all day` · `15 min` · `30 min` (default) · `45 min` · `1 hour` ·
  `Custom` (stepper, 5-minute steps, 5–240) · `No time limit`.
- **Opens:** "How many times a day?" chips `No limit` (default) · `3` · `5` · `10` · `Custom`
  (1–50). Hidden when "Block all day" is picked.
- Live summary sentence: "{App} opens up to 5 times and for 30 min a day. After that, your
  moment of pause." / "{App} is blocked all day. You can still play a game on the pause screen."
- CTA "Lock {App}" / "Lock {n} apps"; disabled with hint "Pick at least one limit" if both are
  No limit.

#### B.6.5 Done

Sheet (simplified `120:6821`): icons of the new locks, "Instagram is locked" (or "3 apps are
locked"), "You get 30 min a day. After that, a quick game instead." Buttons **Done** (→ Block
tab, new rows highlighted 1.5 s) and **Preview the pause screen** (opens the pause screen in
preview mode, no counting).

#### B.6.6 Block tab — `120:5648`

- Title "Block".
- **Focus now** card: "Block your distracting apps for a set time, starting right away." +
  "Start a session" (§7).
- **Your locks** + count "{n} on". Sections **Apps** and **Websites**. Row: icon, name,
  status line, right side state:
  - "12 of 30 min · 2 of 5 opens" + small ring (allowed now)
  - "Over today's limit" in red (blocked now)
  - "Blocked all day"
  - "Off" (disabled lock, row dimmed)
  - "Not installed" (app removed)
- "+ New lock" button. Empty state: "Nothing blocked yet" + "Pick apps".
- Pull-to-refresh not needed (counters refresh on focus and every 30 s while visible).

#### B.6.7 Lock detail — `120:5775` (reworked)

Header: icon + name, "On now · 12 of 30 min used today". Rows:

| Row | Behaviour |
|---|---|
| Lock is on (toggle) | Off → see *loosening rule* |
| Today | ring + "12 of 30 min · 2 of 5 opens · 1 unlock used" |
| Daily allowance | "30 min · 5 opens" → allowance sheet (same as 6.4) |
| When you hit the limit (Strictness) | Gentle / Firm / Locked sheet (`120:6003` copy) |
| Preview the pause screen | preview mode |
| Delete lock | confirm sheet (`120:6215` copy: "Delete {App}? It stops being blocked. Other locks aren't affected.") |

**Loosening rule** (`120:6115`): if the lock is **currently blocking** (over limit) and the user
turns it off, deletes it, raises the allowance or lowers strictness, a sheet asks: "Turn off
Instagram? You're over today's limit. Play one quick game first, then it turns off." → **Play a
game** (change applies after the game is completed) / **Keep it on**. Tightening applies
instantly. When not currently blocking, all changes apply instantly.

---

### B.7 Focus now — `121:7165`, `121:7323`, `121:7375`

- Start sheet: "Blocks {apps} until the timer ends." Durations chips 15 / **25** / 45 / 60 min.
  Row "Apps · {list}" (default: all locked apps and sites; tap → multi-select). Strictness row
  (default from Settings). CTA "Start {n} min".
- Running screen: big countdown "24:22", "left of 25 min", blocked icons, card "Feeling the
  pull? A 90-second breather helps" (→ Breath count), "End early".
- End early sheet (`121:7375`): "End the session early? You've done the hard part already. If
  it's an urge, a 45-second game usually lets it pass." → **Play a quick game first** /
  **Keep going** / **End session** (red text).
- Completed (new, text spec): "Session complete · 25 minutes, no detours needed" or "…, 2
  detours" + Done. Logged to `focus_sessions`.
- The session ends at `endAt` even if the app is closed (native). Opening a session target
  during the session → pause screen with reason FOCUS ("Focus session · 18 min left").
- Edge: phone restart mid-session continues; time zone change does not extend; only one session
  at a time ("A session is already running").

---

### B.8 The pause screen family (Lock screens `122:7437`)

Rendered in `PauseActivity` (02 §2.1). Dark, full-screen, app icon + name at top, a chip
showing the reason.

| Variant | Figma | Title / body | Actions |
|---|---|---|---|
| Gentle, over limit | `122:7530` | "A moment of pause" · "You opened Instagram {n} times today. What do you actually want right now?" Chip: "30 min a day" or "5 opens a day" (**COPY CHANGE**, replaces "Work time") | Play a quick game ({Game} · {sec} sec) · Take a breath (Three slow breaths, about 30 sec) · Back to my day (Close Instagram) |
| Firm | `122:7583` | same + "Firm · Play, then wait 30 s for a 3-min unlock" | same |
| Locked / unlock cap reached | `122:7640` | "Instagram is locked for today. Nothing opens it early, but you can still play." / cap: "You've used today's 3 unlocks." | Play a quick game (no unlock) · Take a breath · Back to my day |
| Blocked all day (0 min) | — | "Instagram is blocked all day." | as Gentle/Firm/Locked per strictness |
| Website | `122:7693` | "You opened reddit.com {n} times today…" | same; unlock opens the site in the browser |
| Time's up (limit reached while using) | `122:7969` | "Time's up · That was your 30 minutes. Instagram is locked again until tomorrow." Card "You stopped on time · That counts toward your streak" (shown only if the user taps Back within 10 s) | Back to my day · Close Instagram |
| Focus session | — (new) | "Focus session · {m} min left. Instagram is blocked until it ends." | Play a quick game · Take a breath · Back to my day |
| Game offer | `122:7791` | "You opened Instagram. Play this instead?" + game intro card | Start |
| After the game · unlock available | `122:7833` | result screen (score, stars) | Back to my day · **Open Instagram for 5 min** (Firm: button shows a 30 s countdown first, then "Open for 3 min") |
| After the game · locked | `122:7871` | result screen + "Instagram stays locked for today." | Back to my day |
| Take a breath | `122:7909` | 3 breaths (in 4 s, out 6 s, ring grows/shrinks), "Back to my day" | → home |
| Bedtime | `122:7746` | **Not built in v1** (no schedules) | — |
| App unlocked chip | `122:7937` | **Optional in v1:** a small overlay chip "Instagram · 4:59 left" drawn as a `TYPE_ACCESSIBILITY_OVERLAY`. If skipped, the user just gets the Time's up screen when the unlock ends. | — |

Rules:

- **Which game is offered:** the next unplayed training game if it is ≤ 45 s and not Calm;
  else a random quick game (≤ 45 s, not Calm/Active) not offered in the last 3 pauses.
- Every choice logs a `detours` row (`game` / `breath` / `back`) — not for Time's up.
- A game started from the pause screen counts for training and the streak (source `pause`).
- Quitting the game early (pause → Quit) returns to the pause screen with no unlock.
- System Back anywhere in the pause flow = Back to my day (go home).
- Preview mode (from lock detail): same UI with a "Preview" pill, nothing logged, Back returns
  to the app.

---

### B.9 Settings — `122:8010`, `122:8089`

**COPY CHANGE:** the profile row (avatar "M", "Muhammad") is removed (we never ask a name).
Top shows "🔥 {n}-day streak · {d} detours this week".

| Group | Rows |
|---|---|
| Plan card | Trial: "Free trial · {d} days left · Pick a plan to keep blocking and every game after the trial. · See plans". Pro: "Untangle Pro · Yearly · Renews {date} · {price}" → Subscription. Free: "Free plan · 3 locks, daily games · Go Pro". |
| Warnings | Accessibility off (red), battery restricted (amber) banners with Fix it |
| Blocking | Default strictness (Gentle/Firm/Locked sheet) · Unlock length "After a game, on Gentle" (2 / 5 / 10 / 15 min sheet `122:8350`) · Permissions ("All set" / "{n} needs attention") → `122:8193` |
| Games and training | Daily goal stepper 1–5 (default 3) · Sound toggle · Haptics toggle |
| Privacy | What Untangle sees (`122:8447` sheet) · Delete my data |
| About | Terms · Privacy policy · Version {x.y.z (build)} |

**Permissions screen** `122:8193`: rows Accessibility, Usage access, Battery: Unrestricted (each
"On" or "Turn on"); section "Phone maker settings · Allow auto-start" (shown on Xiaomi, Oppo,
Vivo, Realme, Huawei, Samsung); `122:8250` is the Android screen we deep-link to (not built).
Notifications row removed (v1).

**Reminders** `122:8292`: **not built in v1.**

**Delete my data** `122:8548`: **COPY CHANGE:** "Your locks, progress, streak and game history
are erased from this phone. Your subscription is not cancelled; do that in Google Play."
("and our servers" removed: there are none.) Confirm → clears MMKV, SQLite, native store,
returns to onboarding Welcome. Pro entitlement survives (it's on the Google account).

Hidden dev menu: tap Version 7 times (non-production builds only).

---

### B.10 Paywall (in-app) — `122:8637`, `122:8696`, `122:8755`

- Header Restore (left) + ✕. Title "Keep your focus growing". Feature list: "Block apps and
  websites, as many as you like" (**COPY CHANGE**, no schedules) · "All {n} focus games"
  (**COPY CHANGE**, drop "new ones every month" unless committed) · "Progress, streaks and
  weekly reflection".
- Plans and states exactly as onboarding paywall (10-phase1 §2.15). Fine print "{price}
  billed yearly. Cancel anytime in Google Play."
- Entry points: Settings plan card, 4th lock, locked game, Progress month view, trial-ended
  card on Home.
- **Subscription** `122:8755`: plan, price per week, renewal date, "Switch to monthly"
  (Play subscription change via RevenueCat), "Manage in Google Play" → Play subscriptions deep
  link for our package. "Cancelling keeps Pro until the end of the period you've paid for."
- Trial end: purely Google Play's (no local trial clock). When `pro` entitlement disappears,
  locks beyond 3 are **kept but paused** ("Paused · Free plan allows 3"), the user chooses which
  3 stay active.

---

### B.11 Data refresh and sync

- On app foreground: `getServiceHealth`, `getTodayCounters`, `getUsageToday`, write/refresh
  today's `daily_summary`; roll over any past days not yet summarised (from `getUsageRange`).
- While Home/Block is visible: refresh counters every 30 s.
- All writes to locks go JS → `setLocks()` immediately (optimistic UI, revert + toast on
  failure).

### B.12 Tests

- Lock flow: validation (domain parsing, duplicates, at-least-one-limit), multi-app creation,
  free-tier cap.
- Loosening rule matrix.
- Streak counting incl. detours and midnight boundary.
- Training pick determinism and constraints.
- Pause screen variant selection from (reason, strictness, unlocksUsed).

### B.13 Figma updates needed for this phase

1. New frames for the 3-step lock flow (§6.2–6.5) and the reworked Lock detail (§6.7) and Block
   tab rows (§6.6).
2. Copy changes marked **COPY CHANGE** across Home, pause screens, Settings, Paywall.
3. Remove or mark "Not in v1": Bedtime, Reminders, Edit schedule `120:5866`, Pick a time
   `120:5923`, old create-lock steps 1/4/5/6.

### B.14 Open questions

1. Free tier limits (README decision 8).
2. Unlock caps per day (3 Gentle, 2 Firm) — OK?
3. Keep the "App unlocked" countdown chip in v1, or rely on the Time's up screen?
