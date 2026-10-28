# Prompt for Claude Code: refactor 01–05, then build 06 → Block & focus

Put this folder in the repo at `design/screens-06-to-block-focus/`. Keep `design/onboarding-01-05/` where it is. Then paste the prompt below. **Run it as separate sessions, one phase per session**: a single prompt for 46 screens will drift.

---

You're working in our Expo / React Native app "Untangle". Onboarding screens 01–05 are already built. Your job is to bring the codebase up to the standards in `design/screens-06-to-block-focus/CODE_STANDARDS.md` and build the remaining screens to the spec.

**Read first, in this order:**
1. `design/screens-06-to-block-focus/CODE_STANDARDS.md`: structure, naming, tokens, state, testing. Non-negotiable.
2. `design/screens-06-to-block-focus/SPEC.md`: tokens, the component catalogue, and every screen with its states.
3. `design/screens-06-to-block-focus/EDGE_CASES.md`: every failure and permission state.
4. Every PNG in `design/screens-06-to-block-focus/screens/`. Match them visually.
5. `measurements.json` and `source/*.dc.html`, for exact values only. Never copy the absolute positioning; build with flex.

**Rules for this whole job:**
- Before writing code in each phase, list the files you'll create or change and any SPEC item marked **VERIFY** that the phase depends on. For each VERIFY item, check the current Apple or Google docs, tell me what you found, and stop if it contradicts the spec.
- Items marked **DECIDE** are mine. Ask, don't guess.
- No new dependencies without asking me first.
- No raw colours, sizes or strings in components. Tokens and i18n only.

**Phase 0 · Foundation and refactor of 01–05 (no visual change)**
- Create `src/design/tokens/*` from SPEC §1, the `Text` component, and the components from SPEC §3 that 01–05 already need (`PrimaryButton`, `OnboardingHeader`, the choice row and chip, `StarField`, `Screen`).
- Move 01–05 onto them, following the folder structure and naming in CODE_STANDARDS. Map `#151515` to `color.bg.raised`.
- Add ESLint `react-native/no-color-literals` and `no-inline-styles`, TS strict flags, Jest and RNTL.
- Done when: screenshots of 01–05 are unchanged against `design/onboarding-01-05/screens/`, lint and types pass, and the component tests pass.

**Phase 1 · Onboarding 06–15**
- Build the screens from SPEC §5, including OB12's sensor states and OB06/OB07's number logic, with unit tests.
- Put the native calls (Screen Time authorization, picker, notifications) behind `services/blocking` and `services/notifications`, with a mock implementation so the flow runs in Expo Go or a simulator without entitlements.
- Include E01 and E02.

**Phase 2 · Home (all five states) plus the shared Home components**
- Build `useHomeState()`, which derives `idle | focus | evening | day1 | off` plus the banner from the stores. Then build each state with fixtures, so I can switch states from a dev menu.
- On iOS, the screen-time and pickups stat cards are a `DeviceActivityReport` view (see SPEC Home "Data sources"). Stub them in Phase 2; we'll do the native part in Phase 5.

**Phase 3 · Block & focus**
- FBlock, FRuleEdit, FFocusStart, FFocusRun, FEmergency, FFocusDone, plus E09 and E10. Use the `focusMachine` discriminated union. Rehydrate on relaunch from `endsAt`.
- Android: FShield as our own full-screen activity, opened by the native service. iOS: just the ShieldConfiguration content (title, subtitle, buttons) wired through the extension target.

**Phase 4 · Pricing**
- RevenueCat with offerings, the paywall state machine (`loading | ready | offline | error`), the purchase result mapping (cancelled → nothing, failed → E05, pending → E06), restore (E07/E08), and P01–P13 except P04 (the OS sheet).
- Reverse-trial logic in `features/paywall/trial.ts`, with tests for days 0, 5, 7 and 8, and for timezone changes.

**Phase 5 · Native blocking** (separate session; I'll pair on it)

**Quality bar for every phase:**
- Pixel-compare each screen with its PNG on a 390-pt simulator, then check 375 and 430.
- Check every state and edge case listed for it.
- 60 fps on animations, measured on a mid-range Android device.
- Accessibility labels, roles and Reduce Motion handled.
- Finish each phase with: simulator screenshots next to the design PNGs, a list of anything you couldn't match and why, and the test results.
