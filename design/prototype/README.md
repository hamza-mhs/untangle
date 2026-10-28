# Prototypes (read-only reference)

Open the `.html` files in a desktop browser. They are self-contained.

- `untangle-onboarding-v10.html` — all onboarding screens (Phase 1).
- `untangle-app-prototype.html` — every non-game screen, Home option C1 is the chosen one (Phase 2). Note: its lock flow (kind → apps → sites → schedule → strictness → name) is **superseded** by the 3-step flow in `docs/spec/20-phase2-core-app.md` §6.
- `untangle-games-prototype.html` — all 59 games; the toggle at the top switches every phone between Intro and Game (Phase 3).
- `games/` — the game engine (`_g2.js`, `_g2.css`) and per-game source (`_g2games.js`, `_g2b1–4.js`, `_g2live.js`). This is the rule book for game logic, scoring and timing.

Do not import these into the app. Port the logic.
