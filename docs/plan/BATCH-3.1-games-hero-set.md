# BATCH 3.1 — Game engine + the hero set (12 games)

**Goal:** the shared game engine, built to production quality, and the 12 most fun and most
useful games: the arcade games for the urge moment, the core focus classics, and the calm
games (breathing, sitting in silence, riding the urge). Then replace Batch 2's placeholder
game everywhere (training, Games tab, pause screen).

Prerequisite: Batches 1 and 2. Read `docs/plan/README.md` for the rules.

## Sub-batches

| # | Sub-batch | Games | Done when |
|---|---|---|---|
| 3.1a | Engine + reference games | **Colour word** (reference flow), **Stack tower** | Intro with live demo, 3-2-1-Go, HUD (timer ring states, score roll, combo, lives), FX layer (ring, burst, float, oops, toast), background art, pause sheet, result screen (normal + calm), persistence and bests, haptics and sound — all matching `design/screens/games-reference-flow/` |
| 3.1b | Arcade | **Rocket hop**, **Lane dash**, **Block fit** | Playable at 60 fps on a mid-range phone; generators tested |
| 3.1c | Focus classics | **Middle arrow**, **Don't tap red**, **Echo**, **Card pairs** | Scoring identical to the prototype; reaction-time stat for Middle arrow |
| 3.1d | Calm | **Breath count**, **Silence**, **Urge surfing** | Calm intro (Begin), no countdown, calm result; real lengths (90 s, 2/3/5 min, 60–90 s) |
| 3.1e | Wiring | — | Games tab (filters, grid, Up next), training uses real games, pause screen offers real quick games (Stack tower default), placeholder deleted |

## How to port a game

1. Open `design/prototype/untangle-games-prototype.html` in a desktop browser, find the game,
   switch the top toggle between *Intro* and *Game* and play it a few times.
2. Read its source in `design/prototype/games/` (file listed per game). The `round: async P => {…}`
   function is the game. `P.*` calls map 1:1 to `GameApi` (§A 2.1): `P.timer` → `api.timer`,
   `P.w` → `api.wait`, `P.hit/oops/toast/float/ring/burst` → `api.fx.*`, `combo(P)` →
   `api.combo()`, `livesUI(P)` → `api.lives()`, `P.quiet` → `api.quiet`, `return {title, stars,
   stats}` → `api.finish(result)`.
3. Put pure logic (generators, scoring, rules) in `features/games/<gameId>/logic.ts` with tests;
   UI in `Round.tsx`; demo script for the intro in `Demo.tsx` if the default autoplay isn't
   enough.
4. Visuals: the toy/enamel pieces are drawn with Skia (gradient fill, inner highlight, bottom
   "thickness" shadow) as reusable components `ToyKey`, `EnamelPiece` in
   `features/games/engine/pieces/` — compare against `design/screens/games/<gameId>--playing.png`.
5. Remove the prototype's "+NN XP" chip and replace fixed demo text with real values.

## Screens

| Game | Intro | Playing | Figma intro / playing |
|---|---|---|---|
| Colour word | `colourWord--intro.png` | `colourWord--playing.png` + all 16 files in `games-reference-flow/` | `126:11262` / `126:11301`, flow `131:16493` |
| Stack tower | `stackTower--intro.png` | `stackTower--playing.png` | `126:11766` / `126:11817` |
| Rocket hop | `rocketHop--intro.png` | `rocketHop--playing.png` | `126:11876` / `126:11921` |
| Lane dash | `laneDash--intro.png` | `laneDash--playing.png` | `127:12625` / `127:12674` |
| Block fit | `blockFit--intro.png` | `blockFit--playing.png` | `128:13713` / `128:13765` |
| Middle arrow | `middleArrow--intro.png` | `middleArrow--playing.png` | `125:10679` / `125:10736` |
| Don't tap red | `dontTapRed--intro.png` | `dontTapRed--playing.png` | `127:12267` / `127:12313` |
| Echo | `echo--intro.png` | `echo--playing.png` | `125:9738` / `125:9780` |
| Card pairs | `cardPairs--intro.png` | `cardPairs--playing.png` | `125:9930` / `125:10033` |
| Breath count | `breathCount--intro.png` | `breathCount--playing.png` | `130:16003` / `130:16045` |
| Silence | `silence--intro.png` | `silence--playing.png` | `130:16082` / `130:16145` |
| Urge surfing | `urgeSurfing--intro.png` | `urgeSurfing--playing.png` | `130:16202` / `130:16242` |
| Games tab | `design/screens/app/04-games--games-tab.png`, `05-games--games-new-filter.png` | | `119:5145`, `119:5293` |
| Result (normal / calm) | `games-reference-flow/13-…result-level-complete.png`, `app/09-games--calm-session-finished.png` | | `132:18852`, `119:5507` |

## Acceptance

- [ ] 3.1a: every frame in `design/screens/games-reference-flow/` can be reproduced in the app
      (countdown timing 620 ms per beat, timer ring white → amber at 40% → red in the last 5 s,
      streak pill hot at 3, hit ring + burst + float, wrong shake, "Time!", stars stagger,
      pause / resume 3-2-1 / backgrounded pause).
- [ ] Every game: logic tests (1,000 seeds where there is a generator), stars thresholds equal
      to the prototype, best saved, quitting saves an incomplete result.
- [ ] 60 fps (no dropped frames visible) on a mid-range Android; no JS-thread animation loops.
- [ ] Reduce motion honoured (no particles, fades instead of movement).
- [ ] TalkBack labels on intro, result and pause.
- [ ] 3.1e: placeholder game deleted; pause screen → Stack tower → "Open Instagram for 5 min"
      works end to end on a device.
- [ ] Commit after each sub-batch: `batch-3.1a: game engine`, …

## Next batches (not in this file)

3.2 Daily core (14) · 3.3 Puzzles & words (14, needs content packs) · 3.4 Variety (15) ·
3.5 Device features (4). Full specs per game are in `docs/spec/30-phase3-games.md`.

---

# Full requirements


## §A · Game engine (sub-batch 3.1a)
### A.2 The engine (`src/features/games/engine`)

#### A.2.1 Game module contract

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

#### A.2.2 Intro — `119:5431`, reference `131:18263`

Full-bleed **live demo** in the top half (the real Round with `demo: true` at 0.84 scale, a
finger sprite showing taps, looping), then chips (focus group chip in the group colour +
duration chip), game name (`type.titleLg`), one sentence (`howTo` joined), **Start** (white
button; calm games: **Begin**). ✕ top-left. "Your best" is **not** shown (design decision).
From the pause screen the header reads "You opened Instagram. Play this instead?".

#### A.2.3 Countdown — reference `131:18299`…`131:18410`

Dim overlay; digits **3, 2, 1, Go** each 620 ms (`motion.easing.pop`: scale 1.8 → 1 → 0.92 →
0.8, opacity 0 → 1 → 1 → 0) with a 20 ms gap; a white ring pulse (170 px) on each digit; on
**Go** a ring in the game colour (260 px) plus a 16-particle burst; haptic `go` on Go. Calm
games skip the countdown and show the settle line (e.g. "Get comfortable") for 1.2 s. Resume
after pause uses a short **3, 2, 1** (no Go).

#### A.2.4 HUD — reference `131:18463`

Top row: ✕ (pause) · title + round label ("1 OF 14") · **timer ring** (52 px, 4 px stroke,
track `white 12%`, progress white; number inside). Under it a thin **time bar**. Then **score**
(rolls up 20% of the gap per frame) + "pts", and the right slot (**combo pill** "Streak {n}",
turns hot ≥3 and pops on change; or **lives** hearts). Bottom: **hint line** with a coloured dot
(neutral / good green / bad red).

Timer states: normal (white); **warning** when ≤40% left and >5 s (ring, number and bar amber
`signal.warning`) — `131:18717`; **last 5 s** (red ring/bar, number ticks with a small scale
pulse each second, red inner vignette pulsing 1 s) — `131:18763`; **time up** red toast "Time!"
— `132:18809`. Calm games hide the timer ring.

#### A.2.5 FX layer (Skia, UI thread)

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

#### A.2.6 Background

Skia canvas per game screen. Types `grid` (lines), `dots`, `persp` (perspective grid). Base
`#020204`, line alpha 0.026, glow alpha 0.07 (glow colour = game `glow`), 2 slow pulses, pulse
alpha 0.26, segment highlight 0.12. Very subtle by design — check on a real OLED screen.
`quiet(true)` fades lines to 40% during memorise phases. Rendering pauses when the game is
paused or the app is in background. Reference: `131:18263` (bg visible behind every frame of the
reference flow).

#### A.2.7 Pause — `132:18951`, `132:19058`

✕ or leaving the app pauses: everything freezes (timer, waits, animations). Sheet: "Paused" ·
"Leave now and this round won't count. Your streak is safe." (left the app: "You left the app,
so we paused. The timer stopped with you."; calm: "Take your time. Nothing is lost.") ·
**Resume** (3-2-1 then continue) · **Restart** · **Quit** (red). System Back = pause; Back on the
sheet = Resume.

#### A.2.8 Result — `132:18852` (calm: `119:5507`)

Rays rotating slowly in the game colour (22% mix), kicker = game name uppercase, title
(`RoundResult.title`), **stars** landing one by one (0.25 s, 0.5 s, 0.75 s; middle star larger),
**score** rolling up, "New best" tag when beaten, stats chips. Buttons **Done for now** (white)
and **Another round** (text). Calm variant: white check in a circle, one line, **Done for now** /
**Again**. From the pause screen: Done → "Back to my day" + unlock button (20 §8).

The prototype's "+80 XP" chip is **not** shown in v1 (no XP system); use the third chip for a
game-specific stat or omit it.

#### A.2.9 Persistence, haptics, sound

- On finish: insert `game_results`; update `game_bests` if better (direction per game: e.g.
  Time it right lower is better).
- Quit or app killed mid-round: result saved with `completed = false` (does not count for
  training or streak).
- Haptics: `tap` (selection) on every input, `good` (light impact) on correct, `bad` (error
  notification) on wrong, `go` (medium) on Go and result. Respect the Settings toggle.
- Sounds: short `.ogg`, preloaded per game; muted when Settings › Sound is off or the phone is
  in silent/vibrate mode (Calm games: soft chime only).

#### A.2.10 Randomness and fairness

All generators take the round `seed` (mulberry32 in `lib/rng.ts`). Every generator has a unit
test that runs 1,000 seeds and asserts the board is solvable and within the difficulty band
(e.g. Flow lines has a unique solution, Make the target is reachable, Mini nonogram is line-
solvable, Slide escape solvable within N moves).

#### A.2.11 Performance and accessibility

- 60 fps on a mid-range phone (e.g. Galaxy A15): game loops run in Reanimated worklets / Skia,
  not React state per frame.
- Minimum 44 dp touch targets; boards scale with screen width (design at 300–412 wide).
- Colour-only games (Colour word, Flow lines, Card pairs colours) must also work for colour-
  blind users: each game colour has a matching pattern/shape option (Settings toggle "Colour
  patterns", v1.1 if time is short — flagged).
- TalkBack: intro, result and pause are fully labelled; timed boards announce "Game in progress,
  TalkBack gestures may be too slow" and Calm games are fully accessible.

---



## §B · The 12 games
### Game spec format

Each entry: id · focus group · batch · duration · colours · background · Figma frames ·
how to play (intro copy) · end condition · stars/result (ported from prototype) · engine features
used · content/platform needs · designer note · effort.

The prototype's result stats sometimes contain fixed demo text (e.g. `'1 miss'`, `'Soft landing'`, `'+80 XP'`) and some calm/active timers are shortened for demos; compute real values and use the lengths stated in **Build notes**.


### Batch 1 games (hero set)

#### 1. Stack tower — `stackTower`

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

#### 2. Rocket hop — `rocketHop`

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

#### 3. Lane dash — `laneDash`

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

#### 4. Block fit — `blockFit`

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

#### 5. Colour word — `colourWord`

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

#### 6. Middle arrow — `middleArrow`

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

#### 7. Don't tap red — `dontTapRed`

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

#### 8. Echo — `echo`

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

#### 9. Card pairs — `cardPairs`

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

#### 10. Breath count — `breathCount`

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

#### 11. Silence — `silence`

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

#### 12. Urge surfing — `urgeSurfing`

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



## §C · Why these 12 first (context)
### C.1 Build order: 5 batches

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

