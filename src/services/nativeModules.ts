import * as Device from 'expo-device';
import { requireOptionalNativeModule } from 'expo';

/**
 * Native features (Screen Time, usage stats, HealthKit, …) don't work on simulators/emulators
 * or under Jest. Services fall back to their mock implementations when this is true.
 */
export const useMocks: boolean =
  process.env.NODE_ENV === 'test' ||
  !Device.isDevice ||
  process.env.EXPO_PUBLIC_NATIVE_MOCKS === '1';

/** Loads a local Expo module, or null when it isn't in this binary (Expo Go, web, tests). */
export function optionalModule<T>(name: string): T | null {
  try {
    return requireOptionalNativeModule<T & object>(name);
  } catch {
    return null;
  }
}
