import type { Lock, TargetKey } from '@/features/locks/types';
import { useDevMocksStore } from '@/services/devMocks';

import type {
  BlockerEvent,
  DailyUsage,
  InstalledApp,
  TargetCounters,
  UntangleBlocker,
  UsageToday,
} from './untangleBlocker.types';

/**
 * In-memory stand-in for modules/untangle-blocker: fake apps, fake usage, and permission
 * outcomes chosen in the dev menu. Drives Jest, the emulator and the dev menu.
 */

const MIN = 60_000;
const DELAY_MS = 250;

const USUAL_APPS: InstalledApp[] = [
  { packageName: 'com.instagram.android', label: 'Instagram', category: 'social' },
  { packageName: 'com.zhiliaoapp.musically', label: 'TikTok', category: 'video' },
  { packageName: 'com.google.android.youtube', label: 'YouTube', category: 'video' },
  { packageName: 'com.twitter.android', label: 'X', category: 'social' },
  { packageName: 'com.reddit.frontpage', label: 'Reddit', category: 'social' },
  { packageName: 'com.snapchat.android', label: 'Snapchat', category: 'social' },
  { packageName: 'com.netflix.mediaclient', label: 'Netflix', category: 'video' },
  { packageName: 'com.whatsapp', label: 'WhatsApp', category: 'social' },
  { packageName: 'com.spotify.music', label: 'Spotify', category: 'audio' },
  { packageName: 'com.google.android.gm', label: 'Gmail', category: 'productivity' },
  { packageName: 'com.google.android.apps.maps', label: 'Maps', category: 'maps' },
  { packageName: 'com.android.chrome', label: 'Chrome', category: null },
  { packageName: 'com.google.android.calendar', label: 'Calendar', category: 'productivity' },
  { packageName: 'com.duolingo', label: 'Duolingo', category: 'game' },
];
const NO_SUSPECTS: InstalledApp[] = USUAL_APPS.filter((a) =>
  ['com.whatsapp', 'com.spotify.music', 'com.google.android.gm', 'com.android.chrome'].includes(
    a.packageName,
  ),
);

/** Minutes today per package, roughly like the designs (TikTok 55m, Instagram 42m…). */
const MINUTES_TODAY: Record<string, number> = {
  'com.zhiliaoapp.musically': 55,
  'com.instagram.android': 42,
  'com.google.android.youtube': 31,
  'com.whatsapp': 22,
  'com.twitter.android': 14,
  'com.reddit.frontpage': 9,
  'com.spotify.music': 6,
  'com.android.chrome': 12,
};
const PICKUPS_BY_HOUR = [1, 0, 0, 0, 0, 0, 2, 6, 3, 2, 3, 5, 6, 2, 3, 4, 5, 3, 6, 7, 5, 6, 3, 2];

const wait = (ms = DELAY_MS) => new Promise<void>((r) => setTimeout(r, ms));
const mocks = () => useDevMocksStore.getState();

type State = {
  accessibility: boolean;
  usage: boolean;
  battery: boolean;
  heartbeatAt: number | null;
  locks: Lock[];
  counters: Record<string, TargetCounters>;
};

const state: State = {
  accessibility: false,
  usage: false,
  battery: false,
  heartbeatAt: null,
  locks: [],
  counters: {},
};

/** Test helper: back to a fresh install. */
export function resetMockBlocker() {
  state.accessibility = false;
  state.usage = false;
  state.battery = false;
  state.heartbeatAt = null;
  state.locks = [];
  state.counters = {};
}

/** Dev menu helper: flip a permission directly. */
export function setMockPermission(p: 'accessibility' | 'usage' | 'battery', on: boolean) {
  state[p] = on;
  if (p === 'accessibility') state.heartbeatAt = on ? Date.now() : null;
}

function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function usageFor(scale: number): UsageToday {
  const perApp = Object.entries(MINUTES_TODAY).map(([packageName, m]) => ({
    packageName,
    ms: Math.round(m * scale) * MIN,
  }));
  const hours = PICKUPS_BY_HOUR.map((h) => Math.round(h * scale));
  return {
    screenTimeMs: perApp.reduce((s, a) => s + a.ms, 0),
    pickups: hours.reduce((s, h) => s + h, 0),
    perApp,
    pickupsByHour: hours,
  };
}

export const mockBlocker: UntangleBlocker = {
  isMock: true,
  async isAccessibilityEnabled() {
    return state.accessibility;
  },
  async openAccessibilitySettings() {
    await wait();
    if (mocks().accessibility === 'grant') setMockPermission('accessibility', true);
  },
  async hasUsageAccess() {
    return state.usage;
  },
  async openUsageAccessSettings() {
    await wait();
    if (mocks().usageAccess === 'grant') state.usage = true;
  },
  async isIgnoringBatteryOptimizations() {
    return state.battery;
  },
  async openBatteryOptimizationSettings() {
    await wait();
    if (mocks().battery === 'grant') state.battery = true;
  },
  async openOemAutostartSettings() {
    return false;
  },
  async openAppDetailsSettings() {
    await wait();
    // "Allow restricted settings" turned on: the next attempt can succeed.
    if (mocks().accessibility === 'restricted') mocks().set({ accessibility: 'grant' });
  },
  async getServiceHealth() {
    return { enabled: state.accessibility, lastHeartbeatAt: state.heartbeatAt };
  },
  async getInstalledApps() {
    const set = mocks().apps;
    if (set === 'loading') await new Promise<void>(() => {});
    await wait();
    return set === 'noSuspects' ? NO_SUSPECTS : USUAL_APPS;
  },
  async getAppIcon() {
    return null;
  },
  async getUsageToday() {
    if (!state.usage) return { screenTimeMs: 0, pickups: null, perApp: [], pickupsByHour: [] };
    return usageFor(1);
  },
  async getUsageRange(fromDate, toDate) {
    if (!state.usage) return [];
    const out: DailyUsage[] = [];
    const d = new Date(`${fromDate}T12:00:00`);
    const end = new Date(`${toDate}T12:00:00`);
    let i = 0;
    while (d <= end) {
      const u = usageFor(0.8 + ((i * 37) % 50) / 100);
      out.push({
        date: localDate(d),
        screenTimeMs: u.screenTimeMs,
        pickups: u.pickups,
        perApp: u.perApp,
      });
      d.setDate(d.getDate() + 1);
      i++;
    }
    return out;
  },
  async setLocks(locks) {
    state.locks = locks.map((l) => ({ ...l }));
  },
  async getLocks() {
    return state.locks.map((l) => ({ ...l }));
  },
  async setSettings() {},
  async startFocusSession() {},
  async endFocusSession() {},
  async getTodayCounters() {
    return { ...state.counters } as Record<TargetKey, TargetCounters>;
  },
  async grantUnlock(key) {
    const c = state.counters[key] ?? { usedMs: 0, opens: 0, unlocksUsed: 0 };
    state.counters[key] = { ...c, unlocksUsed: c.unlocksUsed + 1 };
  },
  async openTarget() {},
  async goHome() {},
  addListener(_event: BlockerEvent) {
    return { remove: () => {} };
  },
};
