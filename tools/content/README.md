# Content pipeline

`npm run content` builds every puzzle and word pack and writes
`src/features/games/games/<gameId>/content.json`. It is deterministic (fixed seeds), so
re-running gives the same packs and item ids stay stable. Nothing is downloaded at runtime:
the packs ship inside the app and each one loads with its game.

Every pack is `{ version, items: [{ id, … }] }`. Rounds report the ids they used in
`RoundResult.items` (saved in `game_results.stats_json`), and `pickRoundItems` /
`pickUnplayed` (`src/features/games/kit/`) skip anything served in the last 30 days.

## Word list

- **Source:** ENABLE (Enhanced North American Benchmark Lexicon), `data/enable1.txt`,
  172,823 words, from the `dolph/dictionary` GitHub mirror.
- **Licence:** public domain. No licence file is needed; attribution is a courtesy.
- **Accepted words** (what counts as a real word in Letter forge and Word bridge): ENABLE,
  3–8 letters, minus `blocklist.txt` (whole words, their -s/-es/-ed/-ing forms, and a few
  roots blocked even inside longer words; see `words.ts`).
- **Common words** (what puzzles use as answers): the hand-curated `common.txt` ∩ accepted.
  The build prints any `common.txt` word that isn't accepted.

`blocklist.txt` is a draft: **the owner should review it before release.**

## Packs

| Game | Pack | How it's checked (tests re-check every item) |
|---|---|---|
| Flow lines | 200 5×5 + 100 6×6 boards | solver: exactly one solution, stored solution valid |
| Slide escape | 220 5×5 boards (4–14 moves) | BFS re-solve equals the recorded minimum moves |
| Path painter | 220 5×5 boards, 1–3 rocks | stored one-stroke path covers every free square |
| One-line art | 12 hand icons + generated drawings (200) | 0 or 2 odd points, stored Euler trail valid |
| Mini nonogram | 26 hand pictures + mirrored patterns (160) | line-solvable without guessing |
| Word bridge | 220 4-letter ladders + 4-letter dictionary | BFS shortest path 3–5 steps, matches stored route |
| Word trails | 220 boards: 6 beads, 5 tray words | every tray word spells from the beads |
| Letter forge | 220 7-letter racks + their word lists | a 6+ letter word exists, every listed word fits |
| Mini crossword | 3×3 grids (100+), six clued words each | rows and columns are six different words |
| Letter guess | 419 clue + word pairs (hand-written) | rules only; `reviewed: false` |
| Category clusters | 132 puzzles (hand-written) | 3×4 groups, one red herring; `reviewed: false` |

Hand-written content (Category clusters, Letter guess, the 3-letter crossword clues in
`clues/clues3.json`) was drafted by Claude Code. It stays `reviewed: false`, which means it is
served in dev builds only, until the owner has reviewed it and flips the flag.

Generators live next to each game (`games/<gameId>/generate.ts`, build-time only) and the
solvers in `logic.ts`, so the build, the tests and the rounds share one implementation.
