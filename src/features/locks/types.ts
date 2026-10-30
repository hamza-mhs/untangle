/**
 * Locks (00-foundations §6). One lock = one app OR one website with a daily allowance.
 * Native-side state is the source of truth for enforcement; JS edits it via setLocks().
 */
export type LockTarget =
  | { kind: 'app'; packageName: string; label: string }
  /** Registrable domain, lowercase, no scheme or "www.". */
  | { kind: 'site'; domain: string };

export type Strictness = 'gentle' | 'firm' | 'locked';

export interface Lock {
  /** uuid */
  id: string;
  target: LockTarget;
  /** null = no time limit; 0 = blocked all day. */
  dailyMinutes: number | null;
  /** null = no open limit. */
  dailyOpens: number | null;
  strictness: Strictness;
  enabled: boolean;
  /** epoch ms */
  createdAt: number;
}

/** "app:<packageName>" or "site:<domain>". */
export type TargetKey = `app:${string}` | `site:${string}`;

export function targetKey(t: LockTarget): TargetKey {
  return t.kind === 'app' ? `app:${t.packageName}` : `site:${t.domain}`;
}

/** Invariant: a lock limits something. */
export function isValidLock(l: Pick<Lock, 'dailyMinutes' | 'dailyOpens'>): boolean {
  return l.dailyMinutes !== null || l.dailyOpens !== null;
}
