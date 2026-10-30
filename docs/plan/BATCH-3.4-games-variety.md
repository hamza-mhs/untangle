# BATCH 3.4 — Variety (15 games)

**Goal:** Niche mechanics and extra flavour: spatial and number puzzles, two audio games, memory variants, a steering game and the calm terrarium.

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
| 3.4a | Attention & spatial | What changed?, Spin it, Shadow match, Micro defender |
| 3.4b | Numbers | Make the target, Shop sprint, Balance lab |
| 3.4c | Memory & audio | Rhythm relay, Odd sound out, Path memory, Paragraph recall, Letter orbit |
| 3.4d | Motion & calm | Sky glider, Tiny dash, Pocket terrarium |
| 3.4e | Wiring | — |

### 3.4a · Attention & spatial

Games: What changed?, Spin it, Shadow match, Micro defender.

Spin it and Shadow match share a `kit/ShapeSprite` (rotate / mirror).

Commit: `batch-3.4a: attention & spatial`

### 3.4b · Numbers

Games: Make the target, Shop sprint, Balance lab.

Shop sprint: currency symbol and decimal separator from the device locale (`Intl.NumberFormat`).

Commit: `batch-3.4b: numbers`

### 3.4c · Memory & audio

Games: Rhythm relay, Odd sound out, Path memory, Paragraph recall, Letter orbit.

Audio games need low latency: preload tones with expo-audio and measure tap-to-sound latency on a
real phone; Rhythm relay's on-time window is ±120 ms **after subtracting measured output
latency** (store a per-device offset; add a short calibration tap test on first play).
Both audio games show "Turn your sound on" when the phone is muted. Paragraph recall and Letter
orbit need content packs (use the 3.3.0 pipeline, owner review).

Commit: `batch-3.4c: memory & audio`

### 3.4d · Motion & calm

Games: Sky glider, Tiny dash, Pocket terrarium.

**Tiny dash vs Lane dash:** ask the owner first whether to merge Tiny dash into Lane dash as a
second control scheme (buttons vs swipe) instead of a separate game.
**Pocket terrarium:** calm, no timer; needs ~30 sprites (plants, stones, creatures) — draw
simple vector placeholders and list them for the designer; saved jars go in a new
`terrariums` table (migration) and a small "My jars" row on the result screen.

Commit: `batch-3.4d: motion & calm`

### 3.4e · Wiring

New tag, training rotation, pause pool (≤ 45 s, not calm).

Commit: `batch-3.4e: wiring`

## Screens

Screenshots in `design/screens/games/`.

| Game | id | Intro / Playing screenshot | Figma intro / playing |
|---|---|---|---|
| What changed? | `whatChanged` | `whatChanged--intro.png` / `whatChanged--playing.png` | `125:10981` / `125:11029` |
| Spin it | `spinIt` | `spinIt--intro.png` / `spinIt--playing.png` | `125:10581` / `125:10626` |
| Shadow match | `shadowMatch` | `shadowMatch--intro.png` / `shadowMatch--playing.png` | `128:14269` / `128:14312` |
| Micro defender | `microDefender` | `microDefender--intro.png` / `microDefender--playing.png` | `125:10363` / `125:10409` |
| Make the target | `makeTheTarget` | `makeTheTarget--intro.png` / `makeTheTarget--playing.png` | `127:13034` / `127:13089` |
| Shop sprint | `shopSprint` | `shopSprint--intro.png` / `shopSprint--playing.png` | `127:12724` / `127:12770` |
| Balance lab | `balanceLab` | `balanceLab--intro.png` / `balanceLab--playing.png` | `129:14575` / `129:14632` |
| Rhythm relay | `rhythmRelay` | `rhythmRelay--intro.png` / `rhythmRelay--playing.png` | `125:9505` / `125:9564` |
| Odd sound out | `oddSoundOut` | `oddSoundOut--intro.png` / `oddSoundOut--playing.png` | `125:10882` / `125:10928` |
| Path memory | `pathMemory` | `pathMemory--intro.png` / `pathMemory--playing.png` | `125:9616` / `125:9671` |
| Paragraph recall | `paragraphRecall` | `paragraphRecall--intro.png` / `paragraphRecall--playing.png` | `125:10280` / `125:10316` |
| Letter orbit | `letterOrbit` | `letterOrbit--intro.png` / `letterOrbit--playing.png` | `129:15295` / `129:15374` |
| Sky glider | `skyGlider` | `skyGlider--intro.png` / `skyGlider--playing.png` | `126:12085` / `126:12136` |
| Tiny dash | `tinyDash` | `tinyDash--intro.png` / `tinyDash--playing.png` | `127:12508` / `127:12561` |
| Pocket terrarium | `pocketTerrarium` | `pocketTerrarium--intro.png` / `pocketTerrarium--playing.png` | `130:15922` / `130:15968` |

---

# Game specs

Format: id · group · batch · length · colours · background · Figma · how to play (intro copy) · round loop · result (from the prototype) · best tracked · engine features · build notes · designer note.

### What changed? — `whatChanged`

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


### Spin it — `spinIt`

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


### Shadow match — `shadowMatch`

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


### Micro defender — `microDefender`

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


### Make the target — `makeTheTarget`

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


### Shop sprint — `shopSprint`

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


### Balance lab — `balanceLab`

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


### Rhythm relay — `rhythmRelay`

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


### Odd sound out — `oddSoundOut`

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


### Path memory — `pathMemory`

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


### Paragraph recall — `paragraphRecall`

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


### Letter orbit — `letterOrbit`

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


### Sky glider — `skyGlider`

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


### Tiny dash — `tinyDash`

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



### Pocket terrarium — `pocketTerrarium`

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



## Acceptance

- [ ] Every sub-batch committed, PROGRESS.md updated.
- [ ] Every game: logic tests, plays start → result on the emulator, best saved, incomplete saved on quit.
- [ ] Games tab and training show the new games; nothing from earlier batches regressed (`npm run check`).
- [ ] List what still needs a real phone (60 fps, audio latency, sensors).
