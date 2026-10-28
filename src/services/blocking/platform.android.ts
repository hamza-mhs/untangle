import { err, ok } from '@/lib/result';

import { optionalModule } from '../nativeModules';
import type { BlockingService, InstalledApp } from './BlockingService';
import { parseShieldEvents, parseUsage } from './shieldEvents';
import { rulesToNativeJson } from './toNativeJson';

/** modules/blocker-android (Kotlin): usage access, overlay, watcher service. */
type BlockerAndroidModule = {
  getPermissions(): { usageAccess: boolean; overlay: boolean };
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  getInstalledApps(): Promise<InstalledApp[]>;
  applyRules(json: string): void;
  startFocus(endsAt: number, lockedCount: number): void;
  endFocus(): void;
  /** Phase 5 (native): optional until the Kotlin side ships them. */
  liftShields?(until: number): void;
  readShieldEvents?(since: number): Promise<unknown[]>;
  getUsageSummary?(day: string): Promise<unknown>;
  resolveShield?(json: string): void;
};

/**
 * Android: "authorization" is two special-access toggles in Settings. The designs for the
 * Android OB09–OB11 variants don't exist yet (EDGE_CASES GAP); until they do, the request
 * opens the next missing Settings page and resolves `pending` (re-check on resume).
 */
export function createPlatformBlocking(): BlockingService | null {
  const mod = optionalModule<BlockerAndroidModule>('BlockerAndroid');
  if (!mod) return null;
  return {
    isMock: false,
    getAuthorization: async () => {
      const p = mod.getPermissions();
      return p.usageAccess && p.overlay ? 'approved' : 'notDetermined';
    },
    requestAuthorization: async () => {
      const p = mod.getPermissions();
      if (p.usageAccess && p.overlay) return ok('approved');
      if (!p.usageAccess) mod.openUsageAccessSettings();
      else mod.openOverlaySettings();
      return err('pending');
    },
    // Our own installed-apps picker isn't designed yet (SPEC OB10: "On Android this is our own
    // installed-apps list"). Until then: select every launchable app the user can see later.
    pickApps: async () => {
      const apps = await mod.getInstalledApps();
      return apps.length
        ? ok({ platform: 'android', packages: apps.map((a) => a.packageName) })
        : err('empty');
    },
    listInstalledApps: () => mod.getInstalledApps(),
    applyRules: (rules) => mod.applyRules(rulesToNativeJson(rules)),
    startFocus: (endsAt, lockedCount) => mod.startFocus(endsAt, lockedCount),
    endFocus: () => mod.endFocus(),
    liftShields: (until) => mod.liftShields?.(until),
    getShieldEvents: async (since) =>
      parseShieldEvents((await mod.readShieldEvents?.(since)) ?? []),
    getUsageSummary: async (day) => parseUsage(await mod.getUsageSummary?.(day)),
    resolveShield: (result) => mod.resolveShield?.(JSON.stringify(result)),
  };
}
