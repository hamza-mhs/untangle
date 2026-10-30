import { randInt, rng, shuffle } from '@/lib/rng';

export const BEEP_TRIALS = 16;
export const BEEP_STOPS = 4;
export const BEEP_SECONDS = 40;
/** How long a go trial waits for the tap before it counts as late. */
export const GO_WINDOW_MS = 1100;
/** Holding still this long on a red flash counts as a stop held (prototype 900 ms). */
export const HOLD_MS = 900;
export const GO_POINTS = 10;
export const HOLD_POINTS = 20;

export type BeepTrial = {
  dir: 'left' | 'right';
  stop: boolean;
  /** Stop-signal delay: the red flash comes this long after the arrow (prototype 120–220 ms). */
  delayMs: number;
};

/**
 * 16 trials, 4 of them stops. Stops are never the first trial and never back to back, so the
 * brake stays a surprise but the round never opens with one.
 */
export function beepTrials(seed: number): BeepTrial[] {
  const rand = rng(seed);
  // Choose stop slots among 1..15 with no two adjacent.
  let slots: number[] = [];
  for (let tries = 0; tries < 200; tries++) {
    const pick = shuffle(
      Array.from({ length: BEEP_TRIALS - 1 }, (_, i) => i + 1),
      rand,
    )
      .slice(0, BEEP_STOPS)
      .sort((a, b) => a - b);
    if (pick.every((s, i) => i === 0 || s - pick[i - 1]! > 1)) {
      slots = pick;
      break;
    }
  }
  if (slots.length === 0) slots = [3, 7, 11, 15];
  return Array.from({ length: BEEP_TRIALS }, (_, i) => ({
    dir: rand() < 0.5 ? 'left' : 'right',
    stop: slots.includes(i),
    delayMs: 120 + randInt(rand, 101),
  }));
}

export function beepStars(fast: number, held: number, slips: number): 1 | 2 | 3 {
  return slips === 0 && held > 0 ? 3 : fast >= 8 ? 2 : 1;
}
