import type { SoundId } from '@/lib/sound';
import type { ComponentType } from 'react';

import type { GameClock } from './clock';

/** What a round hands back (BATCH-3.1 §A.2.1). Calm games omit stars and give a `line`. */
export type RoundResult = {
  title: string;
  stars?: 0 | 1 | 2 | 3;
  /** Ignored once the round has called `addScore`: the HUD total is the result. */
  score?: number;
  stats: string[];
  line?: string;
  /** What "New best" compares (higher or lower is better per game). */
  best?: { value: number; label: string };
};

export type Timer = {
  /** Milliseconds left. */
  left: () => number;
  done: () => boolean;
};

export type HintTone = 'neutral' | 'good' | 'bad';

export type Fx = {
  /** Expanding ring at (x, y) in board coordinates. */
  ring: (x: number, y: number, color: string, size?: number) => void;
  burst: (x: number, y: number, color: string, n?: number) => void;
  float: (x: number, y: number, text: string, color?: string) => void;
  /** Ring + burst + "+pts" at a point. */
  hit: (x: number, y: number, color: string, pts?: number) => void;
  /** Board shake (red flash with Reduce motion) + bad haptic. */
  oops: () => void;
  toast: (text: string, color?: string) => void;
};

/** Engine services for a round. Every wait is pause-aware and aborts when the round ends. */
export type GameApi = {
  clock: GameClock;
  /** Starts the round timer (drives the HUD ring and bar). */
  timer: (totalSec: number) => Timer;
  wait: (ms: number) => Promise<void>;
  setRound: (label: string) => void;
  hint: (text: string, tone?: HintTone) => void;
  addScore: (n: number) => void;
  /** Streak pill value (hot at ≥ 3). */
  combo: (n: number) => void;
  /** Shows n hearts; returns how many are left after each `lose`. */
  lives: (n: number) => { lose: () => number };
  fx: Fx;
  /** Dims the background during memorise phases. */
  quiet: (on: boolean) => void;
  haptic: (kind: 'tap' | 'good' | 'bad' | 'go') => void;
  /** Plays a sound (muted by Settings › Sound and silent mode). `fx.hit` and `fx.oops` already play good / bad. */
  sound: (id: SoundId) => void;
  finish: (result: RoundResult) => void;
  /** Board size, for rounds that lay out by width. */
  board: { width: number; height: number };
  reducedMotion: boolean;
};

export type RoundProps = { api: GameApi; seed: number };

export type GameDefinition = {
  Round: ComponentType<RoundProps>;
  /** Background pattern (§A.2.6). */
  background: 'grid' | 'dots' | 'persp';
  /** The calm games' settle line instead of the countdown. */
  settle?: string;
};
