import { DEFAULT_DRAW_TIME } from '@/features/challenges/rules';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

export type SettingsState = {
  onboarded: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  /** Morning draw time, 'HH:MM' (OB14 / FSettings). */
  drawTime: string;
  /** Generic notification text: no app names, no challenge titles. */
  discreetNotifications: boolean;
  /** Biometric / device-credential lock when the app opens. */
  appLock: boolean;
  /** FLightsOut started the bedtime lock early, until this time. */
  lightsOutUntil: number | null;
  setOnboarded: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setDrawTime: (v: string) => void;
  setDiscreetNotifications: (v: boolean) => void;
  setAppLock: (v: boolean) => void;
  setLightsOutUntil: (v: number | null) => void;
};

export const useSettingsStore = createPersistedStore<SettingsState>(STORE_KEYS.settings, (set) => ({
  onboarded: false,
  hapticsEnabled: true,
  notificationsEnabled: true,
  drawTime: DEFAULT_DRAW_TIME,
  discreetNotifications: false,
  appLock: false,
  lightsOutUntil: null,
  setOnboarded: (onboarded) => set({ onboarded }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setDrawTime: (drawTime) => set({ drawTime }),
  setDiscreetNotifications: (discreetNotifications) => set({ discreetNotifications }),
  setAppLock: (appLock) => set({ appLock }),
  setLightsOutUntil: (lightsOutUntil) => set({ lightsOutUntil }),
}));
