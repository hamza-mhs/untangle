import { blocking } from '@/services/blocking';

/**
 * The "focus surface" outside the app:
 *   iOS     → Live Activity + Dynamic Island (ActivityKit, started by blocker-ios.startFocus)
 *   Android → ongoing notification with a native countdown chronometer (BlockerService)
 * Both are driven by the same native calls that apply the focus shield, so they can't drift.
 */
export const focusSurface = {
  start(endsAt: number, lockedCount: number) {
    blocking.startFocus(endsAt, lockedCount);
  },
  end() {
    blocking.endFocus();
  },
};
