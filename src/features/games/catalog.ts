import type { FocusGroup } from '@/design/tokens';

/**
 * The game catalogue. Batch 3.1 ships the hero set; until a game's real board lands, it plays
 * the placeholder round (BATCH-2 "About games in this batch"). Names and copy live in
 * src/i18n/en/games.json under games.list.<id>.
 */

export type GameId =
  | 'stackTower'
  | 'rocketHop'
  | 'laneDash'
  | 'blockFit'
  | 'colourWord'
  | 'middleArrow'
  | 'dontTapRed'
  | 'echo'
  | 'cardPairs'
  | 'breathCount'
  | 'silence'
  | 'urgeSurfing'
  // 3.2a
  | 'swapIt'
  | 'flashCount'
  | 'spotTheOddOne'
  | 'trackTheStars';

export type GameAccent =
  'pink' | 'sky' | 'cobalt' | 'violet' | 'orange' | 'mint' | 'sun' | 'coral' | 'indigo';

export type GameMeta = {
  id: GameId;
  group: FocusGroup;
  /** Typical length in seconds (for "about N min" and the ≤ 45 s quick-game rule). */
  seconds: number;
  calm: boolean;
  accent: GameAccent;
  /** Background glow when it differs from the accent (prototype `glow:`). */
  glow?: GameAccent;
  /** What "New best" compares; null = no best (calm games). */
  best: { stat: string; higher: boolean } | null;
  /** Batch the game shipped in, for the "New" tag (14 days). */
  batch: string;
};

export const GAMES: readonly GameMeta[] = [
  {
    id: 'stackTower',
    group: 'selfControl',
    seconds: 40,
    calm: false,
    accent: 'sun',
    best: { stat: 'floors', higher: true },
    batch: '3.1',
  },
  {
    id: 'rocketHop',
    group: 'selfControl',
    seconds: 40,
    calm: false,
    accent: 'sky',
    best: { stat: 'hops', higher: true },
    batch: '3.1',
  },
  {
    id: 'laneDash',
    group: 'quickDecisions',
    seconds: 30,
    calm: false,
    accent: 'pink',
    best: { stat: 'gems', higher: true },
    batch: '3.1',
  },
  {
    id: 'blockFit',
    group: 'logic',
    seconds: 45,
    calm: false,
    accent: 'sky',
    best: { stat: 'lines', higher: true },
    batch: '3.1',
  },
  {
    id: 'colourWord',
    group: 'attention',
    seconds: 40,
    calm: false,
    accent: 'sky',
    best: { stat: 'right', higher: true },
    batch: '3.1',
  },
  {
    id: 'middleArrow',
    group: 'attention',
    seconds: 40,
    calm: false,
    accent: 'sky',
    best: { stat: 'avgMs', higher: false },
    batch: '3.1',
  },
  {
    id: 'dontTapRed',
    group: 'selfControl',
    seconds: 30,
    calm: false,
    accent: 'sky',
    best: { stat: 'hits', higher: true },
    batch: '3.1',
  },
  {
    id: 'echo',
    group: 'memory',
    seconds: 45,
    calm: false,
    accent: 'pink',
    best: { stat: 'right', higher: true },
    batch: '3.1',
  },
  {
    id: 'cardPairs',
    group: 'memory',
    seconds: 40,
    calm: false,
    accent: 'pink',
    best: { stat: 'moves', higher: false },
    batch: '3.1',
  },
  {
    id: 'breathCount',
    group: 'calm',
    seconds: 90,
    calm: true,
    accent: 'cobalt',
    best: null,
    batch: '3.1',
  },
  {
    id: 'silence',
    group: 'calm',
    seconds: 120,
    calm: true,
    accent: 'violet',
    best: null,
    batch: '3.1',
  },
  {
    id: 'urgeSurfing',
    group: 'selfControl',
    seconds: 75,
    calm: true,
    accent: 'sky',
    best: null,
    batch: '3.1',
  },
  {
    id: 'swapIt',
    group: 'attention',
    seconds: 40,
    calm: false,
    accent: 'indigo',
    glow: 'cobalt',
    best: { stat: 'found', higher: true },
    batch: '3.2',
  },
  {
    id: 'flashCount',
    group: 'attention',
    seconds: 40,
    calm: false,
    accent: 'sun',
    best: { stat: 'right', higher: true },
    batch: '3.2',
  },
  {
    id: 'spotTheOddOne',
    group: 'attention',
    seconds: 30,
    calm: false,
    accent: 'sun',
    best: { stat: 'found', higher: true },
    batch: '3.2',
  },
  {
    id: 'trackTheStars',
    group: 'attention',
    seconds: 45,
    calm: false,
    accent: 'sky',
    glow: 'cobalt',
    best: { stat: 'tracked', higher: true },
    batch: '3.2',
  },
];

const BY_ID = new Map(GAMES.map((g) => [g.id, g]));

export function gameMeta(id: string): GameMeta | undefined {
  return BY_ID.get(id as GameId);
}

export function isGameId(id: string): id is GameId {
  return BY_ID.has(id as GameId);
}

/** Quick games for the urge moment: ≤ 45 s and not Calm or Active (20-phase2 §2, §8). */
export function isQuickGame(g: GameMeta): boolean {
  return g.seconds <= 45 && g.group !== 'calm' && g.group !== 'active' && !g.calm;
}

/** The game the pause screen offers when nothing else fits (30-phase3: Stack tower). */
export const DEFAULT_PAUSE_GAME: GameId = 'stackTower';
