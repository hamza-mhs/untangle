import type { ZodType } from 'zod';
import { create, type StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStateStorage } from './kv';

type Options<T> = {
  version?: number;
  partialize?: (s: T) => Partial<T>;
  /**
   * Validates what comes back from MMKV (CODE_STANDARDS: validate persisted data with zod).
   * Invalid or tampered data is dropped and the store starts from its defaults.
   */
  schema?: ZodType<unknown>;
};

/**
 * zustand store persisted to MMKV. Bump `version` and add a `migrate` when a store's shape
 * changes. Hydration is synchronous because MMKV is.
 */
export function createPersistedStore<T>(
  key: string,
  initializer: StateCreator<T, [], []>,
  options: Options<T> = {},
) {
  const { schema } = options;
  return create<T>()(
    persist(initializer, {
      name: key,
      version: options.version ?? 1,
      storage: createJSONStorage(() => kvStateStorage),
      // Only pass partialize when set: an explicit `undefined` replaces zustand's default.
      ...(options.partialize ? { partialize: options.partialize } : {}),
      // An older version: hand the old state to the schema merge below, which keeps what still
      // validates and drops the rest. Without a schema, start from defaults.
      migrate: (persisted) => (schema ? persisted : {}) as T,
      ...(schema
        ? {
            merge: (persisted: unknown, current: T): T => {
              const parsed = schema.safeParse(persisted);
              return parsed.success ? { ...current, ...(parsed.data as Partial<T>) } : current;
            },
          }
        : {}),
    }),
  );
}
