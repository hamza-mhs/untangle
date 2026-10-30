/**
 * The app's icon set, drawn on a 24 × 24 grid. Taken from the prototypes'
 * (design/prototype/untangle-app-prototype.html, `const I` and the tab bar) so the app matches
 * the designs; extra glyphs follow the same 2 px round-cap style. Replace or extend from Figma
 * "Components · Icons" when it is available.
 *
 * Every shape is drawn in the icon's one colour: `stroke` shapes as outlines, `fill` shapes solid.
 */
export type GlyphShape =
  | { kind: 'path'; d: string; fill?: true; width?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill?: true; width?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: true; width?: number };

const p = (d: string, width?: number): GlyphShape => ({ kind: 'path', d, ...(width ? { width } : {}) });
const pf = (d: string): GlyphShape => ({ kind: 'path', d, fill: true });

export const glyphs = {
  chevronLeft: [p('M15 5l-7 7 7 7', 2.2)],
  chevronRight: [p('M9 5l7 7-7 7', 2.4)],
  chevronDown: [p('M5 9l7 7 7-7', 2.2)],
  arrowRight: [p('M5 12h14M13 6l6 6-6 6', 2.2)],
  close: [p('M6 6l12 12M18 6L6 18', 2.2)],
  check: [p('M5 12.5l4.5 4.5L19 7.5', 3)],
  plus: [p('M12 5v14M5 12h14', 2.2)],
  minus: [p('M5 12h14', 2.2)],
  lock: [
    { kind: 'rect', x: 5, y: 11, w: 14, h: 10, rx: 2.5, fill: true },
    p('M8 11V8a4 4 0 0 1 8 0v3', 2.6),
  ],
  lockOutline: [{ kind: 'rect', x: 5, y: 10.5, w: 14, h: 10, rx: 2.5 }, p('M8 10.5V8a4 4 0 0 1 8 0v2.5')],
  settings: [
    { kind: 'circle', cx: 12, cy: 12, r: 3.2 },
    p('M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7'),
  ],
  play: [pf('M7 4.5v15l12.5-7.5z')],
  search: [{ kind: 'circle', cx: 11, cy: 11, r: 6.5, width: 2.2 }, p('M16 16l4 4', 2.2)],
  globe: [
    { kind: 'circle', cx: 12, cy: 12, r: 9, width: 1.8 },
    p('M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18', 1.6),
  ],
  flame: [pf('M12 2.5c1 4 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-3 1.6-4.4 2.6-6 .4 2 1.4 3 2.4 3.2C11 8 11.2 5 12 2.5z')],
  bolt: [pf('M13 2.5L5 13.5h6l-1 8 8-11h-6z')],
  wind: [p('M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7')],
  sun: [
    { kind: 'circle', cx: 12, cy: 12, r: 4, fill: true },
    p('M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8'),
  ],
  shield: [p('M12 2.8l7.5 3v6c0 4.6-3.2 8.2-7.5 9.4-4.3-1.2-7.5-4.8-7.5-9.4v-6z')],
  bell: [p('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0')],
  key: [{ kind: 'circle', cx: 8, cy: 15, r: 4 }, p('M11 12l8-8M16 7l2.5 2.5')],
  card: [{ kind: 'rect', x: 3, y: 5.5, w: 18, h: 13, rx: 3 }, p('M3 10h18')],
  game: [
    { kind: 'rect', x: 2.5, y: 7, w: 19, h: 11, rx: 5.5 },
    p('M7.5 10.5v4M5.5 12.5h4'),
    { kind: 'circle', cx: 16, cy: 11, r: 1.2, fill: true },
    { kind: 'circle', cx: 18, cy: 13.8, r: 1.2, fill: true },
  ],
  speaker: [pf('M4 9.5h3.5L12 5.5v13l-4.5-4H4z'), p('M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11')],
  eye: [
    p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z'),
    { kind: 'circle', cx: 12, cy: 12, r: 3, fill: true },
  ],
  help: [{ kind: 'circle', cx: 12, cy: 12, r: 9 }, p('M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.8v.2')],
  info: [{ kind: 'circle', cx: 12, cy: 12, r: 9 }, p('M12 11v5.5M12 7.6v.2')],
  warning: [p('M12 3.5l9.5 16.5h-19z'), p('M12 10v4.5M12 17.4v.2')],
  doc: [p('M6 3h8l4 4v14H6z'), p('M9 12h6M9 16h6')],
  trash: [p('M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13.5h9l1-13.5')],
  calendar: [{ kind: 'rect', x: 3.5, y: 5, w: 17, h: 15.5, rx: 3 }, p('M3.5 10h17M8 3v4M16 3v4')],
  apps: [
    { kind: 'rect', x: 3.5, y: 3.5, w: 7, h: 7, rx: 2, fill: true },
    { kind: 'rect', x: 13.5, y: 3.5, w: 7, h: 7, rx: 2, fill: true },
    { kind: 'rect', x: 3.5, y: 13.5, w: 7, h: 7, rx: 2, fill: true },
    { kind: 'rect', x: 13.5, y: 13.5, w: 7, h: 7, rx: 2, fill: true },
  ],
  exit: [p('M14 3.5H6v17h8M10 12h10M17 8.5l3.5 3.5-3.5 3.5')],
  battery: [{ kind: 'rect', x: 3, y: 7, w: 16, h: 10, rx: 2.5 }, p('M21.5 10.5v3'), { kind: 'rect', x: 5.5, y: 9.5, w: 8, h: 5, rx: 1, fill: true }],
  chart: [p('M5 20V12M12 20V5M19 20v-5')],
  flag: [p('M6 21V4M6 4.5h11l-2.5 4 2.5 4H6')],
  timer: [{ kind: 'circle', cx: 12, cy: 13.5, r: 7.5 }, p('M12 13.5V9.5M9.5 2.8h5')],
  /** Tab bar (prototype `tabbar`). */
  tabToday: [p('M4 10.5L12 4l8 6.5V20h-5.5v-6h-5v6H4z')],
  tabGames: [
    { kind: 'rect', x: 4, y: 4, w: 7, h: 7, rx: 2 },
    { kind: 'rect', x: 13, y: 4, w: 7, h: 7, rx: 2 },
    { kind: 'rect', x: 4, y: 13, w: 7, h: 7, rx: 2 },
    { kind: 'rect', x: 13, y: 13, w: 7, h: 7, rx: 2 },
  ],
  tabProgress: [p('M5 20V12M12 20V5M19 20v-5')],
  tabBlock: [{ kind: 'rect', x: 5, y: 10.5, w: 14, h: 10, rx: 2.5 }, p('M8 10.5V8a4 4 0 0 1 8 0v2.5')],
} as const satisfies Record<string, readonly GlyphShape[]>;

export type IconName = keyof typeof glyphs;
export const ICON_NAMES = Object.keys(glyphs) as IconName[];
