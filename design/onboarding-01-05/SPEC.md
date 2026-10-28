# Onboarding 01–05 · design spec

Source of truth, in this order:
1. **This file** (tokens, layout rules, behaviour).
2. `screens/*.png` — 2× renders of each screen (390×844 pt). Match these visually.
3. `measurements.json` — every element's x/y/w/h, font, colour and radius, measured from the rendered design.
4. `source/*.dc.html` — the design files (HTML with inline styles). Use for exact values only; **never port absolute positioning** — rebuild with flex layout.
5. `splash/*.svg` — the splash ghost + wires in both states and the looping reference.

Where the renders and this file disagree on spacing, **this file wins** (the designs were laid out absolutely and a few gaps drifted; the rules below normalise them).

---

## Tokens

| Token | Value | Use |
|---|---|---|
| `bg` | `#000000` | screen background |
| `surface` | `#151515` | unselected option / chip |
| `track` | `#222222` | progress track |
| `text` | `#FFFFFF` | primary text |
| `textBody` | `#CFCFCF` | splash body copy |
| `textMuted` | `#8C8C8C` | subtitles, counters, footnotes |
| `border` | `#2E2E2E` | back button ring (2 pt) |
| `yellow` | `#E9F21F` | primary CTA (Start) — text on it is black |
| `pink` | `#F79BC9` | screen 2 selection |
| `sky` | `#A9D4FF` | screen 3 selection |
| `peri` | `#6F7EF8` | screen 4 selection |
| `green` | `#24CF6C` | screen 5 selection |
| `onAccent` | `#000000` | text/icons on any coloured fill |

Each question screen has **one accent colour** for its selected state (pink, sky, peri, green). Unselected = `surface` + white text.

**Type:** Inter Tight (500, 600, 700) via `expo-font`. Tabular numerals for counters.

| Style | Size / weight / line-height / tracking |
|---|---|
| `display` (splash title) | 34 / 700 / 37 / −1.0 |
| `title` (question) | 28 / 700 / 31 / −0.84 |
| `body` | 16 / 400 / 22 / 0 |
| `option` | 17 / 600 / 20 / −0.17 |
| `optionSub` | 13 / 600 / 16 / 0 (opacity .75 on accent) |
| `chip` | 16 / 600 / 20 / −0.16 |
| `button` | 17 / 600 / 20 / −0.17 |
| `meta` | 13 / 600 (counter) · 13 / 400 (footnote) |

**Radius:** buttons, options and chips are fully rounded (`height / 2`). On iOS add `borderCurve: 'continuous'`.

---

## Shared layout (screens 2–5)

```
SafeArea (top + bottom)
├─ Header row          height 40, margin-top 10, padding-x 14, gap 14
│   ├─ Back button     40×40, circle, 2pt border #2E2E2E, chevron-left 18pt white
│   ├─ Progress track  flex 1, height 6, radius 3, #222 · fill #FFF, width = step/total
│   └─ Counter "2/15"  width 40, right-aligned, meta, textMuted
├─ Title               margin-top 24, padding-x 22, `title`
├─ Subtitle            margin-top 8, padding-x 24, `body`, textMuted
├─ Options             margin-top 32, padding-x 10, gap 18 (list) / 8 (chip grid)
└─ Footer (pinned)     padding-x 10, padding-bottom 16 above safe area
    └─ Continue        height 56, full width, white bg, black `button` text + arrow-right 18pt
```

- **Option row:** height 52 (56 when it has a sub-line), padding-x 24, label left, check icon (20pt, stroke 2.8, black) right when selected.
- **Chip grid (screen 3):** 2 columns, gap 8, chip height 50, padding-x 20, check 18pt right when selected.
- **Progress:** total = 15 steps. Animate the fill width with a 250 ms ease-out when moving between steps.

## Screen 1 · Splash (`OB01`)

- Full-bleed black. **Stars layer:** top 330 pt, ~18 white dots (r 0.7–1.4, opacity 0.3–0.75) with 4 faint constellation lines (white 8%). The whole layer drifts **left → right**, one screen-width every 120 s, seamlessly tiled. Each star twinkles (opacity loop 3–7 s). Fade the layer out to transparent over its bottom 45%.
- **Ghost + wires scene:** `splash/ghost-tangled.svg` ↔ `splash/ghost-untangled.svg`, 390×560, top −2 pt. Loop 8 s: hold tangled 1 s → ease to untangled (2.6 s, cubic-bezier .5,0,.2,1) → hold 3.5 s → ease back. See `ghost-loop-reference.svg` for timing (open it in a browser).
  - Tangled: slumped & leaning, hood flopped forward, drooping half-shut eyes, arms dragging, wires knotted at its feet, red mood gem, "z z" + sweat drop, body dimmed 35%.
  - Untangled: upright & floating, hood up, happy arc eyes, arms raised, wires lifted into three arcs (pink, sky, yellow) over its head, yellow aura, green gem, sparkles, smaller shadow.
- **Copy block:** title "Your attention is tangled." (`display`, top ~520), body "Let's untangle it. A few minutes a day, and locks that actually hold." (`body`, textBody, 8 pt below).
- **Start:** yellow primary button, 56 pt, label "Start" + arrow. 
- **Footnote:** "No account. Everything stays on this phone." centered, `meta` 400, textMuted, 28 pt below the button.
- No back button, no progress bar on this screen.

## Screen 2 · Screen time (`OB02`)
- Title "How much phone a day?" · Subtitle "A guess is fine. We'll check it against the real number later."
- **Single select**, accent pink. Options: Under 2 hours · 2–4 hours · 4–6 hours · 6–8 hours · 8+ hours · Not sure.
- Selecting an option **auto-advances after 250 ms** (single-select = one tap). Continue stays visible but is only needed if they come back.

## Screen 3 · Apps (`OB03`)
- Title "Which apps pull you in?" · Subtitle "Pick all that apply. These get locked first."
- **Multi select chip grid**, accent sky. Instagram · TikTok · YouTube · X · Reddit · Snapchat · Games · Other.
- Continue disabled (opacity .4) until ≥1 selected. Button sub-label not needed.
- These are labels only — the real app list comes from Apple's FamilyActivityPicker / Android's installed apps later (screen 11).

## Screen 4 · When (`OB04`)
- Title "When does it hit hardest?" · Subtitle "Pick all that apply. We'll schedule locks around these."
- **Multi select list**, accent peri. First thing in the morning · In bed at night · While working or studying · When I'm bored or waiting · When I'm stressed.
- Continue enabled with ≥1.

## Screen 5 · Goals (`OB05`)
- Title "What do you want back?" · Subtitle "Pick up to two. This shapes your challenges."
- **Multi select, max 2**, accent green. Selected rows show a sub-line:
  - Focus for work or study → "Maths, reading, single-task"
  - Better sleep → "Phone down overnight"
  - Time with people → "Phone-free meals, Raw mode"
  - Reading and hobbies → "Read before you scroll, Hobby era"
  - A calmer head → "Silence, breathing"
- Tapping a third option when two are selected: light warning haptic + shake the subtitle; don't deselect anything automatically.

## Behaviour (all five)
- **Haptics** (`lib/haptics`): `select` on every option tap, `tap` on Continue/Start, `warning` on the max-2 limit.
- **Press feedback:** scale 0.97, 120 ms spring; selection colour cross-fades 150 ms.
- **Back:** chevron and Android back go to the previous step, answers kept.
- **State:** answers saved to the onboarding store after each step (resume where they left off if the app is killed).
- **Accessibility:** options are `accessibilityRole="radio"` (screen 2) or `"checkbox"` (3–5) with `accessibilityState.checked`; progress has a label "Step 2 of 15"; respect Reduce Motion (stars still, ghost shows the untangled state without looping); support Dynamic Type up to `maxFontSizeMultiplier` 1.3 for titles.
- **Screen sizes:** designed at 390 pt wide. Lists scroll if they don't fit (iPhone SE); footer button stays pinned.
