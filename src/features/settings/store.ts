import { z } from 'zod';

import { blocker } from '@/native';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

export type Strictness = 'gentle' | 'firm' | 'locked';

/** Unlock length after a game on Gentle (20-phase2 §9, sheet `122:8350`). */
export const UNLOCK_CHOICES = [2, 5, 10, 15] as const;
export const GOAL_MIN = 1;
export const GOAL_MAX = 5;
/** Firm is fixed by 02-android-platform §4.6. */
export const FIRM_UNLOCK_MINUTES = 3;
export const FIRM_WAIT_SECONDS = 30;

/** App settings (MMKV `settings.*`), defaults from 10-phase1-onboarding §3. */
export type SettingsState = {
  defaultStrictness: Strictness;
  unlockMinutes: number;
  dailyGoal: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setDefaultStrictness: (s: Strictness) => void;
  setUnlockMinutes: (m: number) => void;
  setDailyGoal: (n: number) => void;
  setHapticsEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
};

/** The unlock lengths the accessibility service applies. */
export function pushSettingsToNative(unlockMinutes: number) {
  blocker
    .setSettings({
      unlockMinutesGentle: unlockMinutes,
      unlockMinutesFirm: FIRM_UNLOCK_MINUTES,
      firmWaitSeconds: FIRM_WAIT_SECONDS,
    })
    .catch(() => {});
}

const schema = z
  .object({
    defaultStrictness: z.enum(['gentle', 'firm', 'locked']),
    unlockMinutes: z.number(),
    dailyGoal: z.number(),
    soundEnabled: z.boolean(),
    hapticsEnabled: z.boolean(),
  })
  .partial();

export const useSettingsStore = createPersistedStore<SettingsState>(
  STORE_KEYS.settings,
  (set) => ({
    defaultStrictness: 'gentle',
    unlockMinutes: 5,
    dailyGoal: 3,
    soundEnabled: true,
    hapticsEnabled: true,
    setDefaultStrictness: (defaultStrictness) => set({ defaultStrictness }),
    setUnlockMinutes: (unlockMinutes) => {
      set({ unlockMinutes });
      pushSettingsToNative(unlockMinutes);
    },
    setDailyGoal: (n) => set({ dailyGoal: Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(n))) }),
    setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  }),
  { schema, version: 2 },
);
