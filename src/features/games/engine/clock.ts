/**
 * Game time: a clock that stops while the game is paused (30-phase3 §A.2.7), so timers, waits
 * and animations all freeze together. Pure apart from the injected `now`.
 */
export class AbortedError extends Error {
  constructor() {
    super('aborted');
    this.name = 'AbortedError';
  }
}

type Waiter = { at: number; resolve: () => void; reject: (e: Error) => void };

export class GameClock {
  private elapsed = 0;
  private since: number | null = null;
  private waiters: Waiter[] = [];
  private disposed = false;

  constructor(private readonly realNow: () => number = () => Date.now()) {}

  get running(): boolean {
    return this.since !== null;
  }

  /** Milliseconds of game time so far. */
  now(): number {
    return this.since === null ? this.elapsed : this.elapsed + (this.realNow() - this.since);
  }

  start() {
    if (this.since === null && !this.disposed) this.since = this.realNow();
  }

  pause() {
    if (this.since === null) return;
    this.elapsed += this.realNow() - this.since;
    this.since = null;
  }

  /** Resolves after `ms` of game time (never while paused). Rejects when disposed. */
  wait(ms: number): Promise<void> {
    if (this.disposed) return Promise.reject(new AbortedError());
    return new Promise((resolve, reject) => {
      this.waiters.push({ at: this.now() + Math.max(0, ms), resolve, reject });
    });
  }

  /** Called every frame by the engine: settles the waits that are due. */
  tick() {
    if (!this.running || !this.waiters.length) return;
    const t = this.now();
    const due = this.waiters.filter((w) => w.at <= t);
    if (!due.length) return;
    this.waiters = this.waiters.filter((w) => w.at > t);
    for (const w of due) w.resolve();
  }

  /** Ends the round: pending waits reject so round loops stop. */
  dispose() {
    this.disposed = true;
    this.pause();
    const pending = this.waiters;
    this.waiters = [];
    for (const w of pending) w.reject(new AbortedError());
  }
}

export function isAborted(e: unknown): boolean {
  return e instanceof AbortedError;
}

/** Timer states for the HUD ring (§A.2.4). */
export type TimerState = 'normal' | 'warning' | 'last' | 'up';

export function timerState(leftMs: number, totalMs: number): TimerState {
  if (leftMs <= 0) return 'up';
  if (leftMs <= 5000) return 'last';
  if (leftMs <= totalMs * 0.4) return 'warning';
  return 'normal';
}
