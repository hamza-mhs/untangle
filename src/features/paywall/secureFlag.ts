import * as SecureStore from 'expo-secure-store';

/**
 * Mirrors the trial start into secure storage so deleting + reinstalling the app doesn't grant
 * a fresh trial.
 * - iOS: Keychain items survive app deletion. TODO(verify): Apple has changed this behaviour
 *   in betas before — re-check on each major iOS release.
 * - Android: SecureStore data is removed on uninstall, so this only protects against
 *   "clear storage". A reinstall-proof check would need a server — out of scope (no backend).
 */
const KEY = 'untangle.trialStartedAt';

export async function readTrialFlag(): Promise<number | null> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export async function writeTrialFlag(startedAt: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, String(startedAt), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } catch {
    // Non-fatal: the MMKV copy still works for this install.
  }
}
