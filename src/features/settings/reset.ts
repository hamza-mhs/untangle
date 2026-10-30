import { blocker } from '@/native';
import { db } from '@/storage/db/client';
import { dailySummary, detours, focusSessions, gameBests, gameResults } from '@/storage/db/schema';
import { kv, STORE_KEYS } from '@/storage/kv';

/**
 * Delete my data (20-phase2-core-app §9): locks, progress, streak and game history are erased
 * from this phone. The Pro entitlement is on the Google account, so its cache is kept.
 */
export async function deleteMyData(resetStores: () => void): Promise<void> {
  await blocker.setLocks([]).catch(() => {});
  await blocker.endFocusSession().catch(() => {});
  for (const table of [gameResults, gameBests, dailySummary, detours, focusSessions]) {
    try {
      db.delete(table).run();
    } catch {
      // Keep going: the rest still clears.
    }
  }
  for (const key of Object.values(STORE_KEYS)) {
    if (key !== STORE_KEYS.entitlement) kv.remove(key);
  }
  resetStores();
}
