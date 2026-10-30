# FIX — Visual fidelity: glows, backgrounds and animations

**Do this before Batch 3.2.** The app's glows look like hard concentric ovals and almost
nothing moves, while the HTML prototypes look smooth and alive. This file explains why and
exactly how to fix it.

## Why it happened (diagnosis of the current code)

| Problem you see | Cause in the code |
|---|---|
| Glows are **tall ovals**, not soft circles | `Glow.tsx` and `engine/Background.tsx` draw into an SVG with `viewBox="0 0 100 200"` and `preserveAspectRatio="none"`, so every circle is stretched to the screen's shape. |
| Glows show **visible rings / bands** | `react-native-svg` radial gradients on Android are drawn in 8-bit colour with no dithering. A very dark, low-opacity gradient spread over a large area only has a handful of colour steps, so each step shows as a ring. Browsers dither gradients and the prototype also uses blur filters, which hide the steps. |
| Glows are **too strong** | Game background glow alpha is `0.16`; the prototype uses `0.07`, with a 3-stop falloff (0.07 → 0.022 at 50% → 0). Onboarding glows are similarly over-bright, and some screens draw two glows (red + violet) where the prototype draws one. |
| **Nothing moves** | The game background was written as "static (no render loop)" on purpose, and the onboarding illustrations were drawn as static SVG. The prototype animates: the perspective floor scrolls, the dot field ripples, glows pulse, stars drift, charts draw in, bars grow, the phone slides and the pause wall rises, the urge wave moves. |
| Gear button on every screen | Dev-menu shortcut rendered in all builds. |

It isn't a file-format problem. It's a rendering-technique problem: the browser gave the
prototype GPU blur, dithered gradients, canvas animation and CSS keyframes for free, and the
port replaced them with static SVG.

## The fix

### F1 · One glow primitive, done properly (Skia)

Rebuild `src/design/components/Glow` on `@shopify/react-native-skia` (already installed):

- Draw in **real pixel coordinates** (use the component's measured width/height). Never stretch
  a viewBox. A glow is a circle unless an ellipse is explicitly asked for.
- `RadialGradient` with **at least 3 stops** matching the prototype falloff, e.g.
  `[color@a, color@a*0.32 at 0.5, transparent at 1]`.
- **Kill banding:** enable dithering on the paint if react-native-skia supports it in our
  version (check the docs for `dither` on `Paint` — don't assume), **and** overlay a very
  subtle noise layer (Skia `Shader` with fractal noise, or a tiny tiling noise PNG at 2–3%
  opacity). The noise is what makes it look smooth on every phone.
- Optional soft edge: `BlurMask` (style `normal`) for the "box-shadow 120 px" look.
- Props: `color`, `alpha`, `radius`, `cx`, `cy`, `pulse?: { min, max, periodMs }`.
- Pulse animation via a Reanimated shared value driving the Skia uniform (UI thread, no JS per
  frame). Respect Reduce motion (no pulse).
- Replace **every** glow in `design/illustrations/*`, onboarding screens, pause screens, paywall
  and the game result screen with this component. Use the prototype's colour and alpha for each
  (search the prototype HTML for `glow:` and `box-shadow … rgba(` near that screen). One glow per
  screen unless the prototype has two.

### F2 · Game background = the prototype's canvas, ported to Skia

`engine/Background.tsx` must reproduce `BG(cv)` from
`design/prototype/untangle-games-prototype.html` (search for `function BG(`) — read it fully:

- Base `#020204`; glow radial gradient centred at (W/2, H·0.5), radius `max(W,H)·0.55`,
  stops `rgba(g,0.07)` → `rgba(g,0.0224)` at 0.5 → 0. Line colour = glow mixed 55% with white.
- **grid:** cell `round(W/9)`, lines alpha `0.026·1.6`, vertically faded (transparent at the
  top 0–28% and bottom 70–100%).
- **persp:** horizon at `H·0.32`, 21 rays from the centre, 13 horizontal lines that **scroll
  toward the viewer** (`offset = (t·0.16) % 1`, spacing `z²`), each faded by distance.
- **dots:** grid of dots `round(W/13)` apart with a **ripple** that expands from the centre every
  5.5 s, brightening dots as it passes.
- Plus the 2 slow pulses and the moving segment highlight (`pulses: 2, pa: 0.26, seg: 0.12`) as
  in the source.
- `quiet` fades lines to 30% over ~0.4 s and stops the ripple.
- Draw the static layer once into a Skia `Picture`/offscreen image; animate only the moving
  parts with `useClock()` / shared values. Pause the clock when the game is paused or the app is
  in background. Reduce motion → static.
- Render at device pixel density (no blurry upscaling).
- Target: no dropped frames on the emulator profiler; verify on a real phone later.

### F3 · Onboarding animations

For every onboarding screen, open `design/prototype/untangle-onboarding-v10.html`, find the
screen's object (e.g. `heroA`, `hoursScreen`, the `Studying` screen) and port its `run:` function
and CSS transitions to Reanimated. At minimum:

| Screen | Motion to port |
|---|---|
| Welcome 1 | Phone slides in and tilts to −6°; the violet pause wall rises from the bottom (0.6 s, `cubic-bezier(.3,1.15,.4,1)`); the bright edge line on the wall glows |
| Welcome 2 / 3 | Game tiles pop in staggered; FOCUS letters drop in; focus line draws |
| Studying | Stars drift slowly; centre orb breathes; bar fills over 2.4 s, turns green, screen fades out |
| N days of your year | 365-dot grid fills red row by row (0.9 s) |
| Problem 1 | Bars grow from 0 (480 ms, 120 ms stagger), arrow and −69% fade in after |
| Problem 2 | Notification drops in on the laptop doc, phone stack slides up, 20-min chip ticks |
| Problem 3 | Fog cloud bobs, rain falls, signs segments fill |
| Hours back | Both lines **draw** left → right (path trim), labels pop at the end |
| Moment of pause | Pause card slides up over the app grid |
| Watch your focus grow | Bars rise week by week |
| You're all set | Ticks animate in (150 ms stagger) |

Use Skia `Path` with `start/end` trim (or SVG `strokeDashoffset` via Reanimated) for line draws;
`withTiming`/`withSpring` for entrances; `withRepeat` for idle loops. Every loop stops when the
screen is not focused. Reduce motion → final state, no movement.

### F4 · Calm games and pause screens

- **Urge surfing:** the wave is a moving sine-surface (Skia path updated by a shared value),
  not a static rectangle; it rises and falls over the 75 s with the text prompts timed as in the
  prototype (`_g2games.js`, Urge surfing). Remove the oval glow stack behind it; use one F1 glow.
- **Breath count / Take a breath:** the orb grows 4 s and shrinks 6 s smoothly with a soft F1
  glow that scales with it.
- **Silence:** near-black, one very faint breathing glow (alpha ≤ 0.05).

### F5 · Dev gear button

Render the dev-menu shortcut only when `__DEV__` is true **and** a dev setting "Show dev button"
is on (default off). Never in preview/production builds.

## Acceptance

- [ ] Side-by-side screenshots (app vs `design/screens/...`) for: Welcome 1, Studying, Problem 1,
      Hours back, Urge surfing, and one game per background type (grid: Colour word, persp:
      Stack tower, dots: Card pairs). No visible banding or oval rings at 100% zoom.
- [ ] Screen recordings (emulator is fine) showing each animation in F3/F4 and the moving game
      backgrounds.
- [ ] Reduce motion on: everything static, nothing broken.
- [ ] No JS-thread animation loops (check with the React Native perf monitor; JS FPS stays ~60
      while backgrounds animate).
- [ ] `npm run check` passes; commit `fix: visual fidelity (skia glows, animated backgrounds, onboarding motion)`.
