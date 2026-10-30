# Prompt: visual fix + remaining 47 games

Paste everything inside the box into Claude Code (opened in `C:\Work\Hamza Projects\setup`).

```
We are continuing Untangle v1. Batches 1, 2 and 3.1 (engine + 12 games) are built. Now we do,
in this exact order:

  STEP 1  Housekeeping          docs/plan/BATCH-3.2-games-daily-core.md  → sub-batch 3.2.0
  STEP 2  Visual fidelity fix   docs/plan/FIX-visual-fidelity.md          → F1 … F5
  STEP 3  Daily core games      docs/plan/BATCH-3.2-games-daily-core.md  → 3.2a … 3.2e (14 games)
  STEP 4  Puzzles & words       docs/plan/BATCH-3.3-games-puzzles-words.md → 3.3.0 … 3.3e (14 games)
  STEP 5  Variety               docs/plan/BATCH-3.4-games-variety.md      → 3.4a … 3.4e (15 games)
  STEP 6  Device features       docs/plan/BATCH-3.5-games-device-features.md → 3.5.0 … 3.5d (4 games)
  STEP 7  Polish                docs/plan/BATCH-3.6-games-polish.md       → 3.6a … 3.6e

## Read first (no code yet)
docs/plan/README.md (rules), docs/plan/PROGRESS.md (what exists and the 3.1 deviations),
docs/plan/FIX-visual-fidelity.md, docs/plan/BATCH-3.2-games-daily-core.md, and the engine in
src/features/games/engine/ (types.ts is the GameApi contract). Skim BATCH-3.3/3.4/3.5/3.6.
Then reply with: a short plan for STEP 1 and STEP 2, the questions you need me to answer
(git name/email, anything unclear), and risks. Wait for my "go".

## How we work
- One sub-batch at a time. Post a short plan before coding, report at the end, then wait for my
  "go" — EXCEPT inside STEP 3, 4 and 5 you may continue through game sub-batches on your own
  as long as everything passes; stop at the end of each STEP and whenever something is unclear.
- Report after each sub-batch: done / not done, tests, the acceptance list ticked with evidence,
  what I must check on my phone, and the commit hash.
- Commit after every sub-batch (git must work after STEP 1 — verify with `git log`).
  Update docs/plan/PROGRESS.md after every sub-batch.
- If something is unclear, impossible on Android, or the spec conflicts with the code: stop and
  ask. Never invent APIs, props or config options — check the docs for the installed versions.

## Visual rules (the reason for STEP 2 — apply to every game afterwards too)
- The HTML prototypes are the visual and behavioural source of truth. Before building any
  screen, game or effect, open the prototype, read the exact values (colours, alphas, sizes,
  timings, easing) and use them. Show me those values in your plan.
- Glows, gradients, backgrounds and FX use @shopify/react-native-skia, drawn in real pixel
  coordinates. Never stretch an SVG viewBox (no preserveAspectRatio="none" for art). No stacked
  semi-transparent shapes to fake blur. Gradients get ≥3 stops plus dithering/noise so there is
  no banding.
- Use the shared Glow component (F1) and the Skia GameBackground (F2) everywhere; never write a
  one-off glow.
- Motion is part of the design: port the prototype's animations with Reanimated/Skia on the UI
  thread, stop loops off-screen, honour Reduce motion.
- Proof for visual work = side-by-side screenshots (app vs design/screens/…) and short screen
  recordings. No banding, no oval rings, glow strength matching the prototype.

## Game rules (STEP 3–7)
- One folder per game: src/features/games/games/<gameId>/ (index.ts, Round.tsx, logic.ts,
  __tests__/logic.test.ts, content.json if needed). Shared parts in src/features/games/kit/.
  Lazy registration in registry.ts. Use the existing GameApi; don't change the contract
  without asking.
- Port each game from design/prototype/untangle-games-prototype.html + its source file in
  design/prototype/games/ (named in the batch file). Keep the prototype's top star thresholds,
  drop "+XP", replace demo text with real values.
- Every game: generator tests over 1,000 seeds, plays start → result on the emulator, best and
  results saved, quit saves an incomplete round, haptics + sounds, Reduce motion path, TalkBack
  labels, compared against design/screens/games/<gameId>--playing.png.
- Content (3.3.0 / 3.4c): generated at build time by tools/content, licence-safe word list,
  hand-written packs marked reviewed:false until I review them. Nothing downloaded at runtime.
- 3.4d: ask me before merging Tiny dash into Lane dash. 3.5.0: ask me the Phone away and Read
  aloud questions before writing any 3.5 code.

## Hard rules (unchanged)
Android only · offline · no backend/analytics/notifications/widgets · never edit android/ by
hand · `npx expo install` for packages · design tokens only (no hex/raw sizes in features) ·
all text in i18n · thin routes · `npm run check` must pass · never delete design/screens,
design/prototype or docs/.

Start now: read, then reply with the STEP 1 + STEP 2 plan and your questions.
```

## Short follow-ups

- `go` — continue with the next sub-batch.
- `Show me side-by-side screenshots for Welcome 1, Studying and Stack tower against the designs.`
- `Pause. List every game built so far with its test count and anything still missing.`
- `I reviewed the Category clusters pack — set reviewed: true for items 1–80, rewrite the rest.`
