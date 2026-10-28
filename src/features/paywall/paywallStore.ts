import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import type { PaywallMoment } from './moments';

/** Which pricing moments the user has seen (each shows once) and the P10 cancel reason log. */
type PaywallStore = {
  seen: Record<PaywallMoment, boolean>;
  remindOnDay7: boolean;
  markSeen: (m: PaywallMoment) => void;
  remindLater: () => void;
  cancelReasons: { at: number; reasons: string[] }[];
  logCancelReasons: (reasons: string[]) => void;
};

const MOMENTS = ['trialCard', 'day5', 'expiry', 'wentFree', 'winBack'] as const;

const schema = z
  .object({
    seen: z.object(Object.fromEntries(MOMENTS.map((m) => [m, z.boolean()]))),
    remindOnDay7: z.boolean(),
    cancelReasons: z.array(z.object({ at: z.number(), reasons: z.array(z.string()) })),
  })
  .partial();

export const usePaywallStore = createPersistedStore<PaywallStore>(
  STORE_KEYS.paywall,
  (set, get) => ({
    seen: { trialCard: false, day5: false, expiry: false, wentFree: false, winBack: false },
    remindOnDay7: false,
    markSeen: (m) =>
      set({
        seen: { ...get().seen, [m]: true },
        // Seeing day 5 again on day 7 clears the reminder.
        remindOnDay7: m === 'day5' && get().seen.day5 ? false : get().remindOnDay7,
      }),
    remindLater: () => set({ remindOnDay7: true, seen: { ...get().seen, day5: true } }),
    cancelReasons: [],
    logCancelReasons: (reasons) =>
      set({ cancelReasons: [...get().cancelReasons, { at: Date.now(), reasons }].slice(-20) }),
  }),
  { schema },
);
