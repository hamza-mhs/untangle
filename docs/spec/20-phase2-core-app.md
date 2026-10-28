# 20 · Phase 2 — Core app

Figma sections: App · Home `119:4689`, Games `119:5143`, Progress `120:5534`, Block & locks
`120:5646`, Create a lock `120:6312` (**superseded by §6**), Block apps & websites `120:6855`,
Focus now `121:7163`, Lock screens `122:7437`, Settings `122:8008`, Paywall `122:8635`.
Behaviour reference: `design/prototype/untangle-app-prototype.html` (Home option **C1**).

Prerequisites: Phase 0, the native module from 02-android-platform.md, and the game shell +
Stack tower (30-phase3-games.md §2, Batch 1) because the pause screen offers a game.

---

## 1. Navigation

- Root: onboarding (until complete) → tabs.
- Tabs (bottom bar, `TabBar`): **Today** · **Games** · **Progress** · **Block**. Icons from
  `Components · Icons`. Active tab white, inactive `text.tertiary`. Bar floats over content
  with a black → transparent fade (as designed); content has bottom padding 110.
- Stack screens slide from the right; sheets slide up with a dimmed backdrop (60% black).
- Game screens are full-screen, no tab bar, status bar light.
- Deep links (internal only): `untangle://game/<gameId>`, `untangle://lock/<lockId>`,
  `untangle://paywall`.

---

## 2. Today (Home, option C1) — `119:4691`

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

## 3. Screen time — `119:4844`

Today card (big number + delta), **Pick-ups by hour** chart (24 bars, bars with detours tinted
red), tiles **Pick-ups** "71 · 12 fewer than usual" and **Detours taken** "5 · Times you played
instead", **Most used** list (icon, name, "Blocked in a lock" / "Not blocked", minutes).
Tapping a "Not blocked" row → sheet "Limit {App}?" → allowance step (§6.4) with the app
preselected. Footnote: "Numbers come from Android's usage access. Untangle never sees what you
do inside an app."

States: no Usage access (whole screen = permission empty state), first day, zero pick-ups.

---

## 4. Games tab — `119:5145`, `119:5293`

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

## 5. Progress — `120:5536`

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

## 6. Locks — the new short flow (replaces `120:6312` frames)

### 6.1 Rules

- **One lock = one app or one website** with a daily allowance: `dailyMinutes` (0 = blocked all
  day, or 5–240) and/or `dailyOpens` (1–50). At least one must be set.
- No names, no icons to choose, no schedules, no "kind" step. A lock's title is the app label
  or the domain.
- Strictness is not asked. New locks use **Settings › Default strictness** (Gentle).
- Picking several apps creates one lock each, all with the same allowance.
- Free tier: max 3 locks; the 4th "New lock" opens the paywall.

### 6.2 Step 1 — "What do you want to limit?" (new frame)

Two large option cards: **An app** ("Instagram, TikTok, games…") and **A website** ("reddit.com,
youtube.com…"). Tap = next. Back closes the flow.

### 6.3 Step 2 — pick

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

### 6.4 Step 3 — "How much a day?" (rework of `120:6622`)

- **Time:** chips `Block all day` · `15 min` · `30 min` (default) · `45 min` · `1 hour` ·
  `Custom` (stepper, 5-minute steps, 5–240) · `No time limit`.
- **Opens:** "How many times a day?" chips `No limit` (default) · `3` · `5` · `10` · `Custom`
  (1–50). Hidden when "Block all day" is picked.
- Live summary sentence: "{App} opens up to 5 times and for 30 min a day. After that, your
  moment of pause." / "{App} is blocked all day. You can still play a game on the pause screen."
- CTA "Lock {App}" / "Lock {n} apps"; disabled with hint "Pick at least one limit" if both are
  No limit.

### 6.5 Done

Sheet (simplified `120:6821`): icons of the new locks, "Instagram is locked" (or "3 apps are
locked"), "You get 30 min a day. After that, a quick game instead." Buttons **Done** (→ Block
tab, new rows highlighted 1.5 s) and **Preview the pause screen** (opens the pause screen in
preview mode, no counting).

### 6.6 Block tab — `120:5648`

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

### 6.7 Lock detail — `120:5775` (reworked)

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

## 7. Focus now — `121:7165`, `121:7323`, `121:7375`

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

## 8. The pause screen family (Lock screens `122:7437`)

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

## 9. Settings — `122:8010`, `122:8089`

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

## 10. Paywall (in-app) — `122:8637`, `122:8696`, `122:8755`

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

## 11. Data refresh and sync

- On app foreground: `getServiceHealth`, `getTodayCounters`, `getUsageToday`, write/refresh
  today's `daily_summary`; roll over any past days not yet summarised (from `getUsageRange`).
- While Home/Block is visible: refresh counters every 30 s.
- All writes to locks go JS → `setLocks()` immediately (optimistic UI, revert + toast on
  failure).

## 12. Tests

- Lock flow: validation (domain parsing, duplicates, at-least-one-limit), multi-app creation,
  free-tier cap.
- Loosening rule matrix.
- Streak counting incl. detours and midnight boundary.
- Training pick determinism and constraints.
- Pause screen variant selection from (reason, strictness, unlocksUsed).

## 13. Figma updates needed for this phase

1. New frames for the 3-step lock flow (§6.2–6.5) and the reworked Lock detail (§6.7) and Block
   tab rows (§6.6).
2. Copy changes marked **COPY CHANGE** across Home, pause screens, Settings, Paywall.
3. Remove or mark "Not in v1": Bedtime, Reminders, Edit schedule `120:5866`, Pick a time
   `120:5923`, old create-lock steps 1/4/5/6.

## 14. Open questions

1. Free tier limits (README decision 8).
2. Unlock caps per day (3 Gentle, 2 Firm) — OK?
3. Keep the "App unlocked" countdown chip in v1, or rely on the Time's up screen?
