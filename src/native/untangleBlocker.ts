import { useDevMocksStore } from '@/services/devMocks';

import { optionalModule } from './env';
import { mockBlocker } from './untangleBlocker.mock';
import type { UntangleBlocker } from './untangleBlocker.types';

/**
 * The one door to modules/untangle-blocker (Kotlin, Expo Modules API). JS edits locks and
 * settings; the native side is the source of truth for enforcement (02-android-platform §5).
 * Falls back to the mock when the module isn't in this build (tests, before 1.3) or when the
 * dev menu forces it.
 */
type NativeModule = Omit<UntangleBlocker, 'isMock'>;

const native = optionalModule<NativeModule>('UntangleBlocker');

/**
 * The native module as an UntangleBlocker. Expo modules are JSI host objects: their functions
 * can't be spread into a plain object, so they are looked up on each access.
 */
const nativeBlocker: UntangleBlocker | null = native
  ? new Proxy({} as UntangleBlocker, {
      get(_t, prop: string) {
        if (prop === 'isMock') return false;
        const value = (native as unknown as Record<string, unknown>)[prop];
        return typeof value === 'function'
          ? (value as (...a: unknown[]) => unknown).bind(native)
          : value;
      },
    })
  : null;

function current(): UntangleBlocker {
  const forceMock = __DEV__ && useDevMocksStore.getState().forceNativeMock;
  if (!nativeBlocker || forceMock || process.env.NODE_ENV === 'test') return mockBlocker;
  return nativeBlocker;
}

/** Resolved on every call, so the dev-menu switch takes effect immediately. */
export const blocker: UntangleBlocker = new Proxy({} as UntangleBlocker, {
  get(_t, prop: keyof UntangleBlocker) {
    const impl = current();
    const value = impl[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(impl) : value;
  },
});

export const hasNativeBlocker = native !== null;
export * from './untangleBlocker.types';
