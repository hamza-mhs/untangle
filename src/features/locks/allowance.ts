import type { TargetCounters } from '@/native';

import type { Lock, Strictness } from './types';

/**
 * Lock allowance rules (20-phase2-core-app §6.1, §6.4, §6.7). Pure: the screens render what
 * these return.
 */

export const MINUTES_MIN = 5;
export const MINUTES_MAX = 240;
export const MINUTES_STEP = 5;
export const OPENS_MIN = 1;
export const OPENS_MAX = 50;

/** Time chips on step 3. 0 = Block all day, null = No time limit. */
export const TIME_CHOICES = [0, 15, 30, 45, 60] as const;
/** Open chips on step 3. null = No limit. */
export const OPEN_CHOICES = [3, 5, 10] as const;
export const DEFAULT_MINUTES = 30;

export type AllowanceDraft = { dailyMinutes: number | null; dailyOpens: number | null };

export function clampMinutes(m: number): number {
  const stepped = Math.round(m / MINUTES_STEP) * MINUTES_STEP;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, stepped));
}

export function clampOpens(n: number): number {
  return Math.min(OPENS_MAX, Math.max(OPENS_MIN, Math.round(n)));
}

/** A lock must limit something (§6.1). */
export function hasLimit(a: AllowanceDraft): boolean {
  return a.dailyMinutes !== null || a.dailyOpens !== null;
}

/** "Block all day" hides the opens question and clears it. */
export function setMinutes(a: AllowanceDraft, minutes: number | null): AllowanceDraft {
  return minutes === 0 ? { dailyMinutes: 0, dailyOpens: null } : { ...a, dailyMinutes: minutes };
}

export type SummaryKey =
  | { key: 'allDay' }
  | { key: 'minutes'; minutes: number }
  | { key: 'opens'; opens: number }
  | { key: 'both'; minutes: number; opens: number }
  | { key: 'none' };

/** Which summary sentence step 3 shows. */
export function summaryOf(a: AllowanceDraft): SummaryKey {
  if (a.dailyMinutes === 0) return { key: 'allDay' };
  if (a.dailyMinutes !== null && a.dailyOpens !== null)
    return { key: 'both', minutes: a.dailyMinutes, opens: a.dailyOpens };
  if (a.dailyMinutes !== null) return { key: 'minutes', minutes: a.dailyMinutes };
  if (a.dailyOpens !== null) return { key: 'opens', opens: a.dailyOpens };
  return { key: 'none' };
}

const ZERO: TargetCounters = { usedMs: 0, opens: 0, unlocksUsed: 0 };

/** Row state on the Block tab (§6.6). */
export type LockStatus =
  | { kind: 'off' }
  | { kind: 'notInstalled' }
  | { kind: 'allDay' }
  | { kind: 'over' }
  | {
      kind: 'allowed';
      usedMin: number;
      minutes: number | null;
      opens: number;
      maxOpens: number | null;
    };

export function lockStatus(
  lock: Lock,
  counters: TargetCounters | undefined,
  installed: boolean,
  now = Date.now(),
  unlockUntil: number | null = null,
): LockStatus {
  if (!lock.enabled) return { kind: 'off' };
  if (lock.target.kind === 'app' && !installed) return { kind: 'notInstalled' };
  if (lock.dailyMinutes === 0) return { kind: 'allDay' };
  const c = counters ?? ZERO;
  if (isOverLimit(lock, c) && !(unlockUntil !== null && unlockUntil > now)) return { kind: 'over' };
  return {
    kind: 'allowed',
    usedMin: Math.floor(c.usedMs / 60_000),
    minutes: lock.dailyMinutes,
    opens: c.opens,
    maxOpens: lock.dailyOpens,
  };
}

/** Over today's allowance (time used up or more opens than allowed). */
export function isOverLimit(
  lock: Pick<Lock, 'dailyMinutes' | 'dailyOpens'>,
  c: TargetCounters,
): boolean {
  if (lock.dailyMinutes === 0) return true;
  if (lock.dailyOpens !== null && c.opens > lock.dailyOpens) return true;
  if (lock.dailyMinutes !== null && c.usedMs >= lock.dailyMinutes * 60_000) return true;
  return false;
}

/** Fraction of the allowance used, for rings (0–1). Time wins over opens when both apply. */
export function usedFraction(
  lock: Pick<Lock, 'dailyMinutes' | 'dailyOpens'>,
  c: TargetCounters | undefined,
): number {
  const x = c ?? ZERO;
  if (lock.dailyMinutes === 0) return 1;
  const f: number[] = [];
  if (lock.dailyMinutes !== null) f.push(x.usedMs / (lock.dailyMinutes * 60_000));
  if (lock.dailyOpens !== null) f.push(x.opens / lock.dailyOpens);
  return Math.min(1, Math.max(0, ...f, 0));
}

const STRICT_ORDER: Record<Strictness, number> = { gentle: 0, firm: 1, locked: 2 };

export type LockChange =
  | { kind: 'disable' }
  | { kind: 'delete' }
  | { kind: 'allowance'; next: AllowanceDraft }
  | { kind: 'strictness'; next: Strictness }
  | { kind: 'enable' };

/**
 * Loosening rule (§6.7): turning off, deleting, raising the allowance or lowering strictness
 * while the lock is blocking right now needs a game first. Tightening is always instant.
 */
export function isLoosening(lock: Lock, change: LockChange): boolean {
  switch (change.kind) {
    case 'disable':
    case 'delete':
      return lock.enabled;
    case 'enable':
      return false;
    case 'strictness':
      return STRICT_ORDER[change.next] < STRICT_ORDER[lock.strictness];
    case 'allowance':
      return raisesAllowance(lock, change.next);
  }
}

function looser(a: number | null, b: number | null): boolean {
  // null = unlimited, the loosest value.
  if (a === b) return false;
  if (b === null) return true;
  if (a === null) return false;
  return b > a;
}

export function raisesAllowance(
  lock: Pick<Lock, 'dailyMinutes' | 'dailyOpens'>,
  next: AllowanceDraft,
): boolean {
  return looser(lock.dailyMinutes, next.dailyMinutes) || looser(lock.dailyOpens, next.dailyOpens);
}

/** The game gate applies only to loosening changes while the lock is blocking now. */
export function needsGameFirst(
  lock: Lock,
  change: LockChange,
  counters: TargetCounters | undefined,
): boolean {
  return lock.enabled && isOverLimit(lock, counters ?? ZERO) && isLoosening(lock, change);
}

/**
 * Free plan (20-phase2 §10): when Pro ends, locks beyond 3 are kept but paused. The user's
 * chosen three stay on (`keep`); otherwise the oldest enabled ones do.
 */
export function pausedByPlan(
  locks: readonly Lock[],
  isPro: boolean,
  keep: readonly string[],
  limit = 3,
): Set<string> {
  if (isPro) return new Set();
  const enabled = locks.filter((l) => l.enabled);
  if (enabled.length <= limit) return new Set();
  const kept = enabled.filter((l) => keep.includes(l.id)).slice(0, limit);
  for (const l of [...enabled].sort((a, b) => a.createdAt - b.createdAt)) {
    if (kept.length >= limit) break;
    if (!kept.includes(l)) kept.push(l);
  }
  const keptIds = new Set(kept.map((l) => l.id));
  return new Set(enabled.filter((l) => !keptIds.has(l.id)).map((l) => l.id));
}
