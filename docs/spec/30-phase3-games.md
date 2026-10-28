# 30 · Phase 3 — Games

59 games, one shared engine. Figma: sections *Games · Memory* `125:9503`, *Attention*
`125:10361`, *Self-control* `126:11764`, *Quick decisions* `127:12506`, *Logic & spatial*
`128:13153`, *Words* `129:14691`, *Calm* `130:15852`, *Active* `130:16263` (Intro + Playing frame
per game), and **Games · Reference flow** `131:16493` (every engine state, using Colour word).
Behaviour reference: `design/prototype/untangle-games-prototype.html` and the per-game source
files in `design/prototype/games/` (`_g2.js` engine, `_g2games.js`, `_g2b1.js`…`_g2b4.js`,
`_g2live.js`). **The prototype source is the rule book**: when this doc and a frame disagree on
game logic, port the prototype's logic.

Claims policy: games are described as practice and play. Never "improves attention", "fixes
your focus", "clinically proven" in UI copy or store text.

---

## 1. Build order: 5 batches

Ordered by **fun × impact** (impact = how well the game does the app's job: replacing the
scroll urge with something absorbing, and practising focus, self-control and calm).
Batch 1 also builds the whole engine, so it deliberately covers every engine feature
(timer, combo, lives, hit/oops FX, calm result, sensors excluded).

| Batch | Theme | Games | Why first / why here |
|---|---|---|---|
| **B1 · Hero set** (12) | The most fun + the core focus classics + calm/silence | Stack tower, Rocket hop, Lane dash, Block fit, Colour word, Middle arrow, Don't tap red, Echo, Card pairs, Breath count, Silence, Urge surfing | Instantly fun one-tap arcade games for the pause screen; the classic attention/inhibition/memory tasks (colour-word, flanker, go/no-go, 2-back, pairs); and the three calm ones the user asked for (breathing, sitting in silence, riding the urge). Enough variety for 3 different training games a day for weeks. |
| **B2 · Daily core** (14) | Short attention, memory, flexibility and quick-maths rounds | Swap it, Flash count, Spot the odd one, Pattern recall, Number span, Track the stars, Stop on the beep, Opposite day, Rule flip, Sort the stream, Quick maths, Bigger total, Time it right, Orbit switch | Cheap to build (simple boards, reuse B1 parts), high replay value, fills every focus group for the training rotation. |
| **B3 · Puzzles & words** (14) | Calmer, longer, satisfying puzzles and word games | Flow lines, Slide escape, Path painter, One-line art, Laser lab, Merge garden, Mini nonogram, Bridge builder, Category clusters, Word trails, Letter forge, Mini crossword, Word bridge, Letter guess | Very sticky but need **content pipelines** (word lists, puzzle generators/validators, crossword and category packs). Bigger effort per game. |
| **B4 · Variety** (15) | Niche mechanics and extra flavour | What changed?, Make the target, Micro defender, Rhythm relay, Odd sound out, Shadow match, Spin it, Balance lab, Shop sprint, Path memory, Letter orbit, Paragraph recall, Pocket terrarium, Sky glider, Tiny dash | Fun but overlaps B1–B3 mechanics, or needs audio/3D-ish rendering/extra art (terrarium). |
| **B5 · Device features** (4) | Sensors and voice | Hold the line (tilt), Move first (squats via motion), Phone away (face-down 25 min), Read aloud (speech) | Need sensors/microphone, device-specific calibration and extra permissions (mic). Highest risk, lowest share of daily play. |

Effort key used per game below: **S** ≈ 1–2 days, **M** ≈ 3–4 days, **L** ≈ 5+ days (one
developer, after the engine exists). Engine + Stack tower ≈ 2 weeks.

| Batch | Rough effort (dev-days, one developer) |
|---|---|
| Engine + Stack tower | ~10 |
| B1 (remaining 11) | ~24 |
| B2 | ~25 |
| B3 (+ content pipeline ~8) | ~57 |
| B4 | ~39 |
| B5 | ~14 + device testing |

That is roughly 34 working weeks for all 59 by one person. B1 alone (≈ 7 weeks incl. the
engine) is a shippable game library.

---

## 2. The engine (`src/features/games/engine`)

### 2.1 Game module contract

```ts
export interface GameDefinition {
  id: GameId;                       // camelCase, stable (e.g. 'colourWord')
  name: string;                     // 'Colour word'
  group: FocusGroup;                // 'attention' …
  kicker: string;                   // 'Attention · 40 sec' (chip text)
  durationLabel: string;            // '40 sec', '2–5 min', 'No timer'
  color: string;                    // game accent (token from color.game.*)
  glow: string;                     // background glow colour
  background: 'grid' | 'dots' | 'persp';
  calm?: boolean;                   // calm result screen, no countdown, no timer pressure
  howTo: [string, string, string];  // joined with '. ' on the intro
  Round: React.FC<RoundProps>;      // the playable board
  Demo?: React.FC<DemoProps>;       // optional custom intro demo; default = Round in demo mode
}

interface RoundProps {
  api: GameApi;            // engine services below
  demo: boolean;           // intro autoplay: no timer, scripted taps with the finger
  seed: number;            // deterministic RNG seed
}

interface GameApi {
  timer(totalSec: number): Timer;              // drives HUD ring/bar, warn/low states, pauses with game
  wait(ms: number): Promise<void>;             // pause-aware, abort-aware
  setRound(label: string): void;               // '3 OF 14', 'BOARD 1 OF 3'
  hint(text: string, tone?: 'good' | 'bad'): void;
  addScore(n: number): void;                   // score rolls up in the HUD
  combo(label?: string): (n: number) => void;  // streak pill, 'hot' at ≥3, pop animation
  lives(n?: number): { lose(): void; left: number };
  fx: { ring(x, y, color, size?); burst(x, y, color, n?); float(x, y, text, color?); oops(); toast(text, color?) };
  quiet(on: boolean): void;                    // dims background during memorise phases
  haptic(kind: 'tap' | 'good' | 'bad' | 'go'): void;
  sound(id: SoundId): void;
  finish(result: RoundResult): void;           // ends the round → result screen
}

interface RoundResult {
  title: string;           // 'Sharp focus'
  stars: 0 | 1 | 2 | 3;    // calm games: omit stars
  score?: number;
  stats: string[];         // chips under the score, max 3
  line?: string;           // calm games: one sentence
  best?: { value: number; label: string };   // what "New best" compares (higher or lower is better per game)
}
```

`registry.ts` lazy-loads each game folder so the JS bundle per screen stays small.

### 2.2 Intro — `119:5431`, reference `131:18263`

Full-bleed **live demo** in the top half (the real Round with `demo: true` at 0.84 scale, a
finger sprite showing taps, looping), then chips (focus group chip in the group colour +
duration chip), game name (`type.titleLg`), one sentence (`howTo` joined), **Start** (white
button; calm games: **Begin**). ✕ top-left. "Your best" is **not** shown (design decision).
From the pause screen the header reads "You opened Instagram. Play this instead?".

### 2.3 Countdown — reference `131:18299`…`131:18410`

Dim overlay; digits **3, 2, 1, Go** each 620 ms (`motion.easing.pop`: scale 1.8 → 1 → 0.92 →
0.8, opacity 0 → 1 → 1 → 0) with a 20 ms gap; a white ring pulse (170 px) on each digit; on
**Go** a ring in the game colour (260 px) plus a 16-particle burst; haptic `go` on Go. Calm
games skip the countdown and show the settle line (e.g. "Get comfortable") for 1.2 s. Resume
after pause uses a short **3, 2, 1** (no Go).

### 2.4 HUD — reference `131:18463`

Top row: ✕ (pause) · title + round label ("1 OF 14") · **timer ring** (52 px, 4 px stroke,
track `white 12%`, progress white; number inside). Under it a thin **time bar**. Then **score**
(rolls up 20% of the gap per frame) + "pts", and the right slot (**combo pill** "Streak {n}",
turns hot ≥3 and pops on change; or **lives** hearts). Bottom: **hint line** with a coloured dot
(neutral / good green / bad red).

Timer states: normal (white); **warning** when ≤40% left and >5 s (ring, number and bar amber
`signal.warning`) — `131:18717`; **last 5 s** (red ring/bar, number ticks with a small scale
pulse each second, red inner vignette pulsing 1 s) — `131:18763`; **time up** red toast "Time!"
— `132:18809`. Calm games hide the timer ring.

### 2.5 FX layer (Skia, UI thread)

| FX | Spec |
|---|---|
| `ring` | circle stroke 3 → 1 px, scale 0.5 → 1.9, opacity 1 → 0, 480 ms, `easing.standard` |
| `burst` | n (default 9) particles 4–8 px, round or 2 px squares, 25% white, others game colour with glow, fly 30–58 px at even angles ±0.3 rad, 380–560 ms |
| `float` | text 18/700, rises from −50% to −230% with a 1.1 overshoot at 25%, 800 ms |
| `hit(el, color, pts)` | ring at the element + burst + float "+pts" — `131:18555` |
| `oops` | whole board shakes ±6 px, 220 ms; haptic `bad` — `131:18671` |
| `toast` | centred text, pop in/out 900 ms |
| press | pressed key scales 0.96 and darkens for 120 ms |

Reduce motion: no particles, rings become fades, shake becomes a red flash.

### 2.6 Background

Skia canvas per game screen. Types `grid` (lines), `dots`, `persp` (perspective grid). Base
`#020204`, line alpha 0.026, glow alpha 0.07 (glow colour = game `glow`), 2 slow pulses, pulse
alpha 0.26, segment highlight 0.12. Very subtle by design — check on a real OLED screen.
`quiet(true)` fades lines to 40% during memorise phases. Rendering pauses when the game is
paused or the app is in background. Reference: `131:18263` (bg visible behind every frame of the
reference flow).

### 2.7 Pause — `132:18951`, `132:19058`

✕ or leaving the app pauses: everything freezes (timer, waits, animations). Sheet: "Paused" ·
"Leave now and this round won't count. Your streak is safe." (left the app: "You left the app,
so we paused. The timer stopped with you."; calm: "Take your time. Nothing is lost.") ·
**Resume** (3-2-1 then continue) · **Restart** · **Quit** (red). System Back = pause; Back on the
sheet = Resume.

### 2.8 Result — `132:18852` (calm: `119:5507`)

Rays rotating slowly in the game colour (22% mix), kicker = game name uppercase, title
(`RoundResult.title`), **stars** landing one by one (0.25 s, 0.5 s, 0.75 s; middle star larger),
**score** rolling up, "New best" tag when beaten, stats chips. Buttons **Done for now** (white)
and **Another round** (text). Calm variant: white check in a circle, one line, **Done for now** /
**Again**. From the pause screen: Done → "Back to my day" + unlock button (20 §8).

The prototype's "+80 XP" chip is **not** shown in v1 (no XP system); use the third chip for a
game-specific stat or omit it.

### 2.9 Persistence, haptics, sound

- On finish: insert `game_results`; update `game_bests` if better (direction per game: e.g.
  Time it right lower is better).
- Quit or app killed mid-round: result saved with `completed = false` (does not count for
  training or streak).
- Haptics: `tap` (selection) on every input, `good` (light impact) on correct, `bad` (error
  notification) on wrong, `go` (medium) on Go and result. Respect the Settings toggle.
- Sounds: short `.ogg`, preloaded per game; muted when Settings › Sound is off or the phone is
  in silent/vibrate mode (Calm games: soft chime only).

### 2.10 Randomness and fairness

All generators take the round `seed` (mulberry32 in `lib/rng.ts`). Every generator has a unit
test that runs 1,000 seeds and asserts the board is solvable and within the difficulty band
(e.g. Flow lines has a unique solution, Make the target is reachable, Mini nonogram is line-
solvable, Slide escape solvable within N moves).

### 2.11 Performance and accessibility

- 60 fps on a mid-range phone (e.g. Galaxy A15): game loops run in Reanimated worklets / Skia,
  not React state per frame.
- Minimum 44 dp touch targets; boards scale with screen width (design at 300–412 wide).
- Colour-only games (Colour word, Flow lines, Card pairs colours) must also work for colour-
  blind users: each game colour has a matching pattern/shape option (Settings toggle "Colour
  patterns", v1.1 if time is short — flagged).
- TalkBack: intro, result and pause are fully labelled; timed boards announce "Game in progress,
  TalkBack gestures may be too slow" and Calm games are fully accessible.

---

## 3. Game specs

Each entry: id · focus group · batch · duration · colours · background · Figma frames ·
how to play (intro copy) · end condition · stars/result (ported from prototype) · engine features
used · content/platform needs · designer note · effort.

The prototype's result stats sometimes contain fixed demo text (e.g. `'1 miss'`, `'Soft landing'`, `'+80 XP'`) and some calm/active timers are shortened for demos; compute real values and use the lengths stated in **Build notes**.

### 3.0 Overview table

| # | Game | id | Group | Batch | Length | Effort |
|---|---|---|---|---|---|---|
| 1 | Stack tower | `stackTower` | Self-control | B1 | 40 sec | M |
| 2 | Rocket hop | `rocketHop` | Self-control | B1 | 40 sec | M |
| 3 | Lane dash | `laneDash` | Quick decisions | B1 | 30 sec | M |
| 4 | Block fit | `blockFit` | Logic & spatial | B1 | 45 sec | M |
| 5 | Colour word | `colourWord` | Attention | B1 | 40 sec | S |
| 6 | Middle arrow | `middleArrow` | Attention | B1 | 40 sec | S |
| 7 | Don't tap red | `dontTapRed` | Self-control | B1 | 30 sec | S |
| 8 | Echo | `echo` | Memory | B1 | 45 sec | S |
| 9 | Card pairs | `cardPairs` | Memory | B1 | 40 sec | S |
| 10 | Breath count | `breathCount` | Calm | B1 | 90 sec | S |
| 11 | Silence | `silence` | Calm | B1 | 2–5 min | S |
| 12 | Urge surfing | `urgeSurfing` | Calm | B1 | 60–90 sec | S |
| 13 | Swap it | `swapIt` | Attention | B2 | 40 sec | S |
| 14 | Flash count | `flashCount` | Attention | B2 | 40 sec | S |
| 15 | Spot the odd one | `spotTheOddOne` | Attention | B2 | 30 sec | S |
| 16 | Pattern recall | `patternRecall` | Memory | B2 | 32 sec | S |
| 17 | Number span | `numberSpan` | Memory | B2 | 45 sec | S |
| 18 | Track the stars | `trackTheStars` | Attention | B2 | 45 sec | M |
| 19 | Stop on the beep | `stopOnTheBeep` | Self-control | B2 | 40 sec | S |
| 20 | Opposite day | `oppositeDay` | Attention | B2 | 40 sec | S |
| 21 | Rule flip | `ruleFlip` | Attention | B2 | 40 sec | S |
| 22 | Sort the stream | `sortTheStream` | Attention | B2 | 40 sec | S |
| 23 | Quick maths | `quickMaths` | Quick decisions | B2 | 30 sec | S |
| 24 | Bigger total | `biggerTotal` | Quick decisions | B2 | 40 sec | S |
| 25 | Time it right | `timeItRight` | Self-control | B2 | 5 tries | S |
| 26 | Orbit switch | `orbitSwitch` | Self-control | B2 | 30 sec | M |
| 27 | Flow lines | `flowLines` | Logic & spatial | B3 | 60 sec | M |
| 28 | Slide escape | `slideEscape` | Logic & spatial | B3 | 60 sec | M |
| 29 | Path painter | `pathPainter` | Logic & spatial | B3 | 60 sec | M |
| 30 | One-line art | `oneLineArt` | Logic & spatial | B3 | 60 sec | M |
| 31 | Laser lab | `laserLab` | Logic & spatial | B3 | 60 sec | M |
| 32 | Merge garden | `mergeGarden` | Logic & spatial | B3 | 45 sec | M |
| 33 | Mini nonogram | `miniNonogram` | Logic & spatial | B3 | 90 sec | M |
| 34 | Bridge builder | `bridgeBuilder` | Logic & spatial | B3 | 60 sec | M |
| 35 | Category clusters | `categoryClusters` | Words | B3 | 60 sec | M |
| 36 | Word trails | `wordTrails` | Words | B3 | 60 sec | M |
| 37 | Letter forge | `letterForge` | Words | B3 | 60 sec | M |
| 38 | Mini crossword | `miniCrossword` | Words | B3 | 90 sec | M |
| 39 | Word bridge | `wordBridge` | Words | B3 | 60 sec | M |
| 40 | Letter guess | `letterGuess` | Words | B3 | 60 sec | M |
| 41 | What changed? | `whatChanged` | Attention | B4 | 45 sec | S |
| 42 | Make the target | `makeTheTarget` | Quick decisions | B4 | 45 sec | S |
| 43 | Micro defender | `microDefender` | Attention | B4 | 45 sec | M |
| 44 | Rhythm relay | `rhythmRelay` | Memory | B4 | 45 sec | M |
| 45 | Odd sound out | `oddSoundOut` | Attention | B4 | 40 sec | M |
| 46 | Shadow match | `shadowMatch` | Logic & spatial | B4 | 40 sec | S |
| 47 | Spin it | `spinIt` | Attention | B4 | 40 sec | S |
| 48 | Balance lab | `balanceLab` | Logic & spatial | B4 | 60 sec | S |
| 49 | Shop sprint | `shopSprint` | Quick decisions | B4 | 40 sec | S |
| 50 | Path memory | `pathMemory` | Memory | B4 | 45 sec | S |
| 51 | Letter orbit | `letterOrbit` | Words | B4 | 45 sec | M |
| 52 | Paragraph recall | `paragraphRecall` | Memory | B4 | about 1 min | M |
| 53 | Pocket terrarium | `pocketTerrarium` | Calm | B4 | no timer | L |
| 54 | Sky glider | `skyGlider` | Self-control | B4 | 40 sec | M |
| 55 | Tiny dash | `tinyDash` | Quick decisions | B4 | 30 sec | S |
| 56 | Hold the line | `holdTheLine` | Calm | B5 | 45 sec | M |
| 57 | Move first | `moveFirst` | Active | B5 | about 1 min | M |
| 58 | Phone away | `phoneAway` | Active | B5 | 25 min | M |
| 59 | Read aloud | `readAloud` | Words | B5 | about 1 min | M |


---

## Batch 1

### 1. Stack tower — `stackTower`

- **Group:** Self-control (`selfControl`) · **Batch:** B1 · **Effort:** M
- **Chip / length:** TIMING · 40 SEC · round timer 40 s
- **Colours:** accent `#FFC53D`, glow `#FF7A1F` · **Background:** `persp`
- **Figma:** Intro `126:11766` · Playing `126:11817` · **Prototype:** `design/prototype/games/_g2b1.js`
- **How to play (intro copy):** A slab slides back and forth. Tap to drop it on the tower. Whatever hangs over gets cut off.
- **Round loop (prototype):** continues while `!T.done && n < 14 && w > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Tall tower', stars: best >= 13 ? 3 : 2, stats: [`${best} floors`, `${Math.round(w)} px wide at the top`, '+90 XP'] };
  ```
- **Best tracked:** floors (higher)
- **Engine features:** combo pill, hit FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** Pure generator. Default game offered on the pause screen.
- **Designer note:** Slabs are Enamel pieces (Candy gloss below) on a recessed base. A perfect drop keeps the full width and builds a combo. Overhang breaks off and falls. The tower scrolls down as it grows.

### 2. Rocket hop — `rocketHop`

- **Group:** Self-control (`selfControl`) · **Batch:** B1 · **Effort:** M
- **Chip / length:** TIMING · 40 SEC · round timer 40 s
- **Colours:** accent `#22A6FF`, glow `#4A5BFF` · **Background:** `dots`
- **Figma:** Intro `126:11876` · Playing `126:11921` · **Prototype:** `design/prototype/games/_g2b1.js`
- **How to play (intro copy):** The next planet swings side to side. Wait until it lines up above you. Tap to launch and land on it.
- **Round loop (prototype):** continues while `!T.done && hops < 6 && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: hops ? 'Smooth landings' : 'Lift-off', stars: hops >= 6 && lv === 3 ? 3 : hops >= 3 ? 2 : 1, stats: [`${hops} hops`, `${lv} of 3 lives`, '+80 XP'] };
  ```
- **Best tracked:** hops (higher)
- **Engine features:** lives, hit FX, oops FX
- **Build notes:** Physics-free: planets swing on a sine path; landing window = overlap test.
- **Designer note:** A toy rocket on a candy planet. The next planet swings; launch too early or late and the rocket sails past and you lose a life. Each landing scrolls the world down to the next planet.

### 3. Lane dash — `laneDash`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B1 · **Effort:** M
- **Chip / length:** QUICK DECISIONS · 30 SEC · round timer 30 s
- **Colours:** accent `#FF3D8E`, glow `#8B3DFF` · **Background:** `persp`
- **Figma:** Intro `127:12625` · Playing `127:12674` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Red blocks and white gems come at you. Swipe left or right to switch lanes. It speeds up the longer you last.
- **Round loop (prototype):** continues while `!T.done`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Fast lanes', stars: hits === 0 ? 3 : hits < 3 ? 2 : 1, stats: [`${gems} gems`, `${hits} hit${hits === 1 ? '' : 's'}`, '+80 XP'] };
  ```
- **Best tracked:** gems (higher)
- **Engine features:** oops FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** Endless runner, speed ramps every 5 s; swipe gestures.
- **Designer note:** The neon sibling of Tiny dash: a glowing car on four lanes, swipe instead of buttons. Overlaps with Tiny dash, so pick one for the app.

### 4. Block fit — `blockFit`

- **Group:** Logic & spatial (`logic`) · **Batch:** B1 · **Effort:** M
- **Chip / length:** SPATIAL · 45 SEC · round timer 45 s
- **Colours:** accent `#22A6FF`, glow `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `128:13713` · Playing `128:13765` · **Prototype:** `design/prototype/games/_g2b2.js`
- **How to play (intro copy):** Pick a block from the tray. Drop it where it fits on the board. Fill a whole row or column to clear it.
- **Round loop (prototype):** continues while `k < R.noise`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Clean board', stars: miss ? 2 : 3, stats: [`${lines} lines`, `${miss} misfit`, '+90 XP'] };
  ```
- **Best tracked:** lines (higher)
- **Engine features:** combo pill, oops FX, toast, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Board 8×8, tray of 3; generator guarantees at least one placement each turn; drag-and-drop with snap.
- **Designer note:** Blocks are Enamel pieces (Candy gloss below) on a recessed 7×7 board. A block that won't fit snaps back. A full line sweeps away with a flash, and two at once is a combo. Capped to short rounds on purpose: block puzzles are the most "one more go" genre there is.

### 5. Colour word — `colourWord`

- **Group:** Attention (`attention`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** ATTENTION · 40 SEC · round timer 40 s
- **Colours:** accent `#22A6FF`, glow `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `126:11262` · Playing `126:11301` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Look at the ink, not the word. Find that colour below. Tap it before the next word.
- **Round loop (prototype):** continues while `!T.done && n < 14`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: right >= 12 ? 'Sharp focus' : 'Nice run', stars: right >= 13 ? 3 : right >= 9 ? 2 : 1, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+90 XP'] };
  ```
- **Best tracked:** right answers (higher)
- **Engine features:** combo pill, hit FX, oops FX
- **Build notes:** Reference flow for the whole engine (`131:16493`). Needs colour-blind pattern option (§2.11).
- **Designer note:** Toy plastic keys with no labels, so the only thing to read is the ink. A slip names both colours so you see what tripped you.

### 6. Middle arrow — `middleArrow`

- **Group:** Attention (`attention`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** FOCUS · 40 SEC · round timer 40 s
- **Colours:** accent `#22A6FF`, glow `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `125:10679` · Playing `125:10736` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Five arrows appear in a row. Only the middle one counts. Tap its direction, ignore the crowd.
- **Round loop (prototype):** continues while `!T.done && n < 16`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Steady focus', stars: right >= 15 ? 3 : 2, stats: [`${right} of ${n}`, `Avg ${Math.round(sum / Math.max(1, right))} ms`, '+80 XP'] };
  ```
- **Best tracked:** average ms (lower)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Records reaction time per answer (ms).
- **Designer note:** The classic attention task (the flanker test). Raised arrow tokens (Enamel / Candy below), the middle one slightly brighter. Toy plastic buttons. Shows your reaction time.

### 7. Don't tap red — `dontTapRed`

- **Group:** Self-control (`selfControl`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** SELF-CONTROL · 30 SEC · round timer 30 s
- **Colours:** accent `#22A6FF` · **Background:** `persp`
- **Figma:** Intro `127:12267` · Playing `127:12313` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Shapes pop up all over. Tap every one that isn't red. Let the red ones pass.
- **Round loop (prototype):** continues while `!T.done && alive`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Sharp hands', stars: slips ? 2 : 3, stats: [`${hits} hits`, `${slips} slip${slips === 1 ? '' : 's'}`, '+110 XP'] };
  ```
- **Best tracked:** hits (higher)
- **Engine features:** hit FX, oops FX, toast, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Shapes stream in; inhibition on red. Timer 30 s.
- **Designer note:** Shapes are pieces you tap, so Enamel (Candy gloss below). Combo climbs ×2 to ×4 and turns orange. Letting a red one pass earns a small "+2", so restraint is rewarded too.

### 8. Echo — `echo`

- **Group:** Memory (`memory`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** MEMORY · 45 SEC · round timer 45 s
- **Colours:** accent `#FF3D8E`, glow `#8B3DFF` · **Background:** `grid`
- **Figma:** Intro `125:9738` · Playing `125:9780` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Shapes slide past one at a time. Press Match if it's the same as two back. Otherwise just let it pass.
- **Round loop (prototype):** continues while `!T.done && n < 16`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Sharp memory', stars: right >= 14 ? 3 : 2, stats: [`${right} of ${n}`, '2-back', '+90 XP'] };
  ```
- **Best tracked:** right answers (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** 2-back; 16 items, ~30% matches.
- **Designer note:** A 2-back memory task on a recessed track: the last three shapes stay visible faintly, the one two back is outlined. It's the hardest game here, so it suits a "challenge" slot rather than a detour.

### 9. Card pairs — `cardPairs`

- **Group:** Memory (`memory`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** MEMORY · 40 SEC · round timer 40 s
- **Colours:** accent `#FF3D8E`, glow `#17D9A3` · **Background:** `dots`
- **Figma:** Intro `125:9930` · Playing `125:10033` · **Prototype:** `design/prototype/games/_g2live.js`
- **How to play (intro copy):** Memorise the cards. They flip face down. Find the pairs.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: found === 6 ? 'All pairs found' : 'Good memory', stars: found === 6 ? (moves <= 8 ? 3 : 2) : 1, stats: [`${moves} moves`, `${Math.round(40 - T.left())} s`, '+90 XP'] };
  ```
- **Best tracked:** moves (lower)
- **Engine features:** hit FX, oops FX, toast, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** 12 cards / 6 pairs; preview then flip down.
- **Designer note:** Cards are pieces you pick, so Enamel faces (switch to Candy gloss below). Cards flip in 3D, matches pop and glow, back-to-back pairs multiply the points.

### 10. Breath count — `breathCount`

- **Group:** Calm (`calm`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** CALM · 90 SEC · round timer 45 s
- **Colours:** accent `#4A5BFF` · **Background:** `dots` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:16003` · Playing `130:16045` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Breathe in as the pearl grows. Breathe out as it shrinks. Tap once on each out-breath, up to nine.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Nine breaths', line: 'Nothing to win. Just a slower minute and a half.', stats: ['9 breaths', '90 sec'] };
  ```
- **Best tracked:** —
- **Engine features:** quiet background
- **Build notes:** Calm. **Real length 90 s** (prototype timer shortened for demo). Pearl grows 4 s / shrinks 6 s; tap on each out-breath, up to nine; miscount → gentle "Start again from one".
- **Designer note:** Nothing to win and no score. One soft pearl, nine dots that fill. The prototype runs about twice as fast as the real thing.

### 11. Silence — `silence`

- **Group:** Calm (`calm`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** CALM · 2–5 MIN · round timer 20 s
- **Colours:** accent `#5B4BC4` · **Background:** `dots` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:16082` · Playing `130:16145` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Choose how long. Let it be quiet. Nothing to do. A soft chime when time is up.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Two quiet minutes', line: 'No feed, no sound. That counts.', stats: ['2 min', 'Calm'] };
  ```
- **Best tracked:** —
- **Engine features:** quiet background
- **Build notes:** Calm. **Choose 2, 3 or 5 min** before Begin (prototype shortened). Screen dims to near-black; soft chime at end (respects silent mode → haptic only). Touching the screen shows the remaining time for 3 s; leaving the app pauses.
- **Designer note:** Dark starlight and one slow ring. The only thing moving is the time. Sped up 6× here so you can see it end.

### 12. Urge surfing — `urgeSurfing`

- **Group:** Calm (`calm`) · **Batch:** B1 · **Effort:** S
- **Chip / length:** SELF-CONTROL · 60–90 SEC · round timer 22 s
- **Colours:** accent `#22A6FF` · **Background:** `dots` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:16202` · Playing `130:16242` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Notice the urge to open the app. Watch it rise and fall like a wave. Then choose what to do, on purpose.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'You rode it out', line: 'The urge rose and passed, and you chose what came next.', stats: ['Back to your day', '1 urge resisted'] };
  ```
- **Best tracked:** —
- **Engine features:** hit FX, quiet background
- **Build notes:** Calm. 60–90 s guided wave; ends with a choice: "Back to my day" / "Play a game". When started from the pause screen this is offered as "Ride the urge" instead of a breath.
- **Designer note:** Opens from the block screen. A light rides one slow wave while the urge meter rises and falls, then two choices, with "Back to my day" first.


---

## Batch 2

### 13. Swap it — `swapIt`

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

### 14. Flash count — `flashCount`

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

### 15. Spot the odd one — `spotTheOddOne`

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

### 16. Pattern recall — `patternRecall`

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

### 17. Number span — `numberSpan`

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

### 18. Track the stars — `trackTheStars`

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

### 19. Stop on the beep — `stopOnTheBeep`

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

### 20. Opposite day — `oppositeDay`

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

### 21. Rule flip — `ruleFlip`

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

### 22. Sort the stream — `sortTheStream`

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

### 23. Quick maths — `quickMaths`

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

### 24. Bigger total — `biggerTotal`

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

### 25. Time it right — `timeItRight`

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

### 26. Orbit switch — `orbitSwitch`

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


---

## Batch 3

### 27. Flow lines — `flowLines`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#17D9A3`, glow `#22A6FF` · **Background:** `dots`
- **Figma:** Intro `128:13847` · Playing `128:13933` · **Prototype:** `design/prototype/games/_g2b2.js`
- **How to play (intro copy):** Each colour has two jewels. Draw a tube to join each pair. No crossings, and fill every square.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'All connected', stars: redraw ? 2 : 3, stats: [`${boards} of 2 boards`, `${redraw} redraw`, '+90 XP'] };
  ```
- **Best tracked:** boards (higher)
- **Engine features:** combo pill, oops FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** **Content:** puzzle generator + uniqueness solver, or a bundled pack of 300 verified boards (5×5, 6×6). 2 boards per round.
- **Designer note:** Jewels are Candy pieces in a recessed 5×5 board (switch to Enamel below). Tubes follow the finger cell by cell. A finished board lights up like a circuit.

### 28. Slide escape — `slideEscape`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#17D9A3`, glow `#22A6FF` · **Background:** `grid`
- **Figma:** Intro `128:14363` · Playing `128:14405` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** The gem has to slide out of the right side. Blocks only move along their own direction. Clear a path, then slide the gem out.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Way out', stars: 2 + (esc === 2 ? 1 : 0), stats: [`${esc} of 2 boards`, `${mv} moves`, '+90 XP'] };
  ```
- **Best tracked:** moves (lower)
- **Engine features:** combo pill, oops FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** **Content:** Rush-hour style boards; bundled pack with solver-verified minimum moves.
- **Designer note:** Graphite blocks on recessed rails. The gem is a Candy piece. A block that can't move bumps and stays. When the path is clear, the gem slides out and springs off the board.

### 29. Path painter — `pathPainter`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#22A6FF`, glow `#17D9A3` · **Background:** `dots`
- **Figma:** Intro `128:14456` · Playing `129:14512` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Start anywhere and draw one path. Every square has to be painted once. Plan ahead so you don't get trapped.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Clean coat', stars: wipes ? 2 : 3, stats: [`${done} of 2 boards`, `${wipes} wipe`, '+90 XP'] };
  ```
- **Best tracked:** boards (higher)
- **Engine features:** combo pill, oops FX, toast
- **Build notes:** **Content:** Hamiltonian-path boards with holes; generator + solver.
- **Designer note:** Dark ceramic squares in a recessed board turn bright enamel as the paint passes over. Rocks can't be painted. Get trapped and the board wipes clean.

### 30. One-line art — `oneLineArt`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#FFC53D`, glow `#FF7A1F` · **Background:** `grid`
- **Figma:** Intro `128:14175` · Playing `128:14217` · **Prototype:** `design/prototype/games/_g2b3.js`
- **How to play (intro copy):** Trace the whole drawing in one go. Never lift your finger, never repeat a line. Tip: start where an odd number of lines meet.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Steady hand', stars: resets ? 2 : 3, stats: [`${drawn} of 2 drawings`, `${resets} reset`, '+90 XP'] };
  ```
- **Best tracked:** drawings (higher)
- **Engine features:** combo pill, oops FX, toast
- **Build notes:** **Content:** Eulerian drawings (vector pack, ~100); validate 0 or 2 odd vertices.
- **Designer note:** Lines light up gold as the finger passes. Get stuck and the drawing resets with the tip about where to start. The finished icon lights up and pops.

### 31. Laser lab — `laserLab`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#FF3D8E`, glow `#8B3DFF` · **Background:** `grid`
- **Figma:** Intro `128:13357` · Playing `128:13460` · **Prototype:** `design/prototype/games/_g2b1.js`
- **How to play (intro copy):** A beam fires from the emitter. Tap a mirror to turn it. Route the beam into the reactor.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Reactors lit', stars: extra ? 2 : 3, stats: [`${labs} of 3 labs`, `${taps} turns, ${extra} extra`, '+100 XP'] };
  ```
- **Best tracked:** extra turns (lower)
- **Engine features:** combo pill, toast, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Beam tracing on a grid; mirror rotations. Layering fixed in the prototype (bars above beam).
- **Designer note:** Mirrors are Enamel pieces you tap to turn (Candy gloss below), sitting in a recessed grid. The beam re-routes live after every tap, and the reactor ignites when it lands.

### 32. Merge garden — `mergeGarden`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 45 SEC · round timer 45 s
- **Colours:** accent `#17D9A3` · **Background:** `dots`
- **Figma:** Intro `128:13155` · Playing `128:13255` · **Prototype:** `design/prototype/games/_g2b1.js`
- **How to play (intro copy):** Drag a seed onto a matching seed. Two seeds make a sprout, two sprouts a flower. Grow three flowers in as few moves as you can.
- **Round loop (prototype):** continues while `!T.done && flowers < 3`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: flowers === 3 ? 'Garden grown' : 'Nearly there', stars: flowers === 3 ? (moves <= 10 ? 3 : 2) : 1, stats: [`${flowers} of 3 flowers`, `${moves} moves`, '+90 XP'] };
  ```
- **Best tracked:** moves (lower)
- **Engine features:** hit FX
- **Build notes:** Drag-merge on a 4×4 plot; seed spawn rules from prototype.
- **Designer note:** Clay seeds, sprouts and flowers in recessed soil wells. Each merge pops, a new seed drops in, and every finished flower flies up to the goal row.

### 33. Mini nonogram — `miniNonogram`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** LOGIC · 90 SEC · round timer 90 s
- **Colours:** accent `#FF3D8E`, glow `#8B3DFF` · **Background:** `grid`
- **Figma:** Intro `128:14036` · Playing `128:14101` · **Prototype:** `design/prototype/games/_g2b2.js`
- **How to play (intro copy):** Numbers say how many squares in a row are filled. Tap squares to fill them, start with the sure ones. Solve it and the picture appears.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Picture solved', stars: mist ? 2 : 3, stats: ['1 picture', `${mist} mistake`, '+100 XP'] };
  ```
- **Best tracked:** mistakes (lower)
- **Engine features:** lives, oops FX, toast
- **Build notes:** **Content:** 5×5 line-solvable pictures (pack of 150, solver-checked). 90 s.
- **Designer note:** Paint-by-number logic on a recessed 5×5 board. Clues turn green when their line is done. A wrong square shows a red ✕ and costs a life. The solved picture lifts off the board.

### 34. Bridge builder — `bridgeBuilder`

- **Group:** Logic & spatial (`logic`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** PLANNING · 60 SEC · round timer 60 s
- **Colours:** accent `#FF7A1F`, glow `#FFC53D` · **Background:** `persp`
- **Figma:** Intro `128:13564` · Playing `128:13638` · **Prototype:** `design/prototype/games/_g2b1.js`
- **How to play (intro copy):** Look at each gap between the posts. Drag a beam that fits it exactly. Fill every gap, then watch Pip cross.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Safe crossing', stars: misfit ? 2 : 3, stats: [`${built} of 3 bridges`, `${misfit} misfit`, '+100 XP'] };
  ```
- **Best tracked:** misfits (lower)
- **Engine features:** combo pill, hit FX, oops FX, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Drag beams to gaps; Pip (bird) crosses at the end — uses the mascot sprite once the mascot is chosen.
- **Designer note:** Beams are Enamel pieces (Candy gloss below) in a tray. A beam that doesn't fit shakes back. When every gap is filled, a little creature walks across, the bridge dips under it, and it waves from the far side.

### 35. Category clusters — `categoryClusters`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 60 SEC · round timer 60 s
- **Colours:** accent `#FF3D8E`, glow `#8B3DFF` · **Background:** `dots`
- **Figma:** Intro `129:14880` · Playing `129:14952` · **Prototype:** `design/prototype/games/_g2b3.js`
- **How to play (intro copy):** Twelve words, three hidden groups of four. Tap four that belong together. Watch for words that fit two groups.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Sharp sorting', stars: slips ? 2 : 3, stats: [`${solved} of 3 groups`, `${slips} slip`, '+90 XP'] };
  ```
- **Best tracked:** slips (lower)
- **Engine features:** lives, oops FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** **Content:** curated packs (12 words, 3 groups of 4, with a red herring). Needs an editor-reviewed list of ~200 puzzles, offensive-word filter.
- **Designer note:** Word capsules are Enamel pieces (Candy gloss below). A right group flies up into a recessed tray with its name. Three of four right shakes with "One away". Lime and plum are the traps.

### 36. Word trails — `wordTrails`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 60 SEC · round timer 60 s
- **Colours:** accent `#8B3DFF`, glow `#FF3D8E` · **Background:** `dots`
- **Figma:** Intro `129:14693` · Playing `129:14784` · **Prototype:** `design/prototype/games/_g2b2.js`
- **How to play (intro copy):** Slide through the letter beads. Let go to try the word. Find every word in the tray.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Word finder', stars: found === 5 ? 3 : 2, stats: [`${found} of 5 words`, `${tries - found} miss`, '+90 XP'] };
  ```
- **Best tracked:** words (higher)
- **Engine features:** combo pill, oops FX, float text
- **Build notes:** **Content:** letter-bead boards + dictionary (bundled English word list, ~60k words, filtered).
- **Designer note:** Six glass beads in a ring. A glowing trail follows the finger, the word builds above, and right answers fly into the tray. Words that aren't in the tray shake off.

### 37. Letter forge — `letterForge`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 60 SEC · round timer 60 s
- **Colours:** accent `#FF7A1F`, glow `#FFC53D` · **Background:** `dots`
- **Figma:** Intro `129:15452` · Playing `130:15507` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Seven letter tiles in your rack. Tap tiles to build a word in the tray. Longer words earn more.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Word smith', stars: best >= 6 ? 3 : 2, stats: [`${words} words`, `Longest ${best}`, '+80 XP'] };
  ```
- **Best tracked:** longest word (higher)
- **Engine features:** hit FX
- **Build notes:** **Content:** 7-letter racks guaranteed to contain a 6+ letter word; same dictionary.
- **Designer note:** Engraved Toy plastic letter tiles snap from the rack into a recessed word tray. Close to Letter guess in feel, so it's the one to drop if the words set feels crowded.

### 38. Mini crossword — `miniCrossword`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 90 SEC · round timer 90 s
- **Colours:** accent `#F4F4F6`, glow `#8B3DFF` · **Background:** `grid`
- **Figma:** Intro `129:15021` · Playing `129:15092` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Read the clue for the highlighted row. Type the answer on the keys. Crossing letters help with the down words.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Crossword done', stars: wrong ? 2 : 3, stats: [`${typed} letters`, `${wrong} wrong letter`, '+90 XP'] };
  ```
- **Best tracked:** wrong letters (lower)
- **Engine features:** oops FX, toast
- **Build notes:** **Content:** 5×5 mini crosswords with clues (pack of 150). Custom keyboard (system keyboard is slow and covers the grid).
- **Designer note:** A 3×3 word square on cream raised squares. The active clue sits above; letters type in, crossings glow, and the finished grid lifts. A real version needs a daily puzzle feed.

### 39. Word bridge — `wordBridge`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 60 SEC · round timer 60 s
- **Colours:** accent `#17D9A3`, glow `#22A6FF` · **Background:** `dots`
- **Figma:** Intro `129:15171` · Playing `129:15261` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Get from the top word to the bottom word. Change one letter per step. Every step has to be a real word.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Bridge of words', stars: bad ? 2 : 3, stats: [`${steps + 1} steps`, `${bad} non-word`, '+80 XP'] };
  ```
- **Best tracked:** steps (lower)
- **Engine features:** hit FX, oops FX, toast
- **Build notes:** **Content:** word-ladder pairs with a known shortest path (BFS over the dictionary, 4-letter words).
- **Designer note:** Each new rung flips its changed letter in and locks. A step that isn't a word shakes off. Short ladders, so it fits a one-minute detour.

### 40. Letter guess — `letterGuess`

- **Group:** Words (`words`) · **Batch:** B3 · **Effort:** M
- **Chip / length:** WORDS · 60 SEC · round timer 60 s
- **Colours:** accent `#17D9A3` · **Background:** `dots`
- **Figma:** Intro `130:15559` · Playing `130:15622` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Read the clue. Tap a letter you think is in the word. Solve it before five misses.
- **Round loop (prototype):** continues while `!T.done && w < 2`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Word found', stars: misses <= 2 ? 3 : 2, stats: [`${solved} of ${w} words`, `${misses} misses`, '+90 XP'] };
  ```
- **Best tracked:** misses (lower)
- **Engine features:** lives, hit FX, oops FX, toast
- **Build notes:** **Content:** clue + word list (hangman-style, 5 misses). Two words per round.
- **Designer note:** Letters stamp into carved wells; the rack is Toy plastic in the game colour. Wrong letters go dark so you never guess one twice.


---

## Batch 4

### 41. What changed? — `whatChanged`

- **Group:** Attention (`attention`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** ATTENTION · 45 SEC · round timer 45 s
- **Colours:** accent `#17D9A3` · **Background:** `grid`
- **Figma:** Intro `125:10981` · Playing `125:11029` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Remember the six pieces. Caps come down and one changes. Tap the one that changed.
- **Round loop (prototype):** continues while `!T.done && r < 5 && lost < 3`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good eye', stars: lost === 0 ? 3 : 2, stats: [`${found} of ${r} spotted`, `${3 - lost} of 3 lives`, '+80 XP'] };
  ```
- **Best tracked:** spotted (higher)
- **Engine features:** lives, hit FX, oops FX, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** Six pieces, caps come down, one changes; 3 lives.
- **Designer note:** Pieces sit in recessed wells; graphite caps drop over them. The background goes quiet while you memorise.

### 42. Make the target — `makeTheTarget`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** QUICK DECISIONS · 45 SEC · round timer 45 s
- **Colours:** accent `#FF3D8E` · **Background:** `grid`
- **Figma:** Intro `127:13034` · Playing `127:13089` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** A target number appears. Tap tiles that add up to it. Hit it exactly. Go over and it resets.
- **Round loop (prototype):** continues while `!T.done && r < 6`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Right on target', stars: hits >= 6 ? 3 : 2, stats: [`${hits} targets`, `${overs} went over`, '+90 XP'] };
  ```
- **Best tracked:** targets (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Tiles that sum to a target; going over resets. Generator guarantees a solution.
- **Designer note:** The target sits in a recessed well, the number tiles are enamel pieces that lift when picked. Going over shakes the tiles back.

### 43. Micro defender — `microDefender`

- **Group:** Attention (`attention`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** FOCUS · 45 SEC · round timer 45 s
- **Colours:** accent `#8B3DFF`, glow `#22A6FF` · **Background:** `grid`
- **Figma:** Intro `125:10363` · Playing `125:10409` · **Prototype:** `design/prototype/games/_g2b3.js`
- **How to play (intro copy):** Little blobs drift toward your crystal. Drag the shield round to face them. Every bounce turns a blob into sparkles.
- **Round loop (prototype):** continues while `!T.done && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: through ? 'Crystal saved' : 'Untouched', stars: through === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${blocked} blocked`, `${through} got through`, '+80 XP'] };
  ```
- **Best tracked:** blocked (higher)
- **Engine features:** lives, oops FX, float text
- **Build notes:** Rotate a shield around a crystal; drag gesture on a circle.
- **Designer note:** No combat: friendly blobs bounce off a glowing shield arc and burst into sparkles. The crystal is a Candy piece; it flickers if a blob gets through. Blobs come from more directions as the round goes on.

### 44. Rhythm relay — `rhythmRelay`

- **Group:** Memory (`memory`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** MEMORY · 45 SEC · round timer 45 s
- **Colours:** accent `#FF3D8E`, glow `#FF7A1F` · **Background:** `grid`
- **Figma:** Intro `125:9505` · Playing `125:9564` · **Prototype:** `design/prototype/games/_g2b3.js`
- **How to play (intro copy):** Watch the pads play a beat. Notice the gaps, not just the order. Play it back on time.
- **Round loop (prototype):** continues while `!T.done && round < 4 && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good rhythm', stars: lv === 3 && onTime >= total - 1 ? 3 : 2, stats: [`${onTime} of ${total} on time`, `${3 - lv} wrong pad`, '+80 XP'] };
  ```
- **Best tracked:** on time (higher)
- **Engine features:** lives, hit FX, oops FX, toast, quiet background
- **Build notes:** **Audio:** pads play a beat; tap back on time (±120 ms window). Needs low-latency audio (expo-audio preloaded, test latency on device).
- **Designer note:** Four Toy plastic pads (they hum in the real app; muted mode just lights them). A timeline under the pads shows the beat as white marks and your taps as dots, so you can see if you were early or late.

### 45. Odd sound out — `oddSoundOut`

- **Group:** Attention (`attention`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** FOCUS · 40 SEC · round timer 40 s
- **Colours:** accent `#8B3DFF`, glow `#FF3D8E` · **Background:** `dots`
- **Figma:** Intro `125:10882` · Playing `125:10928` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Three tones play, one after another. Two are the same, one is a little different. Tap the odd one.
- **Round loop (prototype):** continues while `!T.done && n < 10`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good ear', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n}`, 'Listening focus', '+70 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX, quiet background
- **Build notes:** **Audio:** three tones, one detuned; difficulty = cents difference.
- **Designer note:** Listening focus. Needs sound: here each tone is drawn as a bar whose height is its pitch, which is also the muted fallback. The weakest fit in the catalogue, because many people play with sound off.

### 46. Shadow match — `shadowMatch`

- **Group:** Logic & spatial (`logic`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** SPATIAL · 40 SEC · round timer 40 s
- **Colours:** accent `#FFC53D`, glow `#FF7A1F` · **Background:** `persp`
- **Figma:** Intro `128:14269` · Playing `128:14312` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** A silhouette appears on the wall. Turn the piece with the arrows. Line its shadow up with the silhouette.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good eye for angles', stars: extra ? 2 : 3, stats: [`${got} matches`, `${extra} extra turns`, '+80 XP'] };
  ```
- **Best tracked:** extra turns (lower)
- **Engine features:** combo pill, materials toggle (Enamel / Candy gloss)
- **Build notes:** Rotate a piece to match a silhouette (2D rotation of a 3D-looking sprite set).
- **Designer note:** A clay piece on a turntable (Enamel / Candy below) casts a soft shadow onto a recessed wall. Toy plastic arrows turn it 90° at a time. When the shadow matches, it snaps in and glows.

### 47. Spin it — `spinIt`

- **Group:** Attention (`attention`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** FLEXIBILITY · 40 SEC · round timer 40 s
- **Colours:** accent `#5B4BC4`, glow `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `125:10581` · Playing `125:10626` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** A shape sits at the top. Below are two copies, both turned. One is only turned, one is mirrored: tap the turned one.
- **Round loop (prototype):** continues while `!T.done && n < 10`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Spatial sense', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n}`, 'Mirror spotted', '+70 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Mental rotation: rotated vs mirrored copy.
- **Designer note:** Mental rotation with an F-shaped piece. Enamel shapes (Candy below). After each answer the mirrored one flips to show why.

### 48. Balance lab — `balanceLab`

- **Group:** Logic & spatial (`logic`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** REASONING · 60 SEC · round timer 60 s
- **Colours:** accent `#FFC53D`, glow `#FF7A1F` · **Background:** `grid`
- **Figma:** Intro `129:14575` · Playing `129:14632` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Weights sit on the left of the seesaw. Weight × distance has to match on the right. Place one toy so the beam settles level.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Perfect balance', stars: wr ? 2 : 3, stats: [`${ok} of 3 balanced`, `${wr} wrong try`, '+90 XP'] };
  ```
- **Best tracked:** wrong tries (lower)
- **Engine features:** combo pill, oops FX, toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** Torque puzzle; place one toy so weight×distance balances.
- **Designer note:** Toy weights (Enamel / Candy below) on a brass seesaw. Heavier further out tips harder. The beam tilts live as you place, and a level beam glints.

### 49. Shop sprint — `shopSprint`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** QUICK DECISIONS · 40 SEC · round timer 40 s
- **Colours:** accent `#FFC53D`, glow `#FF7A1F` · **Background:** `grid`
- **Figma:** Intro `127:12724` · Playing `127:12770` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Two offers appear. Work out which is cheaper per item. Tap the better deal before the bar runs out.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Bargain hunter', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n} deals`, 'Quick maths', '+80 XP'] };
  ```
- **Best tracked:** deals (higher)
- **Engine features:** combo pill, hit FX, oops FX, materials toggle (Enamel / Candy gloss)
- **Build notes:** Price-per-item comparison under a bar timer; currency symbol from device locale.
- **Designer note:** Two price tags (Enamel / Candy below) with a shrinking bar under them. Quick per-item maths, with a reveal of the real price per item after each pick.

### 50. Path memory — `pathMemory`

- **Group:** Memory (`memory`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** MEMORY · 45 SEC · round timer 45 s
- **Colours:** accent `#8B3DFF`, glow `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `125:9616` · Playing `125:9671` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** A dot walks a route across the grid. Remember every turn. Redraw the route from the start.
- **Round loop (prototype):** continues while `p.length < n`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good recall', stars: lv === 3 ? 3 : 2, stats: [`Longest ${best} steps`, `${3 - lv} wrong turn`, '+80 XP'] };
  ```
- **Best tracked:** longest route (higher)
- **Engine features:** lives, oops FX, toast, quiet background, materials toggle (Enamel / Candy gloss)
- **Build notes:** Dot walks a route; redraw it; 3 lives.
- **Designer note:** A glowing dot walks a route on a recessed 5×5 grid, leaving a fading trail. Then you trace it back. Routes grow by one step each round.

### 51. Letter orbit — `letterOrbit`

- **Group:** Words (`words`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** WORDS · 45 SEC · round timer 45 s
- **Colours:** accent `#4A5BFF`, glow `#8B3DFF` · **Background:** `dots`
- **Figma:** Intro `129:15295` · Playing `129:15374` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Letters sit on a ring that clicks round. Turn it until the letter you want is at the top. Feed it into the socket to spell the clue word.
- **Round loop (prototype):** continues while `steps-- > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Spelled it', stars: 3, stats: [`${words} words`, `${clicks} clicks`, '+70 XP'] };
  ```
- **Best tracked:** words (higher)
- **Engine features:** toast, materials toggle (Enamel / Candy gloss)
- **Build notes:** Rotate a letter ring to spell the clue word. **Content:** clue list.
- **Designer note:** A machined ring of Enamel letter beads (Candy below) turns one click at a time. The top slot feeds the centre socket. Spell the word the clue describes.

### 52. Paragraph recall — `paragraphRecall`

- **Group:** Memory (`memory`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** MEMORY · ABOUT 1 MIN · round timer 60 s
- **Colours:** accent `#4A5BFF` · **Background:** `grid`
- **Figma:** Intro `125:10280` · Playing `125:10316` · **Prototype:** `design/prototype/games/_g2games.js`
- **How to play (intro copy):** Read the short text. It goes away. Answer one question about it.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Good recall', stars: right === k ? 3 : 2, stats: [`${right} of ${k} right`, 'No rereads', '+70 XP'] };
  ```
- **Best tracked:** right (higher)
- **Engine features:** combo pill, hit FX, quiet background
- **Build notes:** **Content:** short original paragraphs + questions (pack of 100).
- **Designer note:** A high-contrast reading card with a reading bar. After you answer, the card comes back with the line that holds the answer lit.

### 53. Pocket terrarium — `pocketTerrarium`

- **Group:** Calm (`calm`) · **Batch:** B4 · **Effort:** L
- **Chip / length:** CALM · NO TIMER · round timer 60 s
- **Colours:** accent `#17D9A3` · **Background:** `dots` · **Calm game** (no countdown, calm result)
- **Figma:** Intro `130:15922` · Playing `130:15968` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** Pick plants, stones and a little creature. Tap a spot in the jar to place them. Close the lid when it feels right.
- **Round ends:** timer runs out, or all boards/items are done
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Your little jar', line: 'Saved to your collection. Nothing to win here.', stats: ['6 pieces', 'No timer'] };
  ```
- **Best tracked:** —
- **Engine features:** basic
- **Build notes:** Calm, no timer. Place plants/stones/creature in a jar; saved to a collection (`terrariums` table, new). **Art:** ~30 sprites.
- **Designer note:** A glass jar and a small tray of pieces. No goal and no timer: the calm, creative one. The finished jar is saved to your collection.

### 54. Sky glider — `skyGlider`

- **Group:** Self-control (`selfControl`) · **Batch:** B4 · **Effort:** M
- **Chip / length:** COORDINATION · 40 SEC · round timer 40 s
- **Colours:** accent `#22A6FF`, glow `#8B3DFF` · **Background:** `persp`
- **Figma:** Intro `126:12085` · Playing `126:12136` · **Prototype:** `design/prototype/games/_g2b4.js`
- **How to play (intro copy):** The glider flies on its own. Hold and drag up or down to steer. Thread the rings, then land softly.
- **Round loop (prototype):** continues while `!T.done && (n < 12 || rings.length`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: 'Smooth flight', stars: missed === 0 ? 3 : 2, stats: [`${passed} of ${passed + missed} rings`, 'Soft landing', '+80 XP'] };
  ```
- **Best tracked:** rings (higher)
- **Engine features:** oops FX, toast, float text
- **Build notes:** Hold-and-drag steering through rings, soft landing.
- **Designer note:** A glossy paper glider over drifting clouds. Rings come in at different heights; each one you thread chimes and counts. After the last ring a runway slides in for a smooth landing, so a round always ends.

### 55. Tiny dash — `tinyDash`

- **Group:** Quick decisions (`quickDecisions`) · **Batch:** B4 · **Effort:** S
- **Chip / length:** QUICK DECISIONS · 30 SEC · round timer 30 s
- **Colours:** accent `#8B3DFF`, glow `#FF3D8E` · **Background:** `persp`
- **Figma:** Intro `127:12508` · Playing `127:12561` · **Prototype:** `design/prototype/games/_g2b2.js`
- **How to play (intro copy):** Blocks and sparks come down the lanes. Tap ◀ or ▶ to switch lanes. Dodge the red, grab the sparks.
- **Round loop (prototype):** continues while `!T.done && lv > 0`; otherwise ends when the timer runs out
- **Result (port from prototype; replace the XP chip and any fixed demo text with real values):**

  ```js
  return { title: lv > 0 ? 'Made the arch' : 'Wiped out', stars: bumps === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${sparks} sparks`, `${bumps} bump${bumps === 1 ? '' : 's'}`, '+80 XP'] };
  ```
- **Best tracked:** sparks (higher)
- **Engine features:** lives, oops FX, toast, float text, materials toggle (Enamel / Candy gloss)
- **Build notes:** Lane runner with ◀ ▶ buttons (overlaps Lane dash — consider merging into one game with two control schemes).
- **Designer note:** A little runner on three recessed lanes, with Toy plastic lane buttons. Red blocks are Enamel (Candy gloss below). It speeds up as you go, and the finish arch arrives at 30 seconds, so a round always ends.


---

## Batch 5

### 56. Hold the line — `holdTheLine`

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

### 57. Move first — `moveFirst`

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

### 58. Phone away — `phoneAway`

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

### 59. Read aloud — `readAloud`

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

---

## 4. Content pipeline (Batch 3+)

- `tools/content/` scripts (Node) generate and verify puzzle packs into
  `src/features/games/<gameId>/content.json` at build time: solver-verified boards, filtered
  word lists (no slurs/profanity; list reviewed by a person), crossword and category packs.
- Packs are versioned; a played board id is stored in `game_results.stats_json` so the same
  board isn't repeated within 30 days.
- Word lists: English only in v1.

## 5. Open questions

1. Merge Tiny dash into Lane dash (same idea, two control schemes)?
2. Phone away: foreground service (works with screen off, needs a Play declaration) or
   "keep Untangle open" rule?
3. Read aloud needs network on many phones (online speech recognition). Ship it online-only
   with a clear note, or drop it from v1?
4. Colour-blind pattern option in v1 or v1.1?
