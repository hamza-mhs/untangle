# Untangle handoff · screens 06 → Block & focus

| File | What |
|---|---|
| `PROMPT.md` | Paste into Claude Code, one phase per session |
| `CODE_STANDARDS.md` | Structure, naming, tokens, state, tests |
| `SPEC.md` | Tokens, components, navigation, every screen |
| `EDGE_CASES.md` | Offline, payment, permission and lifecycle states |
| `screens/` | 46 renders at 2× (Home renders are full scroll) |
| `measurements.json` | Per-element geometry, font and colour |
| `source/` | The design files (values only; don't port the layout) |

The screens:

- **Onboarding:** OB06–OB15
- **Home:** HomeB, HomeBFocus, HomeBEvening, HomeBDay1, HomeBOff
- **Block & focus:**
  - FBlock, FRuleEdit
  - FFocusStart, FFocusRun, FEmergency, FFocusDone
  - FShield (Android), FShieldiOS
- **Pricing:** P01–P13 (P04 is the OS sheet, reference only)
- **Edge cases:** E01–E10
