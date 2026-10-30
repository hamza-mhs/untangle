import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import { blocker, type InstalledApp, type TargetCounters } from '@/native';

import type { TargetKey } from './types';

/** Counters refresh on focus and every 30 s while visible (20-phase2 §6.6). */
export const COUNTERS_REFRESH_MS = 30_000;

export function useTodayCounters(): Record<TargetKey, TargetCounters> {
  const [counters, setCounters] = useState<Record<TargetKey, TargetCounters>>({});
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const load = () =>
        blocker
          .getTodayCounters()
          .then((c) => {
            if (alive) setCounters(c);
          })
          .catch(() => {});
      void load();
      const id = setInterval(() => void load(), COUNTERS_REFRESH_MS);
      return () => {
        alive = false;
        clearInterval(id);
      };
    }, []),
  );
  return counters;
}

type AppsState = {
  apps: InstalledApp[] | null;
  icons: Record<string, string | null>;
  load: (force?: boolean) => Promise<InstalledApp[]>;
  icon: (packageName: string) => void;
};

/** Installed apps, loaded once per session (and on demand). */
export const useAppsStore = create<AppsState>((set, get) => ({
  apps: null,
  icons: {},
  load: async (force = false) => {
    const have = get().apps;
    if (have && !force) return have;
    const apps = await blocker.getInstalledApps();
    set({ apps });
    return apps;
  },
  icon: (packageName) => {
    if (packageName in get().icons) return;
    set({ icons: { ...get().icons, [packageName]: null } });
    void blocker
      .getAppIcon(packageName)
      .then((uri) => set({ icons: { ...get().icons, [packageName]: uri } }))
      .catch(() => {});
  },
}));

export function useInstalledApps(): InstalledApp[] | null {
  const apps = useAppsStore((s) => s.apps);
  useEffect(() => {
    void useAppsStore
      .getState()
      .load()
      .catch(() => {});
  }, []);
  return apps;
}

/** Cached icon URI for an app (null = monogram). */
export function useAppIconUri(packageName: string | null): string | null {
  const uri = useAppsStore((s) => (packageName ? (s.icons[packageName] ?? null) : null));
  useEffect(() => {
    if (packageName) useAppsStore.getState().icon(packageName);
  }, [packageName]);
  return uri;
}
