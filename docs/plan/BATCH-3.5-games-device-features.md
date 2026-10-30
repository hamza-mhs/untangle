# BATCH 3.5 — Device features (4 games)

**Goal:** Games that use the phone's sensors and microphone. Highest risk: ask the owner the decision questions in 3.5.0 before writing code.

Prerequisite: Batches 1, 2 and 3.1 done.

## Before you start (every games batch)

- Read `docs/plan/README.md` (rules), `docs/plan/PROGRESS.md` (what exists) and the engine in
  `src/features/games/engine/` (types in `engine/types.ts`). **Use the existing `GameApi`**
  — don't change the engine contract without asking.
- Per-game folder structure (introduced in 3.2.0): `src/features/games/games/<gameId>/`
  with `index.ts` (exports the `GameDefinition`), `Round.tsx` (board UI), `logic.ts` (pure
  rules/generators/scoring), `__tests__/logic.test.ts`, optional `content.json`. Shared board
  parts live in `src/features/games/kit/`. Register in `registry.ts` with a lazy import.
- Port from the prototype: open `design/prototype/untangle-games-prototype.html` (toggle Intro /
  Game) and read the game's source in `design/prototype/games/` (file named per game below).
  Keep the prototype's **top** star thresholds; a 1-star band for poor rounds is fine
  (same as 3.1). Replace fixed demo text and drop "+XP".
- Generators: tested over 1,000 seeds (solvable, within difficulty band).
- Calm games: no countdown, `settle` line, calm result.
- Every game: haptics on input/correct/wrong, sound ids where listed, reduced-motion path,
  TalkBack labels on intro/result/pause.
- Done = `npm run check` passes, the game plays on the emulator start → result, result + best
  saved, quitting saves an incomplete round, catalog shows it in the Games tab, and its
  screenshot comparison (`design/screens/games/<gameId>--playing.png`) has no obvious gaps.
- Commit after each sub-batch (`batch-3.N<x>: …`) and update `docs/plan/PROGRESS.md`.

## Sub-batches

| # | Sub-batch | Games |
|---|---|---|
| 3.5.0 | Decisions (ask the owner, then record in PROGRESS.md) | — |
| 3.5a | Motion sensors | Hold the line, Move first |
| 3.5b | Phone away | Phone away |
| 3.5c | Read aloud | Read aloud |
| 3.5d | Wiring | — |

### 3.5.0 · Decisions (ask the owner, then record in PROGRESS.md)

1. **Phone away** (25 min face down) must keep counting with the screen off. Options:
   (a) a foreground service with a Play-declared type (e.g. `specialUse`) + a persistent
   notification — conflicts with "no notifications" and needs a Play declaration;
   (b) count only while Untangle stays in front with the screen on (simple, no policy work,
   but the screen stays on). Recommend (b) for v1.
2. **Read aloud** uses Android `SpeechRecognizer`; offline only where the phone has an offline
   language pack, otherwise it needs the network (breaks the offline rule) and Google's
   recognizer. Options: ship as "needs internet on some phones" with a clear message, or
   drop from v1. It also needs the microphone permission with its own in-app disclosure.
3. Sensor games need an accelerometer/gyroscope; hide them on phones without one.

Commit: `batch-3.5.0: decisions (ask the owner, then record in progress.md)`

### 3.5a · Motion sensors

Games: Hold the line, Move first.

Add `expo-sensors` back (`npx expo install expo-sensors`). Calibrate "flat"/"standing" at the
start of each round; low-pass filter readings; tests for the rep-detection and centring logic
with recorded sample data in `__tests__/fixtures`. Reduced motion has no effect on these games
(the motion is the input) but visuals still respect it.

Commit: `batch-3.5a: motion sensors`

### 3.5b · Phone away

Games: Phone away.

Implement the option chosen in 3.5.0. Durations 15/25/45 min; picking the phone up pauses; result counts pick-ups.

Commit: `batch-3.5b: phone away`

### 3.5c · Read aloud

Games: Read aloud.

Only if kept in 3.5.0. Mic permission flow with disclosure, graceful fallback when recognition is unavailable ("Read it to yourself, then tap Done"). Content: short original passages (pipeline, owner review).

Commit: `batch-3.5c: read aloud`

### 3.5d · Wiring

Games tab only (not training rotation, not the pause pool) unless the owner says otherwise.

Commit: `batch-3.5d: wiring`

## Screens

Screenshots in `design/screens/games/`.

| Game | id | Intro / Playing screenshot | Figma intro / playing |
|---|---|---|---|
| Hold the line | `holdTheLine` | `holdTheLine--intro.png` / `holdTheLine--playing.png` | `130:15854` / `130:15891` |
| Move first | `moveFirst` | `moveFirst--intro.png` / `moveFirst--playing.png` | `130:16329` / `130:16373` |
| Phone away | `phoneAway` | `phoneAway--intro.png` / `phoneAway--playing.png` | `130:16265` / `130:16301` |
| Read aloud | `readAloud` | `readAloud--intro.png` / `readAloud--playing.png` | `130:15701` / `130:15773` |

---

# Game specs

Format: id · group · batch · length · colours · background · Figma · how to play (intro copy) · round loop · result (from the prototype) · best tracked · engine features · build notes · designer note.

### Hold the line — `holdTheLine`

- **Group:** Calm (`calm`) · **Batch:** B5 · **Effort:** M
- **Chip / length:** CALM · 45 SEC · round timer 30 s
- **Colours:** accent `#22A6FF` · **Background:** `dots` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:15854` · Playing `130:15891` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** A dot wobbles inside a ring. Tilt the phone gently to keep it centred. Small, slow moves work best.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Steady hands', line: 'Half a minute of small, careful movements.', stats: ['30 sec', 'Mostly centred'] };
  ```
- **Best tracked:** —
- **Engine features:** quiet background
- **Build notes:** **Sensors:** accelerometer/gyro tilt (expo-sensors). Calibrate "flat" at start. Calm, 30–45 s.
- **Designer note:** Needs the motion sensor, so the tilt is simulated here. A soft ring fills while the dot stays inside. No score, just a steady half-minute.


### Move first — `moveFirst`

- **Group:** Active (`active`) · **Batch:** B5 · **Effort:** M
- **Chip / length:** ACTIVITY · ABOUT 1 MIN · round timer 30 s
- **Colours:** accent `#FF7A1F` · **Background:** `persp` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:16329` · Playing `130:16373` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Stand up. Do 10 squats with your phone in hand. Your phone counts the reps.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Moved first', line: 'Ten squats before the scroll.', stats: ['10 reps', 'About 40 sec'] };
  ```
- **Best tracked:** —
- **Engine features:** basic
- **Build notes:** **Sensors:** squat detection from vertical acceleration peaks with the phone in hand; calibration rep; 10 reps. Fallback: manual tap counter if no sensor.
- **Designer note:** Uses the motion sensor to count reps, so it's simulated here. Big count in a progress ring, a simple figure moving in time, nothing else on screen.


### Phone away — `phoneAway`

- **Group:** Active (`active`) · **Batch:** B5 · **Effort:** M
- **Chip / length:** ACTIVITY · 25 MIN · round timer 25 s
- **Colours:** accent `#7A7B88`, glow `#4A5BFF` · **Background:** `persp` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:16265` · Playing `130:16301` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Pick how long, 25 minutes here. Put your phone face down. Pick it up early and the timer pauses.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: '25 minutes away', line: 'Your phone stayed face down. One pick-up, and you put it back.', stats: ['25 min', '1 pick-up'] };
  ```
- **Best tracked:** —
- **Engine features:** quiet background
- **Build notes:** **Sensors:** face-down detection (gravity z); 25 min default (choose 15/25/45). Picking up pauses. Must keep running with the screen off → needs a foreground service (`FOREGROUND_SERVICE_HEALTH` or `_SPECIAL_USE` type, Play declaration) **or** a simpler rule: count only while Untangle stays open with the screen on. Decide before B5.
- **Designer note:** Needs the motion sensor to know the phone is face down, so it's simulated here and sped up. On iPhone the app has to stay open with the screen dimmed, which is worth testing early.


### Read aloud — `readAloud`

- **Group:** Words (`words`) · **Batch:** B5 · **Effort:** M
- **Chip / length:** WORDS · ABOUT 1 MIN · round timer 60 s
- **Colours:** accent `#8B3DFF` · **Background:** `dots`
- **Figma:** Intro `130:15701` · Playing `130:15773` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Tap the mic. Read the line out loud at your pace. Words light up as you say them.
- **Round loop (prototype):** continues while `live && P.alive(t`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Clear and steady', stars: 3, stats: [`${words} words`, 'About 130 wpm', '+60 XP'] };
  ```
- **Best tracked:** —
- **Engine features:** float text, speech
- **Build notes:** **Voice:** Android `SpeechRecognizer` (offline only if the device has an offline language pack; otherwise needs network — breaks the offline rule). Mic permission with its own disclosure. Words light up as recognised. Highest risk game.
- **Designer note:** Needs the microphone and on-device speech recognition, so here the voice is simulated. The mic is a big Toy button that rings while it listens.



## Acceptance

- [ ] Every sub-batch committed, PROGRESS.md updated.
- [ ] Every game: logic tests, plays start → result on the emulator, best saved, incomplete saved on quit.
- [ ] Games tab and training show the new games; nothing from earlier batches regressed (`npm run check`).
- [ ] List what still needs a real phone (60 fps, audio latency, sensors).
