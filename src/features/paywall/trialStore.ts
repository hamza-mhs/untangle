import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { initialTrialState, onRuleEnabled, type TrialState } from './trial';
import { readTrialFlag, writeTrialFlag } from './secureFlag';
import { scheduleTrialNotice } from './trialNotifications';

type TrialStore = TrialState & {
  /** Call when any rule is switched on. Idempotent. */
  startIfNeeded: (now?: number) => void;
  markExpiryPaywallSeen: () => void;
  /** On launch: restore a trial start from the Keychain after a reinstall. */
  restoreFromSecureStore: () => Promise<void>;
};

export const useTrialStore = createPersistedStore<TrialStore>(STORE_KEYS.trial, (set, get) => ({
  ...initialTrialState,
  startIfNeeded: (now = Date.now()) => {
    const next = onRuleEnabled(get(), now);
    if (next.startedAt !== get().startedAt && next.startedAt !== null) {
      set({ startedAt: next.startedAt, startDay: next.startDay ?? null });
      void writeTrialFlag(next.startedAt);
      void scheduleTrialNotice(next.startedAt);
    }
  },
  markExpiryPaywallSeen: () => set({ expiryPaywallSeen: true }),
  restoreFromSecureStore: async () => {
    const stored = await readTrialFlag();
    const current = get().startedAt;
    // Earliest start wins, so a reinstall can never extend the trial.
    if (stored !== null && (current === null || stored < current)) set({ startedAt: stored });
  },
}));
