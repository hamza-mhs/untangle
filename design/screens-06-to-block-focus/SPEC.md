# Untangle · screens 06 → Block & focus · design spec

Covers onboarding 06–15, Home (Today) in five states, Block & focus, the block screens, pricing (P01–P13) and edge cases (E01–E10). Onboarding 01–05 are already built; they follow `design/onboarding-01-05/SPEC.md` and are refactored onto the shared tokens and components below.

**Source of truth, in this order:**
1. This file, plus `EDGE_CASES.md` and `CODE_STANDARDS.md`.
2. `screens/*.png`: 2× renders at 390 pt wide. Tall screens (Home) are full-scroll captures.
3. `measurements.json`: x, y, w, h, font, colour and radius for every element, measured from the renders.
4. `source/*.dc.html`: the design files. Use them for exact values only. **Never port the absolute positioning**; build with flex.

Where a render and this file disagree on spacing, this file wins.

Tags used below: **VERIFY** means a platform behaviour I'm not certain of; check it before building on it. **DECIDE** means a product call that's yours.

---

## 1 · Tokens

### 1.1 Colour: two layers

Components only ever import **semantic** tokens. Primitives exist only inside `src/design/tokens/`.

| Semantic token | Value | Use |
|---|---|---|
| `color.bg.canvas` | `#000000` | every screen background |
| `color.bg.surface` | `#121214` | low cards (widgets, wide areas) |
| `color.bg.raised` | `#1C1C1E` | cards, list groups, sheets, inputs |
| `color.bg.raisedHigh` | `#2C2C2E` | chips, segmented track, keys, app tiles, skeleton |
| `color.bg.overlay` | `#000000` at 62% | scrim behind sheets |
| `color.border.hairline` | `#2C2C2E` | 0.5 pt row separators |
| `color.border.control` | `#3A3A3C` | outline-button ring (1.5 pt), radio ring |
| `color.text.primary` | `#FFFFFF` | |
| `color.text.secondary` | `#CFCFCF` | body copy on dark, sheet body |
| `color.text.muted` | `#8C8C8C` | subtitles, meta, labels |
| `color.text.faint` | `#6E6E6E` | legal small print, done-state text |
| `color.text.onAccent` | `#000000` | any text or icon on yellow, pink, green or sky |
| `color.accent.primary` | `#E9F21F` | primary CTA, selected, Pro, focus card |
| `color.accent.primaryMuted` | `#3A3A1A` / text `#8C8C5A` | disabled or loading primary button |
| `color.status.success` | `#30D158` | positive deltas, verified, restored |
| `color.status.warning` | `#FFB224` | mid Clarity (40–69), grace notes |
| `color.status.danger` | `#FF453A` | low Clarity (<40), destructive |
| `color.status.dangerSoft` | `#F45C55` on `#3A1A18` | error icon tile, "Blocking is off" banner |
| `color.mood.pink` | `#F79BC9` | silence, "days", screen 2 |
| `color.mood.sky` | `#A9D4FF` | locks, screen 3 |
| `color.mood.peri` | `#6F7EF8` | screen 4 |
| `color.mood.green` | `#24CF6C` | goals, "With us" bar, Today dot |
| `color.mood.orange` | `#FF7B2F` | reading |
| `color.ios.link` | `#0A84FF` | **only** inside the mock iOS system dialogs (OB09–OB11). Never in our UI. |

**Reconcile with screens 1–5:** they use `surface #151515` for options. Map it to `color.bg.raised` (#1C1C1E). The difference is barely visible, and keeping two near-identical greys is how palettes rot.

**Clarity colour** is a function, not a token: `clarityColor(score)` returns `danger` below 40, `warning` from 40 to 69, and `success` from 70.

### 1.2 Type

Inter Tight 300/500/600/700, plus JetBrains Mono 500 for tiny uppercase labels only. Every number uses tabular figures (`fontVariant: ['tabular-nums']`).

| Token | Size / weight / line height / tracking | Where |
|---|---|---|
| `display.xl` | 78 / 700 / 78 / −3 | Clarity number on Home |
| `display.l` | 60 / 600 / 60 / −1.8 | countdown tiles, OB06 "76" (that one is 120 / 700) |
| `display.m` | 48 / 500 / 52 / −1.4 | OB12 timer |
| `title.l` | 34 / 700 / 37 / −1 | "Focus done.", "Today" |
| `title.m` | 28 / 700 / 31 / −0.84 | onboarding question, paywall headline |
| `title.s` | 24 / 700 / 29 / −0.5 | sheet titles, centred states |
| `headline` | 19 / 700 / 24 / −0.3 | small sheet titles (E05, E07) |
| `body.l` | 17 / 600 / 22 / −0.17 | buttons |
| `body` | 15 / 400 / 21 / 0 | list rows, sheet body |
| `body.s` | 14 / 400 / 20 / 0 | secondary paragraphs |
| `meta` | 13 / 400 or 600 / 17 / 0 | subtitles, counters, row sub-lines |
| `caption` | 12 / 400 / 16 / 0 | stat sub-lines, footnotes |
| `micro` | 11 / 600 / 14 / +0.4, uppercase, mono | "PRO · DAY 1 OF 7", "LOCKED" |

Respect Dynamic Type with `maxFontSizeMultiplier`: 1.3 for titles, 1.6 for body. Display numbers are capped at 1.0 because they're laid out as graphics.

### 1.3 Spacing, radius, elevation

- **Spacing scale (pt):** 4, 8, 12, 16, 20, 24, 32, 40. Screen side gutter 16 (onboarding: 10 for options, 22 for titles, as built).
- **Vertical rhythm, onboarding:** title, 8, subtitle, 32, content. Footer button 16 above the safe area.
- **Vertical rhythm, Home:** sections 20 apart, card internal padding 16.
- **Radius:**
  - `radius.s` 12: inputs, icon tiles, small tiles
  - `radius.m` 16: cards, list groups, banners
  - `radius.l` 22: sheets (top corners), hero tiles, the focus card
  - `radius.pill` (height / 2): buttons, chips, segmented control
  - Always `borderCurve: 'continuous'` on iOS.
- **No shadows.** Elevation is surface colour only. The single exception is the 1.5 pt inset ring on outline buttons and the 2 pt yellow ring on a selected plan.

### 1.4 Motion (`src/design/tokens/motion.ts`)

| Token | Value |
|---|---|
| `press` | scale 0.97, spring (damping 18, stiffness 300) |
| `select` | colour cross-fade 150 ms |
| `sheet` | native formSheet / bottom-sheet spring |
| `progress` | 250 ms ease-out |
| `countUp` | 600 ms ease-out (Clarity number on change) |
| `ghostLoop` | 8 s (see §3 Ghost) |

With Reduce Motion on, there are no loops and no count-ups. Values just appear.

---

## 2 · Icons and app tiles

- **Icons:** Lucide-style stroke icons, 1.8–2.2 stroke, sized 16/18/20/22. Use `lucide-react-native` (it's in the stack advice; **VERIFY** it's in package.json) and wrap it in `<Icon name size color />`.
- **App tiles:** in the designs, "IG", "TT" and similar are placeholders.
  - **iOS:** real icons must come from `Label(token)` rendered by the Screen Time framework inside a SwiftUI view. The app can't get the icon image itself. Build the tile as a native view wrapping `Label`.
  - **Android:** use `PackageManager.getApplicationIcon`.
  - **VERIFY** both against the current SDKs.
  - Tile sizes are 30, 36 and 50 pt, with radius 8, 9 and 13.

---

## 3 · Component catalogue (`src/design/components/`)

Build these once; screens only compose them. Props listed are the minimum.

| Component | Props | Notes |
|---|---|---|
| `Screen` | `scroll?`, `footer?`, `edges?` | SafeArea plus a black canvas. With `footer`, the footer is pinned and content scrolls behind it. |
| `PrimaryButton` | `label`, `onPress`, `variant: 'accent'\|'light'\|'outline'\|'ghost'`, `icon?`, `loading?`, `disabled?` | Height 56 (48 for the in-sheet secondary), pill. `loading` swaps the label for "Loading…" in `accentMuted`. `outline` is a 1.5 pt `border.control` ring. |
| `TextLink` | `label`, `onPress`, `tone?` | Centred 14–15/600, used for "Continue free" and "Not now". |
| `OnboardingHeader` | `step`, `total=15`, `onBack` | Already built in 1–5. |
| `Card` | `tone?: 'raised'\|'surface'\|'accent'\|'danger'`, `padding?` | `radius.m`. |
| `ListGroup` / `ListRow` | `title`, `subtitle?`, `leading?`, `trailing?`, `onPress?` | 0.5 pt hairlines inside the group, never on the last row. Row min height 50 (64 with subtitle and icon). |
| `Sheet` | `title`, `body?`, `icon?`, `children`, `actions` | Grabber 36×5, top radius 22, `bg.raised`. Use expo-router `presentation: 'formSheet'` (**VERIFY** detents on Android; otherwise use `@gorhom/bottom-sheet`). Actions pin to the bottom: primary first, then outline. |
| `Banner` | `kind: 'blockingOff'\|'grace'\|'offline'\|'trial'`, `onAction?` | 64 pt, `radius.m`, icon, title, sub, optional "Fix" button (pill, 28 pt). Sits under the top bar on Home. |
| `Toast` | `title`, `sub?`, `tone` | Top, 60 pt, auto-dismisses after 3 s, announced to VoiceOver. Used by E08. |
| `Ghost` | `mood: 0..1`, `size`, `animated?` | Skia. Same asset as the splash, without wires on the floor. `mood` drives eye shape, gem colour and wire looseness. `animated` cycles the 8 s loop (idle Home, OB12, Focus done). |
| `ClarityScore` | `value`, `label='CLARITY'` | `display.xl`, colour from `clarityColor`, count-up on change. |
| `ChallengeList` | `items`, `doneCount` | Header "Today's challenges" plus "n of 3". Each row has a status ring (done, next, todo), title, meta, and on the right a ✓, a yellow "Start" pill (next only) or "+pts". Done rows are struck through in `text.faint`. |
| `BlockedAppsCard` | `mode: 'idle'\|'focus'\|'evening'\|'off'`, `count`, `subtitle`, `apps` | 68 pt card with a rounded yellow lock tile (coral in `off`), title, sub, three overlapping app tiles and a chevron. Tap goes to the Block tab. |
| `StatCard` | `label`, `value`, `delta?`, `deltaTone?`, `sub` | Value with **plain coloured delta text inline**. No chips, no pills (explicit design rule). |
| `StatsGrid` | `mode: 'normal'\|'baseline'`, `day?` | 2×2 `StatCard`. `baseline` shows one card: "Building your baseline · day n of 7". |
| `FocusCard` | `endsAt`, `passesLeft` | Yellow, `radius.l`, live countdown "38m 12s", "ends 10:50". |
| `Countdown` | `endsAt`, `format: 'tiles'\|'inline'\|'ms'` | Driven by one Reanimated clock, never `setInterval` into React state. |
| `Segmented` | `options`, `value`, `onChange` | Pill track `raisedHigh`. |
| `Toggle` | `value`, `onChange` | Use the native `Switch` with `trackColor` set to accent. Don't hand-roll it. |
| `ChoiceChip` | `label`, `selected`, `onPress` | Selection control only (duration, reason). For **information**, use plain text, not chips. |
| `StrengthOption` | `strength: 'pause'\|'earn'\|'locked'`, `selected`, `locked?` | Radio, title, description and a "Free" or "Pro" tag. |
| `PlanOption` | `plan`, `selected` | 64 pt, radio, name, optional "Saves 50%" tag, sub, price. Price strings come **only** from the store product (`priceString`); never format them yourself. |
| `FeatureTable` | `rows` | Free vs Pro. The copy lives in `features/paywall/featureRows.ts`. |
| `AppTile` | `app`, `size` | See §2. |
| `TabBar` | | Four tabs: Today, Challenges, Block, Rewards. **No centre Focus button** (removed on purpose). |
| `StarField` | | Already built for the splash; reused faint on Home, Focus done and OB12. |

---

## 4 · Navigation

```
(onboarding)  01 → … → 15 ─┐            (stack, no gestures back from 13 onward: the quiet minute is done)
                           ▼
(tabs)  Today │ Challenges │ Block │ Rewards
   Today ── Start focus ─▶ focus/start (formSheet) ─▶ focus/run (fullScreen, no back) ─▶ focus/done
                                                     └─▶ focus/emergency (formSheet)
   Block ── rule/new, rule/[id] (modal) · strength Locked when free ─▶ paywall/gate (P07)
   Paywall (P03, P13) ─▶ store sheet (P04, OS-owned) ─▶ pro/success (P05) | E05 | E06
   settings/billing (P09) ─▶ settings/cancel (P10) ─▶ store manage-subscription URL
Shield: Android = our full-screen activity (FShield). iOS = ShieldConfiguration extension (FShieldiOS).
```

**Deep links.** These are needed by notifications, widgets and the shield:

- `untangle://focus/run`
- `untangle://block`
- `untangle://paywall?from=<source>`
- `untangle://challenge/<id>`
- `untangle://fix-access`

---

## 5 · Screens

The format for each screen is **ID · route · purpose**, then content, states, behaviour and data. The copy is final unless marked.

### Onboarding 06–15 (`app/(onboarding)/`)

All of them use `OnboardingHeader` (step n/15), the pinned footer button and the §1.3 rhythm. Answers persist to `onboardingStore` after every step, and the flow resumes at the last unfinished step.

**OB06 · `your-year` · make the cost concrete with their own number.**
- Content:
  - Label "At your pace, this year".
  - Hero number = `round(hoursPerDay × 365 / 24)`, using the midpoint of the OB02 bucket (Under 2 → 1.5, 2–4 → 3, 4–6 → 5, 6–8 → 7, 8+ → 9, Not sure → 5). The number is white, 120/700.
  - "days" in pink.
  - Body: "on your phone. That's more than two months, awake."
  - A small card with the formula: "From your answer: about {h} hours a day × 365 days ÷ 24. No scare stats, just your number."
- The body copy must scale with the result: under 30 days → "That's {n} days, awake." **DECIDE** the exact thresholds.
- CTA "Continue" (light variant).

**OB07 · `good-news` · the reframe.**
- Ghost (mood 0.5, static) at the top.
- Title "The good news."
- Body: "One hour less a day gives you **15 days a year** back." The figure is 365/24, shown in green.
- Two bars:
  - "Now" · {OB06} days (pink, full width)
  - "With us" · {OB06 − 15} days (green, width proportional)
- Note: "Simple maths on your own number. Most people start smaller. That's fine."
- CTA "Let's do it" (accent).
- Edge case: if the OB06 result is ≤ 15 days, the goal becomes 30 min a day (7.6 days). Don't show a zero or negative bar.

**OB08 · `strength` · teach the three strengths before the system dialogs.**
- `StrengthOption` × 3, all informational. The selection made here sets the default strength for the first rule (preselected: Earn). The options:
  - Pause (Free): "A 10-second breath, then close it or open for 5 min"
  - Earn (Free): "Stays blocked until you spend minutes you earned"
  - Locked (Pro): "No unlock until it ends. 2 emergency passes a week"
- Picking Locked during onboarding is allowed, because the reverse trial makes everything available. On day 7 it degrades to Earn (P06).

**OB09 · `screen-time-access` · coach the Screen Time dialog.**
- An illustrated mock dialog with "Tap this one" pointing at **Continue**.
- CTA "Show me" calls `AuthorizationCenter.requestAuthorization(for: .individual)`.
- Outcomes:
  - Approved → OB10.
  - Denied → **E01**.
- **VERIFY:** after a denial, whether `requestAuthorization` can present the system prompt again, or whether it fails silently and the user has to go to Settings. Design E01 for the worst case.
- **Android:** this screen needs a variant (Usage Access in Settings, plus Display over other apps or Accessibility). **Not designed yet** (see EDGE_CASES gaps).

**OB10 · `pick-apps` · coach Apple's FamilyActivityPicker.**
- Mock picker with "Then Done" pointing at Done.
- CTA "Open picker" presents the native picker. The selection is saved as an opaque `FamilyActivitySelection` (iOS); you can't read app names from it.
- Cancelled or empty → stay here and show the subtitle in warning colour: "Pick at least one to continue."
- On Android this is our own installed-apps list.

**OB11 · `notifications` · coach the notification dialog.**
- Same pattern as OB09, pointing at Allow.
- Denied → continue anyway. Show **E02** once, later, on Home, not here: nothing in onboarding should feel like a dead end.

**OB12 · `quiet-minute` · the first win, a 60-second silence.**
- Live ghost (animated).
- Caption "Try it now · one quiet minute".
- Countdown "0m 42s" (seconds in pink).
- "Phone face-down. Nothing to do. That's the point."
- Status card "Face-down · untouched / Lifting it pauses the timer".
- States:
  - waiting for face-down
  - running
  - paused (lifted): card turns `raisedHigh`, text "Paused · put it face-down to continue"
  - done → OB13 automatically
- Face-down comes from `expo-sensors` DeviceMotion (gravity z ≈ +9.8 when face-down). **VERIFY** the sign on both platforms.
- Fallback when there's no sensor: a "Hold to continue" button.
- No skip button for 10 s, then show "Skip" in muted text.

**OB13 · `knot-loosened` · reward plus a starting score.**
- Ghost at its happiest pose.
- "One knot loosened."
- Body copy.
- Card "Your starting Clarity · 41".
- CTA "See my plan".
- Starting Clarity is computed from the answers. Keep the formula in `features/clarity/score.ts` with unit tests. **DECIDE** the formula. It must land in the 30–55 range so it can visibly rise.

**OB14 · `plan` · summarise; no new questions.**
- Three coloured cards built from the answers:
  - Locks (sky): app labels from OB03, plus bedtime 23:00–07:00 on by default, plus mornings 7–9 if OB04 includes "morning"
  - Daily challenges (green)
  - Goal (yellow)
- Each card is tappable and opens the matching setting after onboarding. Here it just shows them.

**OB15 · `trial` · the reverse trial, honestly.**
- Timeline:
  - Today: "Every feature, including Locked and widgets"
  - Day 5: "Pro ends in 2 days. Your free features stay."
  - Day 7: "One screen you can close. Keep Pro, or carry on free."
- "Free, always" card.
- CTA "Turn on my first lock" creates the first rule (and the bedtime rule), applies the shields, sets `trialStartedAt = now`, then goes to Home with P01.
- The trial is **app-side** (no store intro offer), so it's stored locally. Reinstalling resets it. **DECIDE** whether that's acceptable, or whether to use the Keychain (survives reinstall on iOS) for `trialStartedAt`.

### Home · `(tabs)/today`

The order is fixed: top bar, optional banner, Ghost, Clarity, one action, today's challenges, blocked apps, stats, tab bar. The whole screen scrolls; the tab bar is pinned.

| Element | Spec |
|---|---|
| Top bar | Date "Thursday 22 Oct" (`meta`, muted) over "Today" (`title.l`). Right side: streak pill with a flame icon and the number. **No menu or settings icon** (settings live in the Block tab and the Rewards tab header; **DECIDE** which). |
| Banner | One at a time, by priority: `blockingOff` > `grace` > `offline` > trial toast (P01). |
| Ghost | 156 pt. Mood = Clarity / 100. Animated only in the idle state and when no banner is shown. |
| Clarity | `ClarityScore`, label "CLARITY". |
| Action | Idle: "Start focus 🔒" (accent, 56). Evening, after 20:00 and with all three done: "Lights out". Focus running: replaced by `FocusCard` plus the line "Can't be turned off early · Emergency pass (n left)". |
| Challenges | `ChallengeList`. |
| Blocked apps | `BlockedAppsCard`. |
| Stats | `StatsGrid`. Normal: Screen time (vs yesterday), Longest focus (without unlocking), Pickups (a day), Opens resisted (% of tries closed), all "vs your first week". Days 1–7: `baseline`. |

**The five states:**

| State | File | Data |
|---|---|---|
| Idle | HomeB | Clarity 64 (warning), 1 of 3, "6 apps blocked · 2 rules on · until 23:00" |
| Focus running | HomeBFocus | Focus card, "14 apps locked · Lock in · until 10:50" |
| Evening | HomeBEvening | 86 (success), "Lights out", 3 of 3, "Bedtime lock at 23:00 · Starts in 1h 20m" |
| Day 1 | HomeBDay1 | Streak 1, 41 (warning), 0 of 3, baseline stats |
| Blocking off | HomeBOff | Banner "Blocking is off · Screen Time access was turned off. · Fix"; Clarity frozen; apps card in danger mode "Not blocking · 6 apps · access needed" |

**Data sources (important on iOS):**
- **Screen time and pickups:** on iOS these figures can only be **displayed** through a `DeviceActivityReport` extension view embedded in the screen. The app process can't read the numbers. **VERIFY** current iOS rules. If that's still true:
  - the two cards are a native report view with our styling
  - their deltas can't feed Clarity, widgets or notifications on iOS
  - on Android, compute them from UsageStatsManager
- **Longest focus and Opens resisted:** our own data. Focus sessions come from the app; shield events come from the ShieldAction extension, written to the App Group. These are safe everywhere.

### Block & focus

**FBlock · `(tabs)/block` · every rule at a glance.**
- Header "Block" with a status "Blocking on". The dot in that status is the only status dot left, and it should become an icon to match Home. **DECIDE**; I'd swap it.
- `Segmented`: Rules | Apps.
- One rule card per rule:
  - name
  - optional "Default" tag (bedtime)
  - schedule line
  - app tiles (max 3 + "+n")
  - strength label in micro caps, coloured: LOCKED yellow, EARN sky, PAUSE muted
  - `Toggle`
- Disabled rules have muted text.
- Open-budget rule variant: progress bar plus "6/10".
- "+ New rule" outline button. With two rules on free, it opens P08.
- States:
  - empty (only bedtime): one card plus the hint "Add a rule for the apps that pull you in at work"
  - blocking off: the whole list is muted, with the blockingOff banner on top

**FRuleEdit · `rule/new` and `rule/[id]` (modal) · create or edit a rule.**
- Nav: Cancel | New rule | Save (Save disabled until valid).
- Sections:
  - Apps: tiles, "Social + 2 apps · 6 total", "Choose" opens the native picker
  - When: weekday circles (selected = accent) plus From/To pills (native time picker)
  - Strength: 3 × `StrengthOption`. Locked shows a "Pro" tag; picking it on free opens P07.
- Validation:
  - at least 1 app
  - at least 1 day
  - From ≠ To (overnight ranges allowed: 23:00 → 07:00)
- Editing a rule while it is **active and Locked** is blocked. Show a sheet: "This rule is locked until 12:00. You can edit it after."

**FFocusStart · `focus/start` (formSheet over Home) · configure a session.**
- "Lock in", sub "Everything below stays locked. No turning it off early."
- Duration chips 25 / 50 / 90 (default = the attention ladder's next step).
- Apps line with "+ 9 more · Edit".
- "Flip to start" toggle.
- "You'll earn 15 min · +25 pts".
- CTA "Start {n}-min focus 🔒".
- If blocking is unavailable → **E09** instead of starting.

**FFocusRun · `focus/run` (fullScreenModal, gestures off, Android back = no-op) · the session.**
- "Locked" pill.
- Countdown tiles: hours / min / sec, with sec on accent.
- "Ends at 10:50. It won't stop early."
- Progress.
- "Locked now · 14 apps" tiles.
- "Use the time": three suggestions with points.
- "You'll earn …".
- Outline button "Emergency pass · 2 left this week".
- The session lives in the OS, not in React:
  - iOS: a `DeviceActivitySchedule` plus `ManagedSettingsStore`
  - Android: foreground service
- Killing the app doesn't end it. On relaunch, rehydrate from the stored `{startedAt, endsAt}`.
- Also start a Live Activity (iOS) or an ongoing notification (Android).

**FEmergency · `focus/emergency` (formSheet) · the logged escape hatch.**
- "Use an emergency pass?"
- Reason chips (one required, default none; the render shows "Work or school" selected).
- Optional note.
- "Keep focusing" (accent, first), then "Use pass · 10 min" (outline, enabled once a reason is picked).
- Using a pass removes the shields for 10 min, logs `{reason, note, at}` and re-applies them automatically.
- With 0 passes left → **E10**.

**FFocusDone · `focus/done` · the reward.**
- Animated ghost.
- "Focus done." and "50 minutes. Two of three knots loose."
- Three `StatCard`s:
  - Earned +15 min (app time)
  - Points +25 (100% verified)
  - Clarity 78 (+6 today)
- Attention ladder: "Next session: 55 min · +5 min a step" with segment progress.
- "Back to today".
- Shown on the next app open if the session ended while the app was closed (the notification deep-links here).

**FShield · Android full-screen block (Pause strength).**
- App tile.
- "Instagram is paused."
- "6th time today. You usually stay 11 min."
- Breathe ring counting 10 → 0.
- "Why are you opening this?" chips (Bored, Habit, Need something, Avoiding work): this logs a trigger.
- Swap suggestion card "Read 10 pages instead · Today's challenge · +15 · Start".
- "Close Instagram" (accent).
- "Spend 10 min · 25 left" (outline, disabled until the breath ends).
- Variants by strength:
  - Earn: the secondary is "Spend 10 min" from earned minutes, disabled at 0 with the label "No minutes earned yet"
  - Locked: no secondary, only "Close", plus "Unlocks at 12:00"

**FShieldiOS · ShieldConfiguration extension.**
- Apple allows only an icon, title, subtitle, primary button and secondary button.
- Title "Instagram is locked".
- Subtitle "Close this and you're 40 pts from Dinner out."
- Buttons "Close" / "Spend 10 min".
- The breath and the "why" question arrive as a local notification that opens the app.
- **VERIFY:** the extension can't present UI or open the app directly. The ShieldAction can only `close` or `defer`, so "Spend 10 min" must defer and signal the app through the App Group, then the app grants the time.

### Pricing P01–P13 (`features/paywall`)

Products: Yearly $29.99, Monthly $4.99, Lifetime $59.99 (the render prices are US placeholders). Entitlement `pro`, through RevenueCat. **Payment cards are never designed or handled by us**: the store sheet owns them.

| ID | Route / trigger | Content and behaviour |
|---|---|---|
| P01 Trial | Home, first time after OB15 | Card "PRO · DAY 1 OF 7 · Your first lock is on. So is Pro. Every feature for 7 days. No card, nothing to cancel." with "What's in Pro" (link, opens P03 read-only) and "Got it" (dismiss). Shown once. |
| P02 Day 5 | Home sheet on day 5 (first open) | "PRO · DAY 5 OF 7 · Pro ends in 2 days. Your free features stay." What changes: Bedtime (Locked) becomes Earn, website blocks pause, widgets stay until day 7. A personal line built from real counts, e.g. "This week with Pro: 3 locks held, 14 opens resisted, 2 emergency passes left unused." Buttons "See plans" / "Remind me on day 7". **Hide any count that is 0.** |
| P03 Paywall | Day 7 on first open; also from Settings | Close × top right, **always visible from frame 1**. "Keep Pro. / Or carry on free." `FeatureTable`, then 3 × `PlanOption` (Yearly preselected), "Keep Pro · $29.99 a year", "Continue free", and the legal line "Cancel any time in Settings · Same price every year · Restore". Restore is a real button. |
| P04 Checkout | OS sheet | Reference only: **do not build**. |
| P05 Success | after purchase | Ghost. "You're Pro." "Yearly · renews {date} at {price}." Now-unlocked list with direct actions. "Back to today". |
| P06 Went free | Home sheet after day 7 with no purchase, or after a lapse | "You're on free. Nothing you made is deleted." Change list: Bedtime Locked → Earn; your 2 free rules kept; others paused, not deleted; websites paused; points kept. "Got it" / "Choose which 2 rules stay". **Keep-by-default rule:** the 2 most recently used rules. |
| P07 Gate · Locked | picking Locked on free | Personalised line from shield logs ("opened TikTok in a Pause rule 9 times this week"). "See Pro plans" / "Use Earn instead". With no data, drop the line. |
| P08 Limit · rules | "+ New rule" with 2 free rules | "2 of 2 free rules in use" with both rules and Edit. "Go unlimited · Pro" / "Edit a rule". |
| P09 Billing | `settings/billing` | Plan card (Active / In grace / Expires {date}), Change plan, "Manage in App Store", Restore, Family Sharing, the "Free, always" list, and the promise "We never move a free feature behind the paywall later." |
| P10 Cancel | from P09 | Optional reason chips, "Switch to monthly instead" (offer card), "Keep Pro" (accent), "Continue to App Store to cancel" opens the store's manage page. We can't cancel in-app (iOS `showManageSubscriptions`; Android Play subscriptions deep link). |
| P11 Grace | Home banner while billing retry is in progress | "Payment didn't go through · Pro stays on while the App Store retries. · Fix". Fix opens the store's manage page. Pro stays on. The grace period length is a **store setting**: enable Billing Grace Period in App Store Connect and Play Console. **VERIFY** the lengths you pick. |
| P12 Win-back | Home sheet, once, 60+ days after Pro ended | "Pro's been off for 2 months." Personal line. "$14.99 first year · then $29.99 a year. Offered once, no timer." **DECIDE** the price. It uses Apple win-back offers and Google Play offers, which are configured in the stores, not in code. |
| P13 Contextual | Paywall opened from a specific moment (e.g. bedtime) | Headline tied to the source ("Make Bedtime unbreakable."), three benefit rows, plans, "Get Pro · $29.99 a year", "Not now", "Cancel any time · Restore purchases". `?from=` drives the headline copy (`paywallCopy.ts`). |

### Edge cases E01–E10

Full screens are listed below. The full condition → behaviour matrix is in `EDGE_CASES.md`.

| ID | Trigger | Content | Actions |
|---|---|---|---|
| E01 Screen Time denied | OB09 denied, or `authorizationStatus == .denied` at launch | Ghost (tangled). "Blocking needs Screen Time access." Body text, plus a card with the Settings path. | "Try again" (accent) re-requests; "Continue without blocking" (outline) finishes onboarding in no-blocking mode, so Home shows `blockingOff`. |
| E02 Notifications off | First Home open after OB11 was denied. **Shown once.** | Sheet "Notifications are off · You won't hear when a lock ends." | "Open Settings" (`Linking.openSettings()`) / "Not now". |
| E03 Paywall loading | Offerings not loaded yet | Plan skeletons (3), CTA in loading state, "Continue free" **still active**. | Time out after 8 s → E04. |
| E04 Paywall offline | No network, or offerings failed | "You're offline · Plans load when you're back online. Your free features keep working." | "Try again", "Continue free". Retry automatically on reconnect (NetInfo). |
| E05 Purchase failed | Store returns an error that **isn't** user-cancelled | Sheet over the paywall: "Payment didn't go through · You haven't been charged." | "Try again" / "Check payment method" (store manage page). User-cancelled → **no UI at all**; just return to the paywall. |
| E06 Purchase pending | Ask to Buy, or a deferred bank approval | "Waiting for approval…" Pro turns on by itself through the RevenueCat customer-info listener. | "OK". |
| E07 Restore: nothing | Restore returns no `pro` entitlement | Sheet "No purchases found" plus a hint about switching Apple ID. | "See plans" / "Close". |
| E08 Restore: success | Restore returns `pro` | Toast "Pro restored · Yearly · renews {date}". | Auto-dismiss. |
| E09 Can't lock | Start focus while access is revoked | Sheet "Can't lock right now". | "Fix access" (Settings, or re-request) / "Timer only, no lock" (a session with no shields and **no points**; **DECIDE**). |
| E10 No passes | Emergency pass tapped with 0 left | Sheet "No passes left this week · They reset on Monday. This lock ends at 10:50." Plain text log of the passes used. | "Keep focusing". Week boundary = Monday 00:00 local. |

---

## 6 · Behaviour shared by every screen

- **Haptics** (`lib/haptics`):
  - `select` on option, chip and toggle
  - `tap` on primary buttons
  - `success` on focus done, purchase and restore
  - `warning` on limits and errors
- **Press feedback:** scale 0.97 on every pressable. Selected states cross-fade.
- **Accessibility:**
  - Every icon-only button has `accessibilityLabel`.
  - Countdowns announce once a minute, not every second (`accessibilityLiveRegion="polite"` on Android; throttle on iOS).
  - Clarity reads as "Clarity 64 out of 100".
  - Hit targets are at least 44×44.
- **Offline:** everything except the paywall, restore and win-back works offline. Blocking and focus are on-device.
- **Time:** all times are local. Reschedule `DeviceActivity` schedules on timezone change (`NSSystemTimeZoneDidChange` / `ACTION_TIMEZONE_CHANGED`).
- **Screen sizes:** designed at 390 pt. Check at 375 (SE / mini) and 430 (Pro Max): lists scroll, footers stay pinned, and the Home ghost shrinks to 128 below 700 pt of height.
