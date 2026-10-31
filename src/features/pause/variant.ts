import { DEFAULT_PAUSE_GAME, gameMeta, isQuickGame, PLAYABLE, type GameId } from '@/features/games';
import type { Strictness } from '@/features/locks';

/**
 * Pause screen rules (20-phase2-core-app §8, 02-android-platform §4.6). Pure.
 */

export type BlockReason = 'focus' | 'always' | 'opens' | 'time' | 'time_up';

export type PauseParams = {
  targetKey: string;
  reason: BlockReason;
  label: string;
  lockId: string | null;
  strictness: Strictness;
  opensToday: number;
  usedMs: number;
  minutesAllowed: number | null;
  opensAllowed: number | null;
  unlocksUsed: number;
  /** From lock detail: same UI, nothing logged or unlocked. */
  preview: boolean;
  /** Focus session end (ms), for "{m} min left". */
  focusEndAt: number | null;
};

export type PauseVariant = 'gentle' | 'firm' | 'locked' | 'capReached' | 'timeUp' | 'focus';

export type PauseSettings = {
  unlockMinutesGentle: number;
  unlockMinutesFirm: number;
  firmWaitSeconds: number;
};

/** Unlock caps per target per day. */
export const UNLOCK_CAP: Record<Strictness, number> = { gentle: 3, firm: 2, locked: 0 };

export type PausePlan = {
  variant: PauseVariant;
  /** Blocked all day (0-minute lock): changes the title only. */
  allDay: boolean;
  /** Minutes the game can unlock, or null when the game unlocks nothing. */
  unlockMinutes: number | null;
  /** Firm: seconds to wait on the result screen before the unlock button works. */
  waitSeconds: number;
  /** Time's up only offers Back / Close; no detours are logged. */
  offersChoices: boolean;
  logsDetours: boolean;
};

export function planPause(
  p: Pick<PauseParams, 'reason' | 'strictness' | 'unlocksUsed' | 'minutesAllowed' | 'preview'>,
  s: PauseSettings,
): PausePlan {
  const allDay = p.reason === 'always' || p.minutesAllowed === 0;
  const base = { allDay, waitSeconds: 0, offersChoices: true, logsDetours: !p.preview };
  if (p.reason === 'time_up') {
    return {
      ...base,
      allDay: false,
      variant: 'timeUp',
      unlockMinutes: null,
      offersChoices: false,
      logsDetours: false,
    };
  }
  if (p.reason === 'focus')
    return { ...base, allDay: false, variant: 'focus', unlockMinutes: null };
  if (p.strictness === 'locked') return { ...base, variant: 'locked', unlockMinutes: null };
  if (p.unlocksUsed >= UNLOCK_CAP[p.strictness])
    return { ...base, variant: 'capReached', unlockMinutes: null };
  if (p.strictness === 'firm') {
    return {
      ...base,
      variant: 'firm',
      unlockMinutes: s.unlockMinutesFirm,
      waitSeconds: s.firmWaitSeconds,
    };
  }
  return { ...base, variant: 'gentle', unlockMinutes: s.unlockMinutesGentle };
}

/** The reason chip (COPY CHANGE: the allowance, replacing "Work time"). */
export type ReasonChip =
  | { key: 'minutes'; minutes: number }
  | { key: 'opens'; opens: number }
  | { key: 'allDay' }
  | { key: 'focus' };

export function reasonChip(
  p: Pick<PauseParams, 'reason' | 'minutesAllowed' | 'opensAllowed'>,
): ReasonChip {
  if (p.reason === 'focus') return { key: 'focus' };
  if (p.reason === 'always' || p.minutesAllowed === 0) return { key: 'allDay' };
  if (p.reason === 'opens' && p.opensAllowed !== null)
    return { key: 'opens', opens: p.opensAllowed };
  if (p.minutesAllowed !== null) return { key: 'minutes', minutes: p.minutesAllowed };
  if (p.opensAllowed !== null) return { key: 'opens', opens: p.opensAllowed };
  return { key: 'allDay' };
}

const RECENT_PAUSES = 3;

/**
 * Which game the pause screen offers (§8): the next unplayed training game if it is ≤ 45 s and
 * not Calm; else a random quick game not offered in the last 3 pauses; Stack tower if all else
 * fails.
 */
export function pickPauseGame(args: {
  training: readonly GameId[];
  playedToday: ReadonlySet<string>;
  recentOffered: readonly GameId[];
  rand: () => number;
}): GameId {
  const next = args.training.find((id) => !args.playedToday.has(id));
  const nextMeta = next ? gameMeta(next) : undefined;
  if (next && nextMeta && nextMeta.seconds <= 45 && nextMeta.group !== 'calm' && !nextMeta.calm)
    return next;
  const recent = new Set(args.recentOffered.slice(-RECENT_PAUSES));
  const pool = PLAYABLE.filter((g) => isQuickGame(g) && !recent.has(g.id));
  if (!pool.length) return DEFAULT_PAUSE_GAME;
  return pool[Math.floor(args.rand() * pool.length)]!.id;
}

/** Deep-link query → params, tolerant of missing or bad values. */
export function parsePauseParams(
  q: Record<string, string | string[] | undefined>,
): PauseParams | null {
  const one = (k: string) => {
    const v = q[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = one(k);
    if (v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const targetKey = one('targetKey');
  if (!targetKey || !/^(app|site):.+/.test(targetKey)) return null;
  const reasons: BlockReason[] = ['focus', 'always', 'opens', 'time', 'time_up'];
  const reason = (reasons as string[]).includes(one('reason') ?? '')
    ? (one('reason') as BlockReason)
    : 'time';
  const strictness = one('strictness');
  return {
    targetKey,
    reason,
    label: one('label') || targetKey.replace(/^(app|site):/, ''),
    lockId: one('lockId') || null,
    strictness: strictness === 'firm' || strictness === 'locked' ? strictness : 'gentle',
    opensToday: num('opensToday') ?? 0,
    usedMs: num('usedMs') ?? 0,
    minutesAllowed: num('minutesAllowed'),
    opensAllowed: num('opensAllowed'),
    unlocksUsed: num('unlocksUsed') ?? 0,
    preview: one('preview') === '1',
    focusEndAt: num('focusEndAt'),
  };
}
