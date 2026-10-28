import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

/**
 * The one Reduce Motion hook (CODE_STANDARDS). Everything that animates checks it:
 * no loops, no count-ups, durations collapse to 0.
 */
export function useReducedMotion(): boolean {
  return useReanimatedReducedMotion();
}

/** Duration that respects Reduce Motion. */
export function useDuration(ms: number): number {
  return useReducedMotion() ? 0 : ms;
}
