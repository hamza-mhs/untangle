# Untangle · challenges → widgets · design spec (pack 2)

This pack covers everything after Block & focus:
- challenges (draw, list, read aloud, silence, done, time up)
- attention reps: mental maths in every state, plus four other games
- rewards
- evening: receipt and lights out
- settings
- everything outside the app (widgets, Live Activity, notification, share card)

**It builds on pack 1.** Tokens, type, radius, motion and the component catalogue are in `design/screens-06-to-block-focus/SPEC.md` §1–3. Code rules are in `design/screens-06-to-block-focus/CODE_STANDARDS.md`. Neither is repeated here; this file only adds what's new.

Sources, in priority order:
1. this file and `EDGE_CASES.md`
2. `screens/*.png` (2× at 390 pt wide; `FWidgets` is a 1500×760 board)
3. `measurements.json`
4. `source/*.dc.html`, for values only

Tags:
- **VERIFY**: platform behaviour to check before relying on it.
- **DECIDE**: a product call that's yours.

---

## 1 · New tokens

| Token | Value | Use |
|---|---|---|
| `color.challenge.timed` | `#E9F21F` (accent) | "TIMED" label, timed challenges |
| `color.challenge.yourWord` | `#A9D4FF` (sky) | "YOUR WORD" label |
| `color.challenge.verified` | `#30D158` | "Verified" label |
| `color.read` | `#FF7B2F` (orange) | everything in the read-aloud flow: CTA, mic, progress, idea chips |
| `color.game.word` | pink | Letter guess |
| `color.game.number` | accent | Mental maths, Make the target |
| `color.game.memory` | sky | Card pairs, Number span |
| `color.feedback.rightBg` / `rightBorder` | `#12321C` / `#30D158` | correct answer box |
| `color.feedback.wrongBg` / `wrongBorder` | `#3A1A18` / `#F45C55` | wrong answer box |
| `color.paper` / `color.ink` | `#F2F1EC` / `#111111` | receipt only |
| `font.mono` | JetBrains Mono 500/600 | difficulty labels, receipt, micro labels |

Each game has **one** colour. Its Start button, chips, lives and highlights all use that colour, the same way each onboarding question had one accent.

---

## 2 · New shared components

| Component | Props | Notes |
|---|---|---|
| `ChallengeCard` | `difficulty: 'easy'\|'med'\|'hard'`, `icon`, `title`, `meta`, `check: 'timed'\|'yourWord'\|'verified'`, `points`, `state: 'faceDown'\|'faceUp'\|'selected'\|'done'` | Face-down shows a ghost back plus the difficulty in mono. Flip = rotateY 180°, 400 ms, with a haptic on the midpoint. Selected = 2 pt accent ring. |
| `GameShell` | `title`, `right: {kind:'points', value} \| {kind:'timer', endsAt}`, `onClose`, `progress?` | Close × (40 pt circle) on the left, centred title, points or a timer pill (accent, stopwatch icon) on the right. Segmented progress bar under it when `progress` is set. Closing mid-game asks "Quit? No points" (system alert). |
| `GameIntro` | `tag`, `title`, `preview`, `rules: string[3]`, `meta`, `color` | Tag chip, title, preview card, 3 numbered rules, the meta line "≈ 2 min · timed · one round a day · +10 pts", and Start in the game colour. Same layout for every game. |
| `NumberPad` | `onDigit`, `onBack`, `onSubmit`, `submitEnabled` | 3×4 grid, keys 52 pt tall, `raisedHigh`; submit is green. Never use the system keyboard in games. |
| `LetterKeyboard` | `states: Record<letter,'unused'\|'hit'\|'miss'>` | QWERTY; hit = green, miss = faded. |
| `AnswerBox` | `value`, `state: 'typing'\|'right'\|'wrong'` | Uses the feedback tokens. When wrong, the value is struck through. |
| `ListeningBar` | `level` (0..1, live), `right`, `sub`, `color` | Mic button plus a live waveform (Reanimated bars driven by the mic level). |
| `ResultStats` | `items[3]` | Three `StatCard`s in a row (Points, Earned, Next time). |
| `VaultItem` | `name`, `size: 'small'\|'medium'\|'big'`, `cost`, `progress`, `canRedeem` | When it can be redeemed: a yellow "Redeem" pill and a full accent bar. Otherwise: cost in mono and a grey bar. |
| `DayGhostStrip` | `days[7]: {mood, isToday}` | One mini ghost per day, mood = that day's Clarity, today ringed in accent. Replaces the old "rings gallery". |
| `Receipt` | `lines`, `totals` | Paper card, mono, dashed rules, barcode. On iOS it's a DeviceActivityReport view (see §4). |

---

## 3 · Rules the screens depend on

These go in `features/challenges/rules.ts` as pure functions with tests.

- **Daily draw:**
  - Three cards a day: easy, medium and hard, drawn from the user's goals (OB05).
  - The draw unlocks at the morning time (default 07:30; set in OB14 / Settings).
  - One free redraw a day.
  - Doing all three gives a bonus (+50 total in the render). **DECIDE** the point table; the render uses 10/15/25.
- **Check types:**
  - **Timed:** the app ran the session, so it's verified.
  - **Verified:** confirmed by Screen Time or Health, e.g. Touch grass needs steps or time outdoors from HealthKit / Health Connect (**VERIFY** which signal).
  - **Your word:** self-reported. Your-word points are **capped per day**. **DECIDE** the cap; I'd make it 15 a day so honesty doesn't pay less than cheating.
  - "% verified" = verified points ÷ all points, shown next to the points total.
- **Weekly boss:** one per week (render: "Monk mode · Saturday · half day of strict focus · +100 · earns a streak freeze").
- **Reps (games):**
  - Every game is **time-boxed**.
  - One counted round per game per day.
  - After a time-up, one retry ("Try again · 1 left today").
  - Points only if finished inside the time.
  - Leaving the app pauses the clock (R5); it doesn't fail the round.
- **Difficulty ladder:** each game steps up after a win ("Next time: Harder · 6-step chains") and down after two losses in a row.
- **Earned app time:** focus, steps and reps add minutes. Earn-strength shields spend them. Show the balance on Rewards.
- **Streak freezes:** earned from hard challenges and the boss. One is used automatically on a missed day.

---

## 4 · Screens

### Challenges

**FDraw · `challenges/draw` (opens from the morning notification, or from Home if the draw hasn't happened yet).**
- "Good morning" / "Draw today's three challenges."
- Three face-down `ChallengeCard`s (EASY / MEDIUM / HARD) with the ghost on each back.
- "Tap a card to flip it."
- A legend card explaining Verified / Timed / Your word, with the cap note.
- "Flip all three" button, and "1 free redraw today".
- Tapping one card flips only that card. "Flip all three" flips them in sequence, 120 ms apart.

**FDrawReveal · same route, after the flip.**
- "Today's three" / "Drawn at 07:40 · 50 pts if you do all three".
- The three cards face-up. Each shows its icon, title, meta, check type and points; the first is selected.
- "Redraw one · 1 left" (pick a card, then this), and "How points work" (a sheet).
- The weekly boss card in accent.
- CTA "Start with {first}".
- With the redraw used: the button is disabled, reading "No redraws left".

**FChallenges · `(tabs)/challenges`.**
- Header "Challenges" with "180 pts · 70% verified".
- **Today:** the three as a list. Done rows are struck through with a ✓; the others show points.
- **Attention reps:** a 2-column grid of the six reps, each with its icon in its game colour and its duration. After that day's round, the tile shows "Done ✓" in muted text.
- **Library:** simple text chips for the longer challenges (Touch grass, Raw mode, No bed rotting, Brick Saturday, Phone-free meal, First hour clean). The ✓ or • after each one marks done this week or not yet.
- Before the day's draw: "Today" shows one "Draw today's three" row.

**OvChallengeDetail · `challenge/[id]`** (the read-aloud example).
- Back button and the "+15 pts" pill in orange.
- "Read 10 pages" plus an explanation: "Each word lights up as you say it, so the challenge checks itself."
- Genre chips (single select).
- "Today's text" card: source, author and excerpt, with "≈ 4 min aloud · 10 short pages" and "Another".
- Note: "Mic is on only on the next screen".
- CTA "Start reading 🎤" (orange).
- **Texts are public domain only.** Ship them in the app bundle, tagged by genre. Never fetch them at runtime.

**OvReading · `challenge/[id]/read`** (fullScreen).
- Header: close, "Page 3 of 10", +15. Segmented progress, one segment per page.
- Large text (28/600). Words already said are white; upcoming words are faint (30%); skipped words stay grey.
- `ListeningBar` (orange): "Listening · 40 of 56 words".
- Footer: "Skipped words stay grey. Audio stays on your phone."
- Speech must be **on-device**:
  - iOS: `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true`.
  - Android: `SpeechRecognizer.createOnDeviceSpeechRecognizer` (API 31+).
  - **VERIFY** language availability on both.
  - Matching is fuzzy, word-level, and forgiving of accents.
- A page passes at ≥ 80% of its words.

**OxSummary · `challenge/[id]/summary`.**
- "Say it in your words": a 30-second spoken summary after the last page.
- "What was it about?"
- A live transcript (the last words greyed, then a caret).
- "Key ideas · 2 of 3", shown as orange chips with ✓ when hit. A dashed chip is still to find.
- `ListeningBar` with "18s left".
- Footer: "Say the main idea. Exact words don't matter."
- Key ideas are 3 keyword sets per text, stored with the text. Matching is on-device keyword overlap. **No LLM, no network.**

**OxSilence · `challenge/silence`.**
- The same mechanics as OB12 (face-down detection, pause on lift), at 5 minutes.
- Calm ghost.
- "4m / 12s": seconds in pink, 150 pt / 96 pt.
- Status card "Face-down · untouched · One soft buzz at 2m 30s · tap once". The single mid-way haptic is the only interruption.
- "Motion and touch are checked on your phone only."

**OxDone · after any challenge.**
- Happy ghost (mood 1), "Done."
- A plain text line, **no chip**: "+20 pts" (pink) · "Clarity 74" · "+2" (green).
- A "why it helps" card with one sentence for each challenge type, plus two `StatCard`s (e.g. "3rd · quiet stretch this week", "9 ↑ from 4 · urges waited out").
- "Back to today".

**FTimeUp · a rep that ran out of time.**
- Ghost.
- "Time's up." / "You got 3 of 5 letters. The word was QUIET."
- The answer tiles: found letters in the game colour, missed ones grey.
- Note: "No points this round. Reps only count when you finish inside the time. Your best: 52 s."
- "Try again · 1 left today" (accent; becomes disabled "No tries left today") and "Back to challenges".
- No guilt copy.

### Reps: mental maths in every state (R1–R7)

R1–R7 are the reference state set. **Every game implements the same states** with its own content:

| State | File | Content |
|---|---|---|
| Ready | R1 | "5 chains · 2 minutes", a 3-2-1 countdown (big accent number), the rule line. Auto-starts. |
| Playing | R2 | "Chain 3 of 5 · step 2", the operation "× 2", its words ("Double it"), and a "Next step in 2s" progress bar. The timer pill runs. |
| Answer, right | R3 | "What's the number?", `AnswerBox` right (green), "Right · +4", the keypad. |
| Answer, wrong | R4 | `AnswerBox` wrong, with the value struck through. "It was 23. Next chain starts in 2s." |
| Paused | R5 | Triggered by `AppState` going to background. "Paused 0m 48s · You left the app, so the clock stopped. Nothing lost." Resume / "Quit · no points". |
| Won | R6 | Happy ghost, "Done in 1m 12s", "4 of 5 chains right · best is 1m 05s", `ResultStats`: Points +20 (Timed · verified), Earned +5 min, Next time: Harder (6-step chains). |
| Daily done | R7 | Opened again after today's round: neutral ghost, "Done for today." "One round of each rep a day, so it stays practice, not a habit. New chains tomorrow." Buttons: "Try {other game} instead" / "Back to today". |
| Time up | FTimeUp | See above. |

### The other games (intro → playing)

| Game | Intro | Playing |
|---|---|---|
| Letter guess (pink, +10, ≈2 min) | GLetter1. Rules: guess one letter at a time; wrong letters cost a life; six lives, fewer misses, more points. | GLetter2. Lives as 6 dots, a clue line, 5 letter slots, a "Missed" row, `LetterKeyboard`. Words come from a bundled list of calm, positive words. |
| Make the target (accent, +20, ≈2 min) | GTarget1. Rules: use all four numbers once, combine with + − × ÷, hit the target exactly. | GTarget2. 3-puzzle progress, the target circle, number keys (greyed when used), an expression field with "= 24 ?", operator keys. Undo with the back gesture. **Only generate puzzles that have a solution** (precompute them). |
| Card pairs (sky, +15, ≈3 min) | GPairs1. Rules: flip two at a time, match all 8 pairs, fewer flips, more points. | GPairs2. A 4×4 grid of simple shape cards, "5 of 8 pairs · 22 flips". Matched pairs go grey and stay put; a mismatch flips back after 700 ms. |
| Number span (sky, +15, ≈1 min) | GSpan1 is the "Watch" phase: digits appear one at a time (1 per second) in a big sky tile, with dots for the sequence. | GSpan2. "Type them back", digit slots, `NumberPad`. The length adapts: +1 after a success, −1 after a failure. "Best so far: 8 digits". |
| Read aloud | the read-aloud flow above, counted as a rep (4 min) | |

Image-based games were dropped on purpose. Don't add any.

### Rewards

**FRewards · `(tabs)/rewards`.**
- Header "Rewards", with the plan status ("Pro trial · 5 days" / "Pro" / nothing on free). Tapping it opens P09 (Plan & billing).
- Points card: "1,240" plus "78% verified" (green, plain text) and "260 to Dinner out".
- Two `StatCard`s: "App time to spend · 25 min · from steps and focus" and "Streak freezes · 2 · earned from hard challenges".
- "Your vault" with "+ Add": `VaultItem`s the user creates themselves (name, size, cost). Sizes have suggested costs: small 300, medium 1,500, big 5,000.
- "This week": a `DayGhostStrip`.
- Empty vault: one dashed card, "Add something you'd actually enjoy. A coffee, a film, a day out."

**FRedeem · `rewards/redeem/[id]`.**
- Happy ghost with "REDEEMED".
- "Coffee." and "300 points, 81% of them verified. You earned this one offline."
- Optional "Add a photo" card. It's stored locally, uses the photo picker (no library permission needed with the system picker; **VERIFY** on Android), and nothing is uploaded.
- "Done".
- Points are deducted on confirm, and the redemption is logged.

### Evening

**FReceipt · `evening/receipt`** (from the 21:30 notification or Lights out).
- "Today's receipt" with Share.
- A paper `Receipt` in mono:
  - date and time
  - screen time, opens, resisted, offline time
  - per-app minutes
  - this week, "= 1.1 workdays", vs last week
  - challenges and points
  - "THANK YOU FOR NOT SCROLLING"
  - barcode
- **iOS:** screen-time and per-app numbers can only be drawn inside a `DeviceActivityReport` extension. That means the whole receipt is a report view, and **Share can't export it as an image from the app** (**VERIFY**). Options:
  - share a version without the screen-time lines (opens/resisted/challenges only), or
  - let the user screenshot it.

  **DECIDE.** I'd take the first option.
- **Android:** a normal view, and Share renders it to an image.

**FLightsOut · `evening/lights-out`.**
- A lamp illustration with a yellow glow.
- "Lights out." / "Tap the lamp. Bedtime lock starts, the screen goes dark, the day settles."
- A summary list: Challenges 3 of 3, Opens resisted 14, Most opens "Bored · after 22:00" (from shield "why" answers), Tomorrow's draw 07:30.
- CTA "Lights out · lock till 07:00". It starts the bedtime rule now if it's earlier than scheduled. Tapping the lamp does the same, with the lamp switching off as the animation.
- If bedtime is already active, the CTA reads "Good night" and just closes.

### Settings

**FSettings · `settings`.**
- **Privacy:** "No account · Your data stays on this phone" (info row), App lock (Face ID / biometrics via `expo-local-authentication`), Discreet notifications (generic text, no app names).
- **Backup:** Export a backup file, Import.
- **Guides:** Grayscale shortcut, 5-min notification audit, Phone-free zones, How points work. These are static content pages.
- **Plan:** a row showing trial, Pro or Free. It opens P09.
- **Missing from the render, and needed:**
  - Notifications (on/off status plus Open Settings)
  - Screen Time access status plus Fix
  - Morning draw time
  - Bedtime hours
  - Restore purchases (also in P09)
  - Privacy policy, Terms, Contact, version

  Add them as list rows in the same style. No new design needed.
- **Where it's reached:** Home has no menu icon, by design. **DECIDE**. I'd put a gear in the Rewards header, because that's the "you" tab.

**Export / Import:**
- Export writes one versioned JSON file (`untangle-backup-YYYY-MM-DD.json`) through the share sheet. It contains rules, challenge history, points, vault, settings and the clarity history. **It doesn't contain** app selections: iOS `FamilyActivitySelection` tokens may not restore on another device (**VERIFY**), so after an import, ask the user to re-pick their apps.
- Import validates the file with zod and checks the schema version.

### Outside the app (`FWidgets` board)

| Surface | Content | Platform notes |
|---|---|---|
| Home widget, small | "Today", ghost (mood = Clarity), Clarity number, "1 of 3" | WidgetKit / Glance. Reads a snapshot from the App Group / shared prefs, which the app writes on every change. |
| Home widget, medium | Ghost + Clarity on the left. On the right, two buttons: "Start 5-min silence" (accent) and the next challenge. | iOS 17+ interactive widgets use App Intents. Starting silence must **open the app** (it needs the sensors). |
| Lock screen, rectangular + circular | "1 of 3 done" with icons · Clarity · streak flame | Plain text and SF Symbols only; no ghost, because lock-screen widgets are monochrome/tinted. |
| Dynamic Island | Compact: lock icon + "38:12". Expanded: "Lock in · 14 apps · 38m left" + progress | ActivityKit. Use the system timer (`Text(timerInterval:)`); never push updates every second. |
| Live Activity (lock screen) | "Lock in 38:12", progress, "Ends 10:50 · 14 apps locked · can't end early" | Same activity. Ends when the session ends. |
| Android ongoing notification | "Lock in · 38 min left" + progress | The foreground service's notification, with a chronometer. |
| Share card, weekly | "WEEK 43 · UNTANGLED", happy ghost, "−2h 10m screen time vs last week", "120 pages read · 48 resisted · 7/7" | Rendered to an image in-app (react-native-view-shot or Skia snapshot). Same iOS limit as the receipt: the screen-time delta can't be read by the app, so on iOS **DECIDE** to lead with pages and resisted instead. |

**Widget states:**
- Before onboarding is finished: "Open Untangle to start".
- Day 1: ghost plus "Day 1".
- Blocking off: the ghost tangled, with "Blocking is off" in danger colour.
- Focus running: the countdown replaces "1 of 3".

**Haptics** (from the board):
- light on chips and picks
- medium on starting a lock
- success on finishing a challenge
- warning on Time's up
- never on every keystroke
