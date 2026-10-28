# Prompt for Claude Code — build onboarding screens 1–5

Put this whole folder (`onboarding-01-05/`) into the repo at `design/onboarding-01-05/`, then paste the prompt below.

---

Build onboarding screens 1–5 of the Untangle app in our Expo / React Native project.

**Read first, in this order:**
1. `design/onboarding-01-05/SPEC.md` — tokens, layout rules and behaviour. This is the source of truth.
2. Look at every image in `design/onboarding-01-05/screens/` — match them visually.
3. `design/onboarding-01-05/measurements.json` — exact sizes, fonts and colours per element if you need a value the spec doesn't give.
4. `design/onboarding-01-05/source/*.dc.html` — the design files, for exact values only. Do **not** copy their absolute positioning; build with flex.
5. `design/onboarding-01-05/splash/` — the splash ghost in both states (SVG) and a looping reference (open it in a browser to see the timing).

**What to build:**
- Add the colour and type tokens from SPEC.md to `src/design/tokens.ts` / `typography.ts` (extend, don't duplicate anything that already exists).
- Reusable components in `src/design/components/`: `OnboardingHeader` (back + progress + counter), `ChoiceRow` (single/multi, accent colour, optional sub-line), `ChoiceChip`, `PrimaryButton` (yellow / white variants, disabled state), `StarField` (drifting, twinkling).
- Screens in `app/(onboarding)/`: `index.tsx` (splash), `screen-time.tsx`, `apps.tsx`, `when.tsx`, `goals.tsx`, wired with expo-router so Start → 2 → 3 → 4 → 5 → (stub for 6).
- An `onboarding` zustand store persisted with MMKV holding the answers; resume at the last unfinished step.
- Haptics through our `lib/haptics` wrapper as SPEC.md describes.

**The splash animation:**
- Recreate the ghost + three wires with `@shopify/react-native-skia`, driven by one Reanimated shared value `progress` (0 = tangled, 1 = untangled) on the 8-second loop from SPEC.md.
- Take the path data for both states from `ghost-tangled.svg` and `ghost-untangled.svg`. Each pair of matching paths has identical command structure, so interpolate them with Skia's path interpolation; fade the gem colour, aura, sparkles, "z z" and dimming layer by `progress`.
- If Skia path interpolation turns out not to fit for some element, tell me and propose the fallback before using a different approach (e.g. Rive). Don't ship a static image silently.
- Stars: a separate Skia layer, translateX loop left→right, opacity twinkle per star.
- With Reduce Motion on: show the untangled state, no loop, stars still.

**Quality bar:**
- Pixel-compare each screen against its PNG on an iPhone 15/16-size simulator (390 pt wide) and fix visible differences in spacing, size or colour. Then check an iPhone SE size and an Android phone; lists scroll, footer stays pinned.
- 60 fps on the splash on a mid-range Android device (profile it; don't animate React state).
- Accessibility roles/states and Dynamic Type as in SPEC.md.
- No new dependencies beyond what's already in the project without asking me.

When done, send me simulator screenshots of all five screens next to the design PNGs, and list anything you couldn't match exactly and why.
