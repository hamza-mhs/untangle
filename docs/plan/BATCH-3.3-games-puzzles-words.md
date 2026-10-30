# BATCH 3.3 — Puzzles & words (14 games) + content pipeline

**Goal:** Longer, satisfying puzzles and word games. These need content (puzzle boards, word lists, clue packs), so the batch starts with a content pipeline that generates and verifies everything at build time. Bundled offline; English only.

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
| 3.3.0 | Content pipeline (do first) | — |
| 3.3a | Grid puzzles | Flow lines, Slide escape, Path painter, One-line art |
| 3.3b | Mechanical puzzles | Laser lab, Merge garden, Mini nonogram, Bridge builder |
| 3.3c | Word games (generated) | Word trails, Letter forge, Word bridge, Letter guess |
| 3.3d | Word games (curated packs) | Category clusters, Mini crossword |
| 3.3e | Wiring | — |

### 3.3.0 · Content pipeline (do first)

- `tools/content/` (Node scripts, run with `npm run content`) writes versioned packs to
  `src/features/games/games/<gameId>/content.json`. Each pack has `version` and an `items` array
  with stable `id`s; `game_results.stats_json` stores the item id so the same board is not
  repeated within 30 days (`pickUnplayed(items, recentIds, seed)` in `kit/content.ts`, tested).
- **Word list:** use a public-domain list (ENABLE) or SCOWL (permissive licence — include its
  licence file). Filter to common words (length 3–8) and remove offensive words with a
  reviewed blocklist in `tools/content/blocklist.txt`. Record source and licence in
  `tools/content/README.md`. Never download at runtime.
- **Generators + solvers** (each with a test that re-solves every item in the pack):
  Flow lines (5×5, 6×6, unique solution), Slide escape (solvable, minimum moves recorded),
  Path painter (Hamiltonian path exists), One-line art (0 or 2 odd vertices), Mini nonogram
  (5×5, line-solvable), Word bridge (4-letter ladders, BFS shortest path 3–5).
- **Hand-written packs** (Claude Code drafts, **owner reviews before release**; mark
  `reviewed: false` until then): Category clusters (≥ 120 puzzles: 12 words, 3 groups of 4,
  one red herring each), Mini crossword (≥ 100 5×5 grids with clues), Letter guess (≥ 300
  clue + word pairs). Keep language neutral and inoffensive; no brands, politics, religion.
- Pack sizes target: enough for 3 months of daily play without repeats.

Commit: `batch-3.3.0: content pipeline (do first)`

### 3.3a · Grid puzzles

Games: Flow lines, Slide escape, Path painter, One-line art.

Drag-to-draw paths: use react-native-gesture-handler Pan with snapping to cells; never block the JS thread while drawing.

Commit: `batch-3.3a: grid puzzles`

### 3.3b · Mechanical puzzles

Games: Laser lab, Merge garden, Mini nonogram, Bridge builder.

Laser lab: beam drawn above the mirrors' bases but below the mirror bars (the prototype fixed layering this way). Bridge builder's "Pip" sprite is a placeholder until the mascot is chosen.

Commit: `batch-3.3b: mechanical puzzles`

### 3.3c · Word games (generated)

Games: Word trails, Letter forge, Word bridge, Letter guess.

Shared `kit/WordTiles` and an in-game letter keyboard (system keyboard covers the board).

Commit: `batch-3.3c: word games (generated)`

### 3.3d · Word games (curated packs)

Games: Category clusters, Mini crossword.

Both stay behind a `reviewed` flag: unreviewed items are only served in dev builds.

Commit: `batch-3.3d: word games (curated packs)`

### 3.3e · Wiring

New tag, training rotation, pause pool excludes games longer than 45 s (most of this batch).

Commit: `batch-3.3e: wiring`

## Screens

Screenshots in `design/screens/games/`.

| Game | id | Intro / Playing screenshot | Figma intro / playing |
|---|---|---|---|
| Flow lines | `flowLines` | `flowLines--intro.png` / `flowLines--playing.png` | `128:13847` / `128:13933` |
| Slide escape | `slideEscape` | `slideEscape--intro.png` / `slideEscape--playing.png` | `128:14363` / `128:14405` |
| Path painter | `pathPainter` | `pathPainter--intro.png` / `pathPainter--playing.png` | `128:14456` / `129:14512` |
| One-line art | `oneLineArt` | `oneLineArt--intro.png` / `oneLineArt--playing.png` | `128:14175` / `128:14217` |
| Laser lab | `laserLab` | `laserLab--intro.png` / `laserLab--playing.png` | `128:13357` / `128:13460` |
| Merge garden | `mergeGarden` | `mergeGarden--intro.png` / `mergeGarden--playing.png` | `128:13155` / `128:13255` |
| Mini nonogram | `miniNonogram` | `miniNonogram--intro.png` / `miniNonogram--playing.png` | `128:14036` / `128:14101` |
| Bridge builder | `bridgeBuilder` | `bridgeBuilder--intro.png` / `bridgeBuilder--playing.png` | `128:13564` / `128:13638` |
| Word trails | `wordTrails` | `wordTrails--intro.png` / `wordTrails--playing.png` | `129:14693` / `129:14784` |
| Letter forge | `letterForge` | `letterForge--intro.png` / `letterForge--playing.png` | `129:15452` / `130:15507` |
| Word bridge | `wordBridge` | `wordBridge--intro.png` / `wordBridge--playing.png` | `129:15171` / `129:15261` |
| Letter guess | `letterGuess` | `letterGuess--intro.png` / `letterGuess--playing.png` | `130:15559` / `130:15622` |
| Category clusters | `categoryClusters` | `categoryClusters--intro.png` / `categoryClusters--playing.png` | `129:14880` / `129:14952` |
| Mini crossword | `miniCrossword` | `miniCrossword--intro.png` / `miniCrossword--playing.png` | `129:15021` / `129:15092` |

---

# Game specs

Format: id · group · batch · length · colours · background · Figma · how to play (intro copy) · round loop · result (from the prototype) · best tracked · engine features · build notes · designer note.

### Flow lines — `flowLines`

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


### Slide escape — `slideEscape`

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


### Path painter — `pathPainter`

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


### One-line art — `oneLineArt`

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


### Laser lab — `laserLab`

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


### Merge garden — `mergeGarden`

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


### Mini nonogram — `miniNonogram`

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


### Bridge builder — `bridgeBuilder`

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


### Word trails — `wordTrails`

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


### Letter forge — `letterForge`

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


### Word bridge — `wordBridge`

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


### Letter guess — `letterGuess`

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



### Category clusters — `categoryClusters`

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


### Mini crossword — `miniCrossword`

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



## Acceptance

- [ ] Every sub-batch committed, PROGRESS.md updated.
- [ ] Every game: logic tests, plays start → result on the emulator, best saved, incomplete saved on quit.
- [ ] Games tab and training show the new games; nothing from earlier batches regressed (`npm run check`).
- [ ] List what still needs a real phone (60 fps, audio latency, sensors).
