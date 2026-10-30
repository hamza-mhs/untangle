import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

/** When the paywall was last shown (MMKV `paywall.lastShownAt`, 00-foundations §6). */
type PaywallStore = {
  lastShownAt: number | null;
  markShown: (at?: number) => void;
};

const schema = z.object({ lastShownAt: z.number().nullable() }).partial();

export const usePaywallStore = createPersistedStore<PaywallStore>(
  STORE_KEYS.paywall,
  (set) => ({
    lastShownAt: null,
    markShown: (at = Date.now()) => set({ lastShownAt: at }),
  }),
  { schema },
);
