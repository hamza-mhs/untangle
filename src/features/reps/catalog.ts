import type { IconName } from '@/design/components';

/**
 * The six attention reps (FChallenges grid). Each game has ONE colour (pack 2 SPEC §1): its
 * Start button, chips, lives and highlights all use it. Image-based games were dropped on purpose.
 */
export const REP_IDS = ['maths', 'letter', 'target', 'pairs', 'span', 'read'] as const;
export type RepId = (typeof REP_IDS)[number];

export type GameColor = 'number' | 'word' | 'memory' | 'read';

export type RepDef = {
  id: RepId;
  icon: IconName;
  color: GameColor;
  /** Time box for one round. */
  durationSec: number;
  /** Points for a round finished inside the time. */
  points: number;
  /** Earned app minutes for a won round. */
  minutes: number;
};

export const REPS: Record<RepId, RepDef> = {
  maths: { id: 'maths', icon: 'maths', color: 'number', durationSec: 120, points: 20, minutes: 5 },
  letter: { id: 'letter', icon: 'letters', color: 'word', durationSec: 90, points: 10, minutes: 5 },
  target: {
    id: 'target',
    icon: 'target',
    color: 'number',
    durationSec: 120,
    points: 20,
    minutes: 5,
  },
  pairs: { id: 'pairs', icon: 'pairs', color: 'memory', durationSec: 180, points: 15, minutes: 5 },
  span: { id: 'span', icon: 'span', color: 'memory', durationSec: 60, points: 15, minutes: 5 },
  read: { id: 'read', icon: 'reading', color: 'read', durationSec: 240, points: 15, minutes: 5 },
};

/** R7 "Try {other game} instead": the next rep not played today. */
export function otherRep(current: RepId, playedToday: readonly RepId[]): RepId | null {
  return REP_IDS.find((id) => id !== current && id !== 'read' && !playedToday.includes(id)) ?? null;
}
