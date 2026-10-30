# BATCH 3.2 — Daily core (14 games) + housekeeping

**Goal:** Short, highly replayable attention, memory, flexibility and quick-maths rounds that fill every focus group for the daily training rotation. Cheap to build: simple boards that reuse 3.1 parts. Starts with housekeeping that must happen before the library grows.

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
| 3.2.0 | Housekeeping (do first, stop and report) | — |
| 3.2a | Attention | Swap it, Flash count, Spot the odd one, Track the stars |
| 3.2b | Memory | Pattern recall, Number span |
| 3.2c | Flexibility & self-control | Stop on the beep, Opposite day, Rule flip, Sort the stream |
| 3.2d | Numbers & timing | Quick maths, Bigger total, Time it right, Orbit switch |
| 3.2e | Wiring | — |

### 3.2.0 · Housekeeping (do first, stop and report)

1. **Git — nothing has ever been committed.** `git config user.name` / `user.email` are empty on
   this machine, so every commit failed silently. Ask the owner for name + email, set them
   (`git config user.name "…"`, `git config user.email "…"`), then commit the current work in
   meaningful chunks (at least: batch 1, batch 2, batch 3.1) and create the `legacy`/`v1`
   branches described in Batch 1 §1.0 if the legacy scaffold can still be recovered (it can't
   if files were already deleted — then just start history here). Verify with `git log`.
2. **One folder per game.** Move the 12 existing games out of `list/ArcadeRounds.tsx`,
   `FocusRounds.tsx`, `CalmRounds.tsx` and the shared `list/logic.ts` into
   `src/features/games/games/<gameId>/` (index, Round, logic, tests). Move shared drawing
   helpers from `list/kit.tsx` to `src/features/games/kit/`. `registry.ts` imports each game
   lazily. Behaviour must not change: all 239+ tests still pass, and play Colour word, Stack
   tower and Block fit once on the emulator.
3. **Sound service.** Add `src/lib/sound.ts` (expo-audio, preloaded, respects Settings › Sound and
   the phone's silent mode). Generate a small set of `.wav`/`.ogg` files with a script
   (`tools/sounds/generate.mjs`, simple synthesized tones — no downloaded assets): `tap`, `good`,
   `bad`, `go`, `tick`, `chime`, `beep`, `tone-low/mid/high`. Wire `api.sound(id)` into the engine
   and add sounds to the 12 existing games (tap/good/bad/go; chime for calm games).
4. Update `docs/plan/PROGRESS.md`.

Commit: `batch-3.2.0: housekeeping (do first, stop and report)`

### 3.2a · Attention

Games: Swap it, Flash count, Spot the odd one, Track the stars.

Commit: `batch-3.2a: attention`

### 3.2b · Memory

Games: Pattern recall, Number span.

Commit: `batch-3.2b: memory`

### 3.2c · Flexibility & self-control

Games: Stop on the beep, Opposite day, Rule flip, Sort the stream.

Stop on the beep uses the `beep` sound from 3.2.0.

Commit: `batch-3.2c: flexibility & self-control`

### 3.2d · Numbers & timing

Games: Quick maths, Bigger total, Time it right, Orbit switch.

Commit: `batch-3.2d: numbers & timing`

### 3.2e · Wiring

Catalog/Games tab: the 14 new games appear with the **New** tag for 14 days; training rotation includes them (3 different groups a day, first game ≤ 45 s and not Calm); pause screen's quick-game pool includes every game ≤ 45 s that isn't Calm/Active.

Commit: `batch-3.2e: wiring`

## Screens

Screenshots in `design/screens/games/`.

| Game | id | Intro / Playing screenshot | Figma intro / playing |
|---|---|---|---|
| Swap it | `swapIt` | `swapIt--intro.png` / `swapIt--playing.png` | `126:11452` / `126:11506` |
| Flash count | `flashCount` | `flashCount--intro.png` / `flashCount--playing.png` | `126:11568` / `126:11608` |
| Spot the odd one | `spotTheOddOne` | `spotTheOddOne--intro.png` / `spotTheOddOne--playing.png` | `125:11098` / `125:11176` |
| Track the stars | `trackTheStars` | `trackTheStars--intro.png` / `trackTheStars--playing.png` | `125:10462` / `125:10517` |
| Pattern recall | `patternRecall` | `patternRecall--intro.png` / `patternRecall--playing.png` | `125:9830` / `125:9869` |
| Number span | `numberSpan` | `numberSpan--intro.png` / `numberSpan--playing.png` | `125:10143` / `125:10209` |
| Stop on the beep | `stopOnTheBeep` | `stopOnTheBeep--intro.png` / `stopOnTheBeep--playing.png` | `127:12183` / `127:12221` |
| Opposite day | `oppositeDay` | `oppositeDay--intro.png` / `oppositeDay--playing.png` | `126:11346` / `126:11395` |
| Rule flip | `ruleFlip` | `ruleFlip--intro.png` / `ruleFlip--playing.png` | `126:11673` / `126:11716` |
| Sort the stream | `sortTheStream` | `sortTheStream--intro.png` / `sortTheStream--playing.png` | `125:10801` / `125:10838` |
| Quick maths | `quickMaths` | `quickMaths--intro.png` / `quickMaths--playing.png` | `127:12936` / `127:12981` |
| Bigger total | `biggerTotal` | `biggerTotal--intro.png` / `biggerTotal--playing.png` | `127:12823` / `127:12875` |
| Time it right | `timeItRight` | `timeItRight--intro.png` / `timeItRight--playing.png` | `127:12354` / `127:12428` |
| Orbit switch | `orbitSwitch` | `orbitSwitch--intro.png` / `orbitSwitch--playing.png` | `126:11976` / `126:12028` |

---

# Game specs

Format: id · group · batch · length · colours · background · Figma · how to play (intro copy) · round loop · result (from the prototype) · best tracked · engine features · build notes · designer note.

### Swap it — `swapIt`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** FOCUS · 40 SEC · round timer 40 s
- **Colours:** accent `#5B4BC4`, glow `#4A5BFF` · **Background:** `persp`
- **Figma:** Intro `126:11452` · Playing `126:11506` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** See which card hides the star. Follow it while the cards swap. Tap where it ended up.
- **Round loop (prototype):** continues while `!T.done && r < 5`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Locked on', stars: miss ? 2 : 3, stats: [`${found} of ${r} found`, `${miss} miss${miss === 1 ? '' : 'es'}`, '+80 XP'] };
  ```
- **Best tracked:** found (higher)
- **Engine features:** combo pill, hit FX, oops FX, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** Shell game, 3–5 cups, speed ramps.
- **Designer note:** Enamel card shells glide on a recessed track; one lifts and one dips on every swap so the path is easy to follow. Swaps speed up each round.


### Flash count — `flashCount`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** FOCUS · 40 SEC · round timer 40 s
- **Colours:** accent `#FFC53D` · **Background:** `dots`
- **Figma:** Intro `126:11568` · Playing `126:11608` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Dots flash for a moment. Count them without blinking. Tap how many you saw.
- **Round loop (prototype):** continues while `!T.done && n < 8`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Quick eyes', stars: right >= 7 ? 3 : 2, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+80 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX, quiet background
- **Build notes:** Dots flash 300–600 ms; non-overlapping placement generator.
- **Designer note:** Candy beads flash inside a recessed well, then come back faint so you can check your count. Answer keys are Toy plastic.


### Spot the odd one — `spotTheOddOne`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** ATTENTION · 30 SEC · round timer 30 s
- **Colours:** accent `#FFC53D` · **Background:** `dots`
- **Figma:** Intro `125:11098` · Playing `125:11176` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Sixteen tiles appear. One is a shade off or flipped. Tap the odd one out.
- **Round loop (prototype):** continues while `!T.done && r < 8`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good eye', stars: found >= 7 ? 3 : 2, stats: [`${found} found`, '1 miss', '+80 XP'] };
  ```
- **Best tracked:** found (higher)
- **Engine features:** hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** 4×4 tiles; odd = shade (ΔE ramps down) or flipped shape.
- **Designer note:** Tiles are pieces you tap, so Enamel (switch to Candy gloss below). It gets subtler each round. Everything else dims when you find it.


### Track the stars — `trackTheStars`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** M
- **Chip / length:** FOCUS · 45 SEC · round timer 45 s
- **Colours:** accent `#22A6FF`, glow `#4A5BFF` · **Background:** `dots`
- **Figma:** Intro `125:10462` · Playing `125:10517` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** A few beads glow for a moment. Then they all look the same and drift. When they stop, tap the ones you followed.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Locked on', stars: missT ? 2 : 3, stats: [`${picked} tracked`, `${missT} lost`, '+80 XP'] };
  ```
- **Best tracked:** tracked (higher)
- **Engine features:** combo pill, hit FX, oops FX, quiet background
- **Build notes:** Multiple-object tracking; beads drift with collision avoidance.
- **Designer note:** Glass beads in a recessed field. The background goes quiet while you track. The classic multiple-object tracking task, made calm and pretty.


### Pattern recall — `patternRecall`

- **Group:** Memory (`memory`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** MEMORY · 32 SEC · round timer 32 s
- **Colours:** accent `#8B3DFF` · **Background:** `grid`
- **Figma:** Intro `125:9830` · Playing `125:9869` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Watch the pads light up. Wait for your turn. Tap them in the same order.
- **Round loop (prototype):** continues while `!T.done && round <= 5 && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: round > 5 ? 'Level complete' : 'Nice run', stars: round > 5 ? 3 : 2, stats: [`${Math.min(5, round - (round > 5 ? 1 : 0))} rounds`, `${lv} of 3 lives`, '+120 XP'] };
  ```
- **Best tracked:** rounds (higher)
- **Engine features:** lives, hit FX, oops FX, toast, quiet background
- **Build notes:** Grid flashes a pattern; 3 lives; rounds grow.
- **Designer note:** Toy plastic pads, since they are buttons you press. The background goes quiet while the pattern plays. Lives instead of combo, since one wrong pad ends the round.


### Number span — `numberSpan`

- **Group:** Memory (`memory`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** WORKING MEMORY · 45 SEC · round timer 45 s
- **Colours:** accent `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `125:10143` · Playing `125:10209` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Digits flash one at a time. Hold them in your head. Type them back in order.
- **Round loop (prototype):** continues while `!T.done && len <= 6 && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Great span', stars: len > 6 ? 3 : 2, stats: [`Longest ${Math.min(6, len - 1)} digits`, `${lv} of 3 lives`, '+90 XP'] };
  ```
- **Best tracked:** longest span (higher)
- **Engine features:** lives, hit FX, oops FX, toast, quiet background
- **Build notes:** Digits one at a time; on-screen number pad.
- **Designer note:** Toy plastic keypad, since keys are buttons. Digits drop into recessed wells, which turn mint or red as you type.


### Stop on the beep — `stopOnTheBeep`

- **Group:** Self-control (`selfControl`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** SELF-CONTROL · 40 SEC · round timer 40 s
- **Colours:** accent `#17D9A3`, glow `#22A6FF` · **Background:** `grid`
- **Figma:** Intro `127:12183` · Playing `127:12221` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** An arrow appears: tap that way fast. If the screen flashes red, freeze. Holding still on a flash scores too.
- **Round loop (prototype):** continues while `!T.done && n < 16`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good brakes', stars: slip ? 2 : 3, stats: [`${right} fast taps`, `${held} of ${held + slip} stops held`, '+80 XP'] };
  ```
- **Best tracked:** fast taps (higher)
- **Engine features:** combo pill, hit FX, oops FX
- **Build notes:** Stop-signal task; red flash = hold. Uses a short beep sound.
- **Designer note:** Two big Toy plastic buttons. Most rounds are a race, but a red flash (and a beep, with sound on) means stop. The point is the brake, not the speed.


### Opposite day — `oppositeDay`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** FLEXIBILITY · 40 SEC · round timer 40 s
- **Colours:** accent `#8B3DFF` · **Background:** `dots`
- **Figma:** Intro `126:11346` · Playing `126:11395` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** An arrow appears on the token. Think of the opposite way. Tap that arrow on the pad.
- **Round loop (prototype):** continues while `!T.done && n < 14`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Flexible thinking', stars: right >= 13 ? 3 : 2, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+90 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Arrow → tap the opposite on a D-pad.
- **Designer note:** The token is an enamel piece (switch to Candy gloss below). The pad is Toy plastic, laid out like a D-pad, with a recessed well in the middle.


### Rule flip — `ruleFlip`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** FLEXIBILITY · 40 SEC · round timer 40 s
- **Colours:** accent `#FF3D8E` · **Background:** `dots`
- **Figma:** Intro `126:11673` · Playing `126:11716` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Read the rule at the top. Send each piece to its side. When the rule flips, follow the new one.
- **Round loop (prototype):** continues while `!T.done && n < 16`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Flexible thinking', stars: right >= 14 ? 3 : 2, stats: [`${right} of ${n} sorted`, '2 rule flips', '+100 XP'] };
  ```
- **Best tracked:** sorted (higher)
- **Engine features:** combo pill, hit FX, oops FX, toast, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** Sort by colour or shape; rule flips twice per round.
- **Designer note:** The piece is Enamel (Candy gloss below), the bins are recessed wells. When the rule flips, the badge turns white and flips over.


### Sort the stream — `sortTheStream`

- **Group:** Attention (`attention`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** FLEXIBILITY · 40 SEC · round timer 40 s
- **Colours:** accent `#17D9A3`, glow `#22A6FF` · **Background:** `dots`
- **Figma:** Intro `125:10801` · Playing `125:10838` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Cards stream in one after another. Swipe left or right by the rule. When the rule switches, switch with it.
- **Round loop (prototype):** continues while `!T.done && n < 20`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Switched on', stars: right >= 19 ? 3 : 2, stats: [`${right} of ${n} sorted`, '1 rule switch', '+80 XP'] };
  ```
- **Best tracked:** sorted (higher)
- **Engine features:** combo pill, oops FX, toast, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** Swipe left/right by rule; one rule switch mid-round.
- **Designer note:** Like Rule flip but faster and continuous: cards keep coming, and the rule banner flips from colour to shape mid-stream. Overlaps Rule flip, so keep only one in the app.


### Quick maths — `quickMaths`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** QUICK DECISIONS · 30 SEC · round timer 30 s
- **Colours:** accent `#FF7A1F` · **Background:** `grid`
- **Figma:** Intro `127:12936` · Playing `127:12981` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** A sum appears. Work it out before the ring closes. Tap the right answer.
- **Round loop (prototype):** continues while `!T.done && n < 10`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: right >= 8 ? 'Quick thinking' : 'Nice run', stars: right >= 9 ? 3 : right >= 6 ? 2 : 1, stats: [`${right} of ${n} right`, 'Best streak', '+100 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX
- **Build notes:** Sums with 4 options before the ring closes.
- **Designer note:** Answers are Toy plastic buttons. Two timers: the game timer at the top and a small ring per question, so quick calls feel quick.


### Bigger total — `biggerTotal`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** QUICK DECISIONS · 40 SEC · round timer 40 s
- **Colours:** accent `#FF7A1F`, glow `#FFC53D` · **Background:** `grid`
- **Figma:** Intro `127:12823` · Playing `127:12875` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Two stacks of number tiles. Add each stack in your head. Tap the bigger one before the bar runs out.
- **Round loop (prototype):** continues while `!T.done && n < 12`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Quick adder', stars: right >= 11 ? 3 : 2, stats: [`${right} of ${n}`, 'Mental maths', '+80 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Two stacks of number tiles; tap the bigger sum.
- **Designer note:** Raised number tiles (Enamel / Candy below) in two recessed bins. The totals flip up after you pick, so you can check your maths.


### Time it right — `timeItRight`

- **Group:** Self-control (`selfControl`) · **Batch:** B2 · **Effort:** S
- **Chip / length:** TIMING · 5 TRIES · round timer 45 s
- **Colours:** accent `#FF7A1F` · **Background:** `persp`
- **Figma:** Intro `127:12354` · Playing `127:12428` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** The hand starts sweeping. At 2 seconds it hides. Tap when you feel 5 seconds.
- **Round loop (prototype):** continues while `!T.done && k < 5`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Inner clock', stars: best < .1 ? 3 : 2, stats: [`Closest ±${best.toFixed(2)} s`, `${k} tries`, '+70 XP'] };
  ```
- **Best tracked:** closest error (lower)
- **Engine features:** hit FX, toast, quiet background
- **Build notes:** Estimate 5 s with the hand hidden after 2 s; 5 tries.
- **Designer note:** A quiet dial in a recessed face. After the tap, two markers meet on the line: white is 5.00 s, orange is you. One big Toy button, nothing else to press.


### Orbit switch — `orbitSwitch`

- **Group:** Self-control (`selfControl`) · **Batch:** B2 · **Effort:** M
- **Chip / length:** TIMING · 30 SEC · round timer 30 s
- **Colours:** accent `#22A6FF`, glow `#8B3DFF` · **Background:** `dots`
- **Figma:** Intro `126:11976` · Playing `126:12028` · **Prototype:** `design/prototype/games/_g2b3.js`
- **How to play (intro copy):** The marble races round its ring. Tap to hop between inner and outer ring. Dodge the red, collect the sparks.
- **Round loop (prototype):** continues while `!T.done && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'In orbit', stars: bumps === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${laps} laps`, `${sparks} sparks · ${bumps} bump${bumps === 1 ? '' : 's'}`, '+80 XP'] };
  ```
- **Best tracked:** laps (higher)
- **Engine features:** lives, oops FX, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Marble on two rings; tap to switch; obstacles & sparks.
- **Designer note:** A Candy marble on two recessed rings (switch to Enamel below). Red arcs block one ring at a time, so there is always a way through. Each lap adds a new block and speeds up a little.




## Acceptance

- [ ] Every sub-batch committed, PROGRESS.md updated.
- [ ] Every game: logic tests, plays start → result on the emulator, best saved, incomplete saved on quit.
- [ ] Games tab and training show the new games; nothing from earlier batches regressed (`npm run check`).
- [ ] List what still needs a real phone (60 fps, audio latency, sensors).
