/**
 * Rep timer that only counts foreground time. Pure core (`createRepTimer`) is clock-injected so
 * it's unit-testable; `useRepTimer` (below) wires it to AppState so leaving the app pauses it.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type RepTimer = {
  start: (now: number) => void;
  pause: (now: number) => void;
  resume: (now: number) => void;
  /** Foreground ms elapsed. */
  elapsed: (now: number) => number;
  remaining: (now: number) => number;
  isRunning: () => boolean;
};

export function createRepTimer(durationMs: number): RepTimer {
  let accumulated = 0;
  let runningSince: number | null = null;

  const elapsed = (now: number) =>
    Math.min(durationMs, accumulated + (runningSince === null ? 0 : now - runningSince));

  return {
    start: (now) => {
      accumulated = 0;
      runningSince = now;
    },
    pause: (now) => {
      if (runningSince === null) return;
      accumulated += now - runningSince;
      runningSince = null;
    },
    resume: (now) => {
      if (runningSince === null && accumulated < durationMs) runningSince = now;
    },
    elapsed,
    remaining: (now) => durationMs - elapsed(now),
    isRunning: () => runningSince !== null,
  };
}

/** React hook: ticks every 100 ms, pauses while the app is backgrounded. */
export function useRepTimer(durationMs: number, onTimeUp?: () => void) {
  const [timer] = useState(() => createRepTimer(durationMs));
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    timer.start(Date.now());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') timer.resume(Date.now());
      else timer.pause(Date.now());
    });
    const id = setInterval(() => {
      const left = timer.remaining(Date.now());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onTimeUp?.();
      }
    }, 100);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [timer, onTimeUp]);

  return { remaining };
}
