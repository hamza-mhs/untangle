import type { GoalId } from '@/features/onboarding/types';
import { isoWeekKey, parseClock, type DayKey } from '@/lib/time';

import { createRng, hashSeed } from '../reps/rng';
import {
  BOSSES,
  CHALLENGES,
  type ChallengeDef,
  type Difficulty,
  type Verification,
  type WeeklyBoss,
} from './library';

/**
 * Challenge rules (pack 2 SPEC §3): pure functions, no React, unit-tested.
 * DECIDED: points 10 / 15 / 25 by difficulty, +50 for all three, "your word" capped at 15 a day.
 */

export const DRAW_ORDER: readonly Difficulty[] = ['easy', 'medium', 'hard'];
export const POINTS: Record<Difficulty, number> = { easy: 10, medium: 15, hard: 25 };
export const ALL_THREE_BONUS = 50;
export const WORD_DAILY_CAP = 15;
export const REDRAWS_PER_DAY = 1;
export const BOSS_POINTS = 100;
export const MAX_FREEZES = 3;
/** Default morning draw time (OB14 / Settings). Drawing early is allowed; this is the nudge. */
export const DEFAULT_DRAW_TIME = '07:30';

export type DailyDraw = {
  day: DayKey;
  /** Index-aligned with DRAW_ORDER. */
  cards: [string, string, string];
  /** Cards turned over (FDraw → FDrawReveal). */
  flipped: [boolean, boolean, boolean];
  redrawsLeft: number;
  done: string[];
  /** When the user drew (shown as "Drawn at 07:40"). */
  drawnAt: number | null;
};

/** Pool for a difficulty: cards matching the user's goals first, the whole tier as fallback. */
export function poolFor(
  difficulty: Difficulty,
  goals: readonly GoalId[],
  library: readonly ChallengeDef[] = CHALLENGES,
): ChallengeDef[] {
  const tier = library.filter((c) => c.difficulty === difficulty);
  const matching = goals.length ? tier.filter((c) => c.goals.some((g) => goals.includes(g))) : [];
  return matching.length ? matching : tier;
}

/** The morning draw. Deterministic per day, so reopening the app shows the same three. */
export function drawForDay(
  day: DayKey,
  goals: readonly GoalId[] = [],
  library: readonly ChallengeDef[] = CHALLENGES,
): DailyDraw {
  const rng = createRng(hashSeed(`${day}:draw`));
  const cards = DRAW_ORDER.map(
    (d) => rng.pick(poolFor(d, goals, library)).id,
  ) as DailyDraw['cards'];
  return {
    day,
    cards,
    flipped: [false, false, false],
    redrawsLeft: REDRAWS_PER_DAY,
    done: [],
    drawnAt: null,
  };
}

/** Swap one undone card for another of the same difficulty. Unchanged if not allowed. */
export function redraw(
  draw: DailyDraw,
  slot: 0 | 1 | 2,
  goals: readonly GoalId[] = [],
  library: readonly ChallengeDef[] = CHALLENGES,
): DailyDraw {
  const current = draw.cards[slot];
  if (draw.redrawsLeft <= 0 || draw.done.includes(current)) return draw;
  const difficulty = DRAW_ORDER[slot]!;
  const pool = poolFor(difficulty, goals, library).filter((c) => !draw.cards.includes(c.id));
  const fallback = library.filter((c) => c.difficulty === difficulty && !draw.cards.includes(c.id));
  const options = pool.length ? pool : fallback;
  if (options.length === 0) return draw;
  const rng = createRng(hashSeed(`${draw.day}:redraw:${slot}:${draw.redrawsLeft}`));
  const cards = [...draw.cards] as DailyDraw['cards'];
  cards[slot] = rng.pick(options).id;
  return { ...draw, cards, redrawsLeft: draw.redrawsLeft - 1 };
}

export function flip(draw: DailyDraw, slot: 0 | 1 | 2, now: number): DailyDraw {
  if (draw.flipped[slot]) return draw;
  const flipped = [...draw.flipped] as DailyDraw['flipped'];
  flipped[slot] = true;
  return { ...draw, flipped, drawnAt: draw.drawnAt ?? now };
}

export function isFullyFlipped(draw: DailyDraw): boolean {
  return draw.flipped.every(Boolean);
}

export function markDone(draw: DailyDraw, id: string): DailyDraw {
  if (!draw.cards.includes(id) || draw.done.includes(id)) return draw;
  return { ...draw, done: [...draw.done, id] };
}

/** Points for finishing a card. Your-word points stop at the daily cap. */
export function pointsFor(
  def: Pick<ChallengeDef, 'difficulty'> & { verification: Verification },
  wordPointsSoFarToday: number,
): number {
  const base = POINTS[def.difficulty];
  if (def.verification !== 'word') return base;
  return Math.max(0, Math.min(base, WORD_DAILY_CAP - wordPointsSoFarToday));
}

/** +50 the moment the third card is done (once a day). */
export function bonusFor(draw: DailyDraw): number {
  return draw.done.length === draw.cards.length ? ALL_THREE_BONUS : 0;
}

/** Points if all three are done ("50 pts if you do all three" uses the bonus only). */
export function potentialPoints(draw: DailyDraw, library = CHALLENGES): number {
  return draw.cards.reduce((sum, id) => {
    const def = library.find((c) => c.id === id);
    return sum + (def ? POINTS[def.difficulty] : 0);
  }, ALL_THREE_BONUS);
}

/** "% verified" = verified points ÷ all points earned (timed counts as verified). */
export function verifiedPercent(
  entries: readonly { points: number; verification?: Verification | null }[],
): number | null {
  const earned = entries.filter((e) => e.points > 0);
  const total = earned.reduce((s, e) => s + e.points, 0);
  if (total === 0) return null;
  const verified = earned
    .filter((e) => e.verification === 'verified' || e.verification === 'timed')
    .reduce((s, e) => s + e.points, 0);
  return Math.round((verified / total) * 100);
}

/** This week's boss (ISO week, Monday start), deterministic per week. */
export function bossForWeek(now: number, bosses: readonly WeeklyBoss[] = BOSSES): WeeklyBoss {
  const week = isoWeekKey(now);
  return bosses[hashSeed(week) % bosses.length]!;
}

/** Streak freezes are earned from hard challenges and the boss; capped so they stay rare. */
export function freezesAfter(current: number, earned: { hard: number; boss: number }): number {
  return Math.min(MAX_FREEZES, current + earned.hard + earned.boss);
}

/** True from the morning draw time on (the tab shows "Draw at 07:30" before it). */
export function isDrawTime(now: Date, drawTime = DEFAULT_DRAW_TIME): boolean {
  return now.getHours() * 60 + now.getMinutes() >= parseClock(drawTime);
}
