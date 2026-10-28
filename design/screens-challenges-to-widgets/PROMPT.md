# Prompt for Claude Code: pack 2, challenges → widgets (phases 6–11)

Put this folder in the repo at `design/screens-challenges-to-widgets/`, next to `design/screens-06-to-block-focus/`. Start these phases only after phases 0–4 from pack 1 are done; they reuse that pack's tokens, components and services.

Run **one phase per session**. For each session, paste the shared intro below plus that phase only.

---

## Shared intro (paste every time)

You're working in our Expo / React Native app "Untangle". Phases 0–4 are already built, following `design/screens-06-to-block-focus/`.

**Read first:**
1. `design/screens-06-to-block-focus/CODE_STANDARDS.md`: still the rules.
2. `design/screens-06-to-block-focus/SPEC.md` §1–3: the tokens and components that already exist. Reuse them; don't duplicate them.
3. `design/screens-challenges-to-widgets/SPEC.md` and `EDGE_CASES.md`.
4. **Only** the PNGs in `design/screens-challenges-to-widgets/screens/` that this phase lists.
5. `measurements.json` and `source/*.dc.html`, for exact values only. Never port the absolute positioning.

**Rules:**
- Before coding, list the files you'll create or change and the **VERIFY** items this phase depends on. Check each one against the current Apple and Google docs, report what you found, and stop if it contradicts the spec.
- **DECIDE** items are mine. Ask, don't guess.
- No new dependencies without asking me.
- No raw colours, sizes or strings in components.
- Finish with: screenshots next to the design PNGs, a list of anything that doesn't match and why, and test results.

---

## Phase 6 · Challenges core

**Screens:** FDraw, FDrawReveal, FChallenges, OvChallengeDetail (minus the mic), OxSilence, OxDone, FTimeUp.

- `features/challenges/rules.ts`: the daily draw, redraw, check types, the your-word cap, points, the weekly boss and streak freezes. Pure TypeScript with unit tests (including the day boundary and timezone change).
- Components: `ChallengeCard` (with the flip), the challenge list rows, `ResultStats`.
- The silence challenge reuses OB12's face-down sensor service. Don't write a second one.
- Use stub content for the reading text; the real flow is phase 8.

## Phase 7 · Reps and games

**Screens:** R1–R7, GLetter1/2, GTarget1/2, GPairs1/2, GSpan1/2, FTimeUp.

- Build `GameShell`, `GameIntro`, `NumberPad`, `LetterKeyboard` and `AnswerBox` first.
- Then one generic game state machine: `ready → playing → (answer right | answer wrong)* → won | timeUp`, plus `paused` from AppState, plus `dailyDone`. Each game supplies only its content and scoring.
- Implement mental maths fully against R1–R7, then the other four games.
- Puzzle generators are pure functions with tests. Make-the-target puzzles must be solvable (precompute or verify).
- Word and puzzle content ships as bundled JSON.

## Phase 8 · Read aloud and summary

**Screens:** OvChallengeDetail, OvReading, OxSummary.

- **Start with a spike.** Prove on-device speech recognition on one real iPhone and one real Android phone, with no network: `SFSpeechRecognizer` with `requiresOnDeviceRecognition`, and Android `createOnDeviceSpeechRecognizer`. Report the accuracy and latency before you build the UI. If a platform can't do it offline, stop and tell me.
- Word-level fuzzy matching with an 80% pass threshold; key-idea matching by keyword sets. No network, ever.
- Mic-denied and speech-unavailable sheets from EDGE_CASES.
- Bundled public-domain texts by genre (I'll supply the list; use 3 placeholder texts until then).

## Phase 9 · Rewards and evening

**Screens:** FRewards, FRedeem, FReceipt, FLightsOut.

- The points ledger in SQLite (every earn and spend is a row; the balance is a query, never a stored number). Verified %, earned app minutes, the vault, redeem with a 5-second undo.
- `DayGhostStrip`, using the existing `Ghost` component at small size (static, no loop).
- Receipt: on Android a normal view plus share-as-image. On iOS, stub the report view and wait for **DECIDE** on sharing.
- Lights out triggers the bedtime rule through `services/blocking`.

## Phase 10 · Settings and backup

**Screen:** FSettings, plus the missing rows listed in SPEC §Settings.

- Export / import with a versioned schema, zod validation, the replace confirmation, and an automatic export before any import.
- App lock with `expo-local-authentication`; discreet notifications.
- The guides as static content pages.

## Phase 11 · Outside the app (native, pair with me)

**Board:** FWidgets.

- A shared snapshot writer: the app writes `{clarity, mood, doneCount, streak, focus: {endsAt, apps}}` to the App Group / shared prefs on every change.
- iOS:
  - WidgetKit small, medium (interactive, App Intents) and lock-screen widgets
  - an ActivityKit Live Activity plus the Dynamic Island, using system timers
- Android:
  - Glance widgets
  - the foreground-service notification with a chronometer
- Weekly share card rendered to an image.
- Every widget state from SPEC (before onboarding, day 1, blocking off, focus, stale).

---

**Recommended order:** 6 → 7 → 9 → 10, with **8's speech spike done early**, in the same week as the native spike from pack 1. Phase 11 goes with pack 1's phase 5 native work, because they share the App Group plumbing.
