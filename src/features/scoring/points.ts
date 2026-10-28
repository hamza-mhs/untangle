import type { LedgerRow } from '@/storage/ledgerRepo';

import type { ChallengeDef, Difficulty } from '../challenges/library';
import { pointsFor } from '../challenges/rules';

/**
 * Points and earned app minutes. Points per difficulty and the your-word cap live in
 * challenges/rules.ts (DECIDED 10 / 15 / 25, cap 15 a day).
 */

/** Minutes of app time earned for Earn rules. Only verified/timed actions earn minutes. */
export const EARNED_MINUTES: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 15 };

export type LedgerEntry = LedgerRow;

export function challengeReward(
  c: Pick<ChallengeDef, 'difficulty' | 'verification'>,
  wordPointsSoFarToday: number,
): { points: number; minutes: number } {
  const points = pointsFor(c, wordPointsSoFarToday);
  const minutes = c.verification === 'word' ? 0 : EARNED_MINUTES[c.difficulty];
  return { points, minutes };
}

export function wordPointsOnDay(ledger: readonly LedgerEntry[], day: string): number {
  return ledger
    .filter((e) => e.day === day && e.kind === 'challenge' && e.verification === 'word')
    .reduce((sum, e) => sum + e.points, 0);
}

export function balance(ledger: readonly LedgerEntry[]): { points: number; minutes: number } {
  return ledger.reduce(
    (acc, e) => ({ points: acc.points + e.points, minutes: acc.minutes + e.minutes }),
    { points: 0, minutes: 0 },
  );
}
