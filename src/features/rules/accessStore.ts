import { create } from 'zustand';

import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { blocking } from '@/services/blocking';

/**
 * Live blocking access, checked on launch and every foreground (EDGE_CASES › Permissions:
 * "Screen Time revoked later"). Not persisted: the OS is the source of truth.
 * `skipped` = the user chose "Continue without blocking" (E01) and hasn't fixed it since.
 */
export type BlockingAccessStatus = 'approved' | 'denied' | 'notDetermined' | 'skipped';

type AccessStore = { status: BlockingAccessStatus; set: (s: BlockingAccessStatus) => void };

export const useAccessStore = create<AccessStore>((set) => ({
  status: 'approved',
  set: (status) => set({ status }),
}));

export async function refreshBlockingAccess(): Promise<BlockingAccessStatus> {
  const os = await blocking.getAuthorization();
  const answer = useOnboardingStore.getState().blocking;
  const status: BlockingAccessStatus =
    os === 'approved' ? 'approved' : answer === 'skipped' ? 'skipped' : os;
  useAccessStore.getState().set(status);
  return status;
}

/** "Fix" on HomeBOff / E09: ask again; Android opens Settings and we re-check on resume. */
export async function fixBlockingAccess(): Promise<BlockingAccessStatus> {
  const result = await blocking.requestAuthorization();
  if (result.ok) useOnboardingStore.getState().setAnswer('blocking', 'approved');
  return refreshBlockingAccess();
}
