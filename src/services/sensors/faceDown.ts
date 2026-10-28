import { DeviceMotion } from 'expo-sensors';

import { useDevMocksStore } from '../devMocks';

/**
 * Face-down detection (OB12 quiet minute, lights-out). VERIFIED against expo-sensors 58's
 * native code: iOS reports CoreMotion gravity × g, Android reports accelerometer − 2·gravity,
 * so on both platforms `accelerationIncludingGravity.z ≈ +9.8` when the screen faces the floor.
 */
export const FACE_DOWN_Z = 8.5;

export function isFaceDown(z: number): boolean {
  return z > FACE_DOWN_Z;
}

/** False when there's no usable motion sensor (→ "Hold to continue" fallback). */
export async function isFaceDownAvailable(): Promise<boolean> {
  if (useDevMocksStore.getState().sensor === 'none') return false;
  try {
    return await DeviceMotion.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Calls back on every face-down ↔ face-up change. Returns an unsubscribe. */
export function watchFaceDown(onChange: (isDown: boolean) => void, intervalMs = 250): () => void {
  let last: boolean | null = null;
  DeviceMotion.setUpdateInterval(intervalMs);
  const sub = DeviceMotion.addListener((m) => {
    const isDown = isFaceDown(m.accelerationIncludingGravity?.z ?? 0);
    if (isDown !== last) {
      last = isDown;
      onChange(isDown);
    }
  });
  return () => sub.remove();
}
