import { err, ok } from '@/lib/result';

import { optionalModule } from '../nativeModules';
import type { BlockingAuthStatus, BlockingService } from './BlockingService';
import { parseShieldEvents } from './shieldEvents';
import { rulesToNativeJson } from './toNativeJson';

/** modules/blocker-ios (Swift): FamilyControls + ManagedSettings + DeviceActivity. */
type BlockerIosModule = {
  getAuthorizationStatus(): BlockingAuthStatus;
  requestAuthorization(): Promise<BlockingAuthStatus>;
  presentAppPicker(currentToken: string | null): Promise<unknown>;
  applyRules(json: string): void;
  startFocus(endsAt: number, lockedCount: number): void;
  endFocus(): void;
  /** Phase 5 (native): optional until the Swift side ships them. */
  liftShields?(until: number): void;
  readShieldEvents?(since: number): Promise<unknown[]>;
};

function parsePick(value: unknown): { token: string; count: number } | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  return typeof v.token === 'string' && typeof v.count === 'number'
    ? { token: v.token, count: v.count }
    : null;
}

export function createPlatformBlocking(): BlockingService | null {
  const mod = optionalModule<BlockerIosModule>('BlockerIos');
  if (!mod) return null;
  return {
    isMock: false,
    getAuthorization: async () => mod.getAuthorizationStatus(),
    requestAuthorization: async () => {
      try {
        const status = await mod.requestAuthorization();
        return status === 'approved' ? ok('approved') : err('denied');
      } catch {
        // FamilyControlsError (cancelled, restricted, conflict…) all land on E01.
        return err('denied');
      }
    },
    pickApps: async (current) => {
      try {
        const picked = parsePick(
          await mod.presentAppPicker(current?.platform === 'ios' ? current.token : null),
        );
        if (!picked) return err('cancelled');
        if (picked.count === 0) return err('empty');
        return ok({ platform: 'ios', ...picked });
      } catch {
        return err('unavailable');
      }
    },
    listInstalledApps: async () => [],
    applyRules: (rules) => mod.applyRules(rulesToNativeJson(rules)),
    startFocus: (endsAt, lockedCount) => mod.startFocus(endsAt, lockedCount),
    endFocus: () => mod.endFocus(),
    liftShields: (until) => mod.liftShields?.(until),
    getShieldEvents: async (since) =>
      parseShieldEvents((await mod.readShieldEvents?.(since)) ?? []),
    getUsageSummary: async () => null,
    resolveShield: () => {},
  };
}
