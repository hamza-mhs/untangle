# BATCH 3.6 — Games polish (do after 3.2–3.5, or earlier if the owner asks)

**Goal:** close the gaps Batch 3.1 recorded as deviations in `docs/plan/PROGRESS.md`, so every
game matches the designs, not just the rules. This affects all 59 games, so it's cheaper as one
pass once the library exists.

| # | Sub-batch | What |
|---|---|---|
| 3.6a | Live intro demos | The intro's top half plays the real round in demo mode (scripted autoplay, finger sprite, 0.84 scale, looping), as in `design/screens/games-reference-flow/01-colour-word--intro.png` and the prototype. Add `demo: boolean` to `RoundProps`; a game can supply a `Demo` script (list of timed taps). Fallback to the badge only for calm/active games. |
| 3.6b | Toy and Enamel pieces | Replace the simple shapes with the designed materials: **Toy plastic** keys/pads (gradient body, top highlight, darker 6 dp "thickness" underside) and **Enamel** pieces (glossy top, metal rim). Build `kit/ToyKey`, `kit/EnamelPiece`, `kit/CandyPiece` once, then swap them into every game. Compare each game with `design/screens/games/<gameId>--playing.png`. Rocket hop: replace the emoji rocket with a drawn sprite. |
| 3.6c | Block fit drag | Drag-and-drop from the tray with a ghost preview and snap (keep tap-to-place as an accessibility alternative). |
| 3.6d | Performance pass | Measure on a mid-range phone (e.g. Galaxy A15): every game ≥ 55 fps during play. Where the Reanimated + SVG FX/background drop frames, move them to `@shopify/react-native-skia` (already installed). Record results per game in `docs/device-tests.md`. |
| 3.6e | Game icons | Badge-style icon per game (the "Game icons" designs) as WebP in `assets/games/<gameId>/icon.webp`, used by the Games tab, intro and Home training cards. Needs exports from the designer/Figma. |

Acceptance: side-by-side screenshots for 10 games of the owner's choice match the design
screenshots; fps table filled; no regressions (`npm run check`).
