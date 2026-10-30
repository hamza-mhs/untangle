import { AppState } from 'react-native';
import { create } from 'zustand';

import { blocker } from '@/native';

import {
  afterReturn,
  INITIAL_PROGRESS,
  type Granted,
  type Permission,
  type PermissionProgress,
} from './permissions';

/**
 * The permission walk's live state, shared by Permissions and the Accessibility disclosure.
 * In memory only: on resume the rows re-check what is granted (§1 Resume).
 */
type FlowState = {
  granted: Granted;
  progress: PermissionProgress;
  /** True while "Allow permissions" walks the list: returning moves on by itself. */
  walking: boolean;
  /** The "Can't turn it on?" sheet. */
  restrictedHelp: boolean;
  setWalking: (v: boolean) => void;
  setRestrictedHelp: (v: boolean) => void;
  setProgress: (p: PermissionProgress) => void;
  refresh: () => Promise<Granted>;
  reset: () => void;
};

export const usePermissionFlow = create<FlowState>((set) => ({
  granted: { accessibility: false, usage: false, battery: false },
  progress: INITIAL_PROGRESS,
  walking: false,
  restrictedHelp: false,
  setWalking: (walking) => set({ walking }),
  setRestrictedHelp: (restrictedHelp) => set({ restrictedHelp }),
  setProgress: (progress) => set({ progress }),
  refresh: async () => {
    const [accessibility, usage, battery] = await Promise.all([
      blocker.isAccessibilityEnabled(),
      blocker.hasUsageAccess(),
      blocker.isIgnoringBatteryOptimizations(),
    ]);
    const granted = { accessibility, usage, battery };
    set({ granted });
    return granted;
  },
  reset: () =>
    set({
      granted: { accessibility: false, usage: false, battery: false },
      progress: INITIAL_PROGRESS,
      walking: false,
      restrictedHelp: false,
    }),
}));

/** How long to wait for the app to go to the background after opening a settings screen. */
const LEAVE_WINDOW_MS = 1500;

/**
 * Resolves once the user is back from a system settings screen: on the next "active" after the
 * app went to the background, or straight away if it never left (mock module, or the intent
 * failed to open).
 */
export function waitForReturn(): Promise<void> {
  return new Promise((resolve) => {
    let left = AppState.currentState !== 'active';
    const timer = setTimeout(() => {
      if (!left) done();
    }, LEAVE_WINDOW_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') left = true;
      else if (left) done();
    });
    function done() {
      clearTimeout(timer);
      sub.remove();
      resolve();
    }
  });
}

const OPEN: Record<Permission, () => Promise<unknown>> = {
  accessibility: () => blocker.openAccessibilitySettings(),
  usage: () => blocker.openUsageAccessSettings(),
  battery: () => blocker.openBatteryOptimizationSettings(),
};

/** Opens the settings screen for `k`, waits for the user to come back, records the result. */
export async function askFor(k: Permission): Promise<boolean> {
  await OPEN[k]();
  await waitForReturn();
  const flow = usePermissionFlow.getState();
  const granted = await flow.refresh();
  flow.setProgress(afterReturn(k, granted[k], usePermissionFlow.getState().progress));
  return granted[k];
}
