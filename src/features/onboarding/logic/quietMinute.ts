/**
 * OB12 quiet minute as a pure state machine. Time is passed in, so it's testable and the
 * screen can derive the live countdown on the UI thread from `elapsedMs` + `runningSince`.
 *
 *   waiting ──down──▶ running ──lift──▶ paused ──down──▶ running ── 60 s ──▶ done
 *
 * The silence challenge (OxSilence) runs the same machine for 5 minutes: pass `durationMs`.
 */
export const QUIET_MINUTE_MS = 60_000;
/** "Skip" appears, muted, after this long on the screen. */
export const QUIET_SKIP_AFTER_MS = 10_000;

export type QuietPhase = 'waiting' | 'running' | 'paused' | 'done';

export type QuietState = {
  phase: QuietPhase;
  /** Time spent face-down before the current run. */
  elapsedMs: number;
  /** Start of the current run (only while `running`). */
  runningSince: number | null;
};

export type QuietEvent =
  { type: 'down'; now: number } | { type: 'up'; now: number } | { type: 'tick'; now: number };

export const initialQuietState: QuietState = { phase: 'waiting', elapsedMs: 0, runningSince: null };

export function elapsedAt(state: QuietState, now: number, durationMs = QUIET_MINUTE_MS): number {
  const run = state.runningSince === null ? 0 : Math.max(0, now - state.runningSince);
  return Math.min(durationMs, state.elapsedMs + run);
}

export function remainingAt(state: QuietState, now: number, durationMs = QUIET_MINUTE_MS): number {
  return durationMs - elapsedAt(state, now, durationMs);
}

export function quietReducer(
  state: QuietState,
  event: QuietEvent,
  durationMs = QUIET_MINUTE_MS,
): QuietState {
  if (state.phase === 'done') return state;
  const elapsed = elapsedAt(state, event.now, durationMs);
  if (elapsed >= durationMs) {
    return { phase: 'done', elapsedMs: durationMs, runningSince: null };
  }
  switch (event.type) {
    case 'down':
      return state.phase === 'running'
        ? state
        : { phase: 'running', elapsedMs: state.elapsedMs, runningSince: event.now };
    case 'up':
      return state.phase === 'running'
        ? { phase: 'paused', elapsedMs: elapsed, runningSince: null }
        : state;
    case 'tick':
      return state;
  }
}

/** "0m" / "42s" parts of the countdown (seconds zero-padded, as designed). */
export function countdownParts(remainingMs: number): { minutes: string; seconds: string } {
  'worklet';
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return { minutes: `${m}m`, seconds: `${s < 10 ? '0' : ''}${s}s` };
}

/** `useReducer` form for a given length (OxSilence: 5 min). */
export function makeQuietReducer(durationMs: number) {
  return (state: QuietState, event: QuietEvent) => quietReducer(state, event, durationMs);
}
