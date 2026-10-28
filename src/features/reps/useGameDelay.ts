import { useEffect, useEffectEvent } from 'react';

/**
 * A game's own timing (a maths step, a span digit, a pairs flip-back) that respects R5: while
 * the round is paused nothing fires, and on resume the delay starts over. `ms = null` disarms.
 * `key` re-arms it for the next step even when `ms` is unchanged.
 */
export function useGameDelay(
  running: boolean,
  ms: number | null,
  onDone: () => void,
  key: string | number = 0,
) {
  const fire = useEffectEvent(onDone);
  useEffect(() => {
    if (!running || ms === null) return;
    const id = setTimeout(fire, ms);
    return () => clearTimeout(id);
  }, [running, ms, key]);
}
