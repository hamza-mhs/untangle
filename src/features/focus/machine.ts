/**
 * Focus session ("Lock in"): idle → running → done. There is deliberately no running → idle
 * transition: once started, a session can't be ended early. An emergency pass lifts the
 * shields for 10 min; the session itself keeps running.
 */

export type FocusState =
  | { status: 'idle' }
  | {
      status: 'running';
      startedAt: number;
      endsAt: number;
      minutes: number;
      lockedCount: number;
      /** E09 "Timer only, no lock": no shields, no points, no earned minutes. */
      isTimerOnly: boolean;
    }
  | {
      status: 'done';
      startedAt: number;
      endedAt: number;
      minutes: number;
      earnedMinutes: number;
      points: number;
      isTimerOnly: boolean;
    };

export type FocusEvent =
  | { type: 'start'; now: number; minutes: number; lockedCount: number; isTimerOnly?: boolean }
  | { type: 'tick'; now: number }
  | { type: 'acknowledge' }
  /** Present so UI code can't "accidentally" add it — the reducer ignores it. */
  | { type: 'requestEarlyExit' };

export const MIN_FOCUS_MINUTES = 5;
export const MAX_FOCUS_MINUTES = 240;
export const DURATION_CHIPS = [25, 50, 90] as const;

/** Earned app time: 30 % of the session (50 min → 15 min). */
export function earnedMinutesFor(minutes: number): number {
  return Math.round(minutes * 0.3);
}

/** Points: half a point a minute (50 min → +25). */
export function pointsFor(minutes: number): number {
  return Math.round(minutes / 2);
}

export function focusReducer(state: FocusState, event: FocusEvent): FocusState {
  switch (event.type) {
    case 'start': {
      if (state.status === 'running') return state;
      const minutes = Math.round(
        Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, event.minutes)),
      );
      return {
        status: 'running',
        startedAt: event.now,
        endsAt: event.now + minutes * 60_000,
        minutes,
        lockedCount: event.isTimerOnly ? 0 : event.lockedCount,
        isTimerOnly: !!event.isTimerOnly,
      };
    }
    case 'tick':
      if (state.status === 'running' && event.now >= state.endsAt) {
        return {
          status: 'done',
          startedAt: state.startedAt,
          endedAt: state.endsAt,
          minutes: state.minutes,
          earnedMinutes: state.isTimerOnly ? 0 : earnedMinutesFor(state.minutes),
          points: state.isTimerOnly ? 0 : pointsFor(state.minutes),
          isTimerOnly: state.isTimerOnly,
        };
      }
      return state;
    case 'acknowledge':
      return state.status === 'done' ? { status: 'idle' } : state;
    case 'requestEarlyExit':
      return state;
  }
}

/** Exhaustiveness helper for `switch (state.status)` renders. */
export function assertNever(x: never): never {
  throw new Error(`Unhandled focus state: ${JSON.stringify(x)}`);
}
