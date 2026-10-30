import type { Lock, TargetKey } from '@/features/locks/types';

/** Types shared by the native bridge (modules/untangle-blocker) and its mock. */

export type InstalledApp = {
  packageName: string;
  label: string;
  /** Android `ApplicationInfo.category` name, lowercase ("social", "video", "game"…), or null. */
  category: string | null;
};

export type UsageToday = {
  screenTimeMs: number;
  /** null when unknown (API 26–27 without the service running). */
  pickups: number | null;
  perApp: { packageName: string; ms: number }[];
  /** 24 values, index 0 = midnight. */
  pickupsByHour: number[];
};

export type DailyUsage = {
  /** YYYY-MM-DD, local. */
  date: string;
  screenTimeMs: number;
  pickups: number | null;
  perApp: { packageName: string; ms: number }[];
};

export type ServiceHealth = { enabled: boolean; lastHeartbeatAt: number | null };

export type TargetCounters = { usedMs: number; opens: number; unlocksUsed: number };

export type BlockerSettings = {
  unlockMinutesGentle: number;
  unlockMinutesFirm: number;
  firmWaitSeconds: number;
};

export type BlockerEvent = 'blocked' | 'usageTick' | 'serviceHealth';

export interface UntangleBlocker {
  readonly isMock: boolean;
  // permissions
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): Promise<void>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<void>;
  openOemAutostartSettings(): Promise<boolean>;
  /** App info screen (restricted-settings help). */
  openAppDetailsSettings(): Promise<void>;
  getServiceHealth(): Promise<ServiceHealth>;
  // apps & usage
  getInstalledApps(): Promise<InstalledApp[]>;
  /** file:// URI of a cached PNG, or null when the app has no readable icon. */
  getAppIcon(packageName: string): Promise<string | null>;
  getUsageToday(): Promise<UsageToday>;
  getUsageRange(fromDate: string, toDate: string): Promise<DailyUsage[]>;
  // enforcement state (JS edits, native is the source of truth)
  setLocks(locks: Lock[]): Promise<void>;
  getLocks(): Promise<Lock[]>;
  setSettings(s: BlockerSettings): Promise<void>;
  startFocusSession(endAt: number, targetKeys: TargetKey[]): Promise<void>;
  endFocusSession(): Promise<void>;
  getTodayCounters(): Promise<Record<TargetKey, TargetCounters>>;
  grantUnlock(targetKey: TargetKey, minutes: number): Promise<void>;
  openTarget(targetKey: TargetKey): Promise<void>;
  goHome(): Promise<void>;
  addListener(event: BlockerEvent, cb: (payload: unknown) => void): { remove: () => void };
}
