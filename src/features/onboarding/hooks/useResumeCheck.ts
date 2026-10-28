import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Runs `check` each time the app returns to the foreground while this screen is mounted.
 * Android permission steps send the user to Settings; this is the "back here when done" check.
 */
export function useResumeCheck(check: () => void | Promise<void>) {
  const latest = useRef(check);
  useEffect(() => {
    latest.current = check;
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void latest.current();
    });
    return () => sub.remove();
  }, []);
}
