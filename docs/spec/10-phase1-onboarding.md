# 10 · Phase 1 — Onboarding

23 designed screens, Figma section ids: Splash `117:330`, About you `117:585`, Your results
`117:780`, The fix `117:1359`, Paywall `117:1521`, Set up `117:1585`.
Behaviour reference: `design/prototype/untangle-onboarding-v10.html`.

---

## 1. Flow

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

## 2. Screens

### 2.1 Welcome — `117:330` (variants A `117:332`, B `117:419`/`117:462`/`117:520`)

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

### 2.2 Your age — `117:587`

Title "How old are you?" · Subtitle "So we can show what your habits add up to over the years."
Options (single, auto-advance), stored value = midpoint age:
Under 18 (16) · 18 to 24 (21) · 25 to 34 (29) · 35 to 44 (39) · 45 to 54 (49) · 55 or older (60).

### 2.3 Scroll time — `117:634`

"How much do you scroll a day?" · "A guess is fine."
Options → hours used for maths: Under 1 hour (0.5) · 1 to 2 hours (1.5) · 2 to 3 hours (2.5) ·
3 to 4 hours (3.5) · More than 4 hours (4.5) · Not sure (2.65).

### 2.4 Pick-ups — `117:681`

"How often do you pick up your phone?" · "In a day. Most people guess low."
Under 50 · 50 to 100 · 100 to 200 · More than 200 · No idea. Stored only (used later on
Progress: "You guessed 50–100. Your real average is 74.").

### 2.5 Focus signs — `117:725` (multi-select)

"Do any of these sound like you?" · "Pick any that fit."
Losing focus at work or study · Long videos feel too long · Reading is harder than it was ·
Grabbing my phone without thinking · A foggy or restless mind · None of these.
"None of these" is exclusive: picking it clears the others; picking any other clears it.

### 2.6 Studying your answers — `117:782`

No back button. One bar fills over 2.4 s, turns green (`signal.success`), then the screen
fades into the next (no tap). Star field behind (subtle, Skia). If Reduce motion: bar fills in
0.8 s, no star drift.

### 2.7 That's N days of your year — `117:814`

- `daysPerYear = round(hours × 365 / 24)` → e.g. 2.5 h → 38.
- Title: "That's **{daysPerYear} days** of your year." (number in bold white).
- Body: "Full 24-hour days of scrolling, worked out from your answers. At this pace, that's
  {daysPerYear × 5} days by the time you're {ageMid + 5}."
- Visual: 365-dot grid, `daysPerYear` dots fill red row by row (0.9 s).
- CTA "Is there more?"
- Edge: "Under 1 hour" → 8 days; copy still reads fine. "Not sure" → 40 days and the body
  starts "If you're like most people, that's …" **COPY CHANGE (new line)**.

### 2.8 Problem 1 · Your focus is shrinking — `117:1199`

Bar chart: 2½ min (2004, green) vs 47 s (2016–20, red), "−69%" curved arrow. Source line
"Gloria Mark, UC Irvine · workplace studies, 2004 and 2016–2020". CTA "Can this change?".
Carousel dots 1/3. Bars grow on enter (480 ms, stagger 120 ms).

### 2.9 Problem 2 · You get distracted easily — `117:1239`

Laptop with "Q3 investor update" doc + phone stack, "20 min" timer chip. Body: "One
notification. One quick look. One more video. Twenty minutes later, you look up." Dots 2/3.

### 2.10 Problem 3 · Your focus feels foggy — `117:1300`

- Grumpy fog cloud illustration (asset), "{k} of 5 focus signs" pill progress (k red segments).
- `k` = number of signs picked (excluding "None").
- Body (k ≥ 1): "You ticked {k} of 5 signs of a scattered mind. That's common, and it's the
  part you can train."
- k = 0 ("None of these"): title "Your focus is worth guarding." Body "You didn't tick any
  signs. Good. Most people only notice the slide once it has happened." **COPY CHANGE (new
  variant)**, cloud swapped for a calm one.

### 2.11 Hours back — `117:1361`

- Two lines over a year: red "Same as now", green "30 min less a day".
- `goalCut = hours ≥ 1 ? 30 min : 15 min`; `hoursBack = round(goalCut/60 × 365)` → 183.
- Title: "But you can get **{hoursBack} hours** back." Body as designed. CTA "Show me how".

### 2.12 Moment of pause — `117:1400`

Phone mock with the pause card ("A moment of pause · Instagram is blocked until 6 pm") —
**COPY CHANGE** in the mock to "Instagram · You've had your 30 min today." (no schedules).
Title "Meet your moment of pause." Body "Open an app you've chosen to block and Untangle steps
in, so you get to choose what happens next." CTA "See how it works".

### 2.13 Blocking is step one — `117:1433`

Three numbered steps (Block the pull / Practise focus / Get your focus back). **COPY CHANGE**
step 1 body: "Locks the apps that hook you once you've had your share." CTA Continue.

### 2.14 Watch your focus grow — `117:1474`

Example bar chart Wk 1–6, last bar "48 min". Caption "Example. Yours fills in from your first
day." CTA Continue.

### 2.15 Paywall (trial) — `117:1523`

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

### 2.16 Permissions — `117:1587` (**COPY CHANGE: three permissions**)

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

### 2.17 Accessibility disclosure — `117:1631` (prominent disclosure, Play policy)

Bottom sheet over a dimmed mock of the Accessibility settings. Title "Let Untangle see which
app is open." Body "So we can step in when you open a blocked app. We only check the app or
site name, never your messages, and nothing leaves your phone." Buttons **Agree and open
settings** (→ `openAccessibilitySettings()`) and **Not now** (closes sheet, row stays
unticked). Must not be skippable by tapping outside (explicit choice). This exact screen is
what the Play declaration video records.

`117:1669` (system dialog) is **not built**: it is the Android system's own dialog, shown here
for the video storyboard only.

### 2.18 Pick apps — `117:1705`

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

### 2.19 You're all set — `117:1753`

Checklist (animated ticks, 150 ms stagger): "Untangle can step in" (Accessibility),
"Real screen time on" (Usage), "Stays on in the background" (Battery), "{n} apps blocked".
**COPY CHANGE:** "Reminders on" row removed. Rows for permissions not granted show an amber dot
and "Off · Turn on" (tap → that setting).
Title "You're all set." Body "Next time you open {App1}, {App2} or {App3}, your moment of pause
will be there." (1 app: "Next time you open Instagram…"; 4+: first two + "and 2 more").
CTA **Start my first round** → today's first training game (game shell, source `training`),
then Home. Secondary text button "Go to home".

---

## 3. Data written by onboarding

```ts
onboarding.answers = {
  ageMid: number; scrollHours: number; scrollAnswer: string; pickupsAnswer: string;
  signs: string[];            // ids, empty if "none"
}
// + Locks via setLocks(), + settings defaults (strictness gentle, unlock 5 min, daily goal 3)
```

## 4. Tests

- Maths: daysPerYear, ×5 line, hoursBack (15 vs 30 min), SAVE %, weekly price.
- "None of these" exclusivity.
- Resume from each step after process death.
- Permission step state machine (all combinations of granted / denied / greyed out).

## 5. Open questions

1. Welcome A or B? (Spec assumes B.)
2. Is the 30-minute default allowance on Pick apps right, or should onboarding block the apps
   completely by default (0 min, opens on the pause screen only)?
3. Free tier after closing the paywall: confirm "up to 3 locks + the 3 daily training games". On the free tier Pick apps caps the selection at 3 ("Free plan blocks up to 3. Go Pro for more.").
