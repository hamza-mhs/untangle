import type { Result } from '@/lib/result';

/**
 * Blocking service contract (SPEC: Screen Time authorization, the picker, shields).
 * Implementations: `platform.ios.ts` (FamilyControls), `platform.android.ts` (usage access +
 * overlay), `blocking.mock.ts` (simulators / Expo Go / tests).
 */

export type BlockingAuthStatus = 'approved' | 'denied' | 'notDetermined';

/**
 * What the user picked. On iOS it's an opaque serialized FamilyActivitySelection: the app
 * can't read app names from it, only the item count.
 */
export type BlockingSelection =
  { platform: 'ios'; token: string; count: number } | { platform: 'android'; packages: string[] };

export type BlockingStrength = 'pause' | 'earn' | 'locked';

/** Rule payload as the native schedulers see it. */
export type BlockingRule = {
  id: string;
  enabled: boolean;
  strength: BlockingStrength;
  /** 'HH:MM' local; end ≤ start crosses midnight. */
  start: string;
  end: string;
  /** 0 = Sunday. */
  days: number[];
  selection: BlockingSelection;
};

export type InstalledApp = { packageName: string; label: string; icon: string };

/** One shield appearance (ShieldAction extension on iOS, our overlay on Android). */
export type ShieldEvent = {
  at: number;
  /** Package name on Android; an opaque token id on iOS. */
  appId: string;
  ruleId: string;
  strength: BlockingStrength;
  outcome: 'closed' | 'opened' | 'spent';
  /** FShield "Why are you opening this?" (Android; iOS asks in the app later). */
  reason?: 'bored' | 'habit' | 'need' | 'avoiding';
};

/** Android only (UsageStatsManager). iOS can only *display* these via DeviceActivityReport. */
export type UsageSummary = { screenTimeMinutes: number; pickups: number };

export interface BlockingService {
  /** True for the mock implementation (simulator, Expo Go, tests). */
  readonly isMock: boolean;
  getAuthorization(): Promise<BlockingAuthStatus>;
  /**
   * iOS: `AuthorizationCenter.requestAuthorization(for: .individual)`. Apple doesn't document
   * whether a second call after a denial re-prompts, so callers treat `denied` as final and
   * show E01 (Settings path + Try again).
   * Android: opens the usage-access / overlay Settings pages and resolves `pending`; check
   * again on resume.
   */
  requestAuthorization(): Promise<Result<'approved', 'denied' | 'pending' | 'unavailable'>>;
  /** iOS: FamilyActivityPicker. Android: our installed-apps list (not designed yet). */
  pickApps(
    current: BlockingSelection | null,
  ): Promise<Result<BlockingSelection, 'cancelled' | 'empty' | 'unavailable'>>;
  listInstalledApps(): Promise<InstalledApp[]>;
  applyRules(rules: readonly BlockingRule[]): void;
  startFocus(endsAt: number, lockedCount: number): void;
  endFocus(): void;
  /** Emergency pass: remove every shield until `until`, then re-apply by itself (OS-side). */
  liftShields(until: number): void;
  /** Shield events since `since` (App Group on iOS, the service's log on Android). */
  getShieldEvents(since: number): Promise<ShieldEvent[]>;
  /** Today's screen time and pickups. Null on iOS (the numbers never reach the app). */
  getUsageSummary(day: string): Promise<UsageSummary | null>;
  /**
   * Android FShield result: close the blocked app, or let it open for `spendMinutes`. Logs the
   * shield event (and the "why" reason) natively. No-op on iOS (the extension handles it).
   */
  resolveShield(result: {
    appId: string;
    ruleId: string;
    outcome: 'closed' | 'spent';
    spendMinutes?: number;
    reason?: ShieldEvent['reason'];
  }): void;
}

export function selectionCount(s: BlockingSelection): number {
  return s.platform === 'ios' ? s.count : s.packages.length;
}
