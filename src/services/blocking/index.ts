import { useMocks } from '../nativeModules';
import { createMockBlocking } from './blocking.mock';
import { createPlatformBlocking } from './platform';

export * from './BlockingService';

/**
 * The app's blocking service. Real native module on a device build; the mock on simulators,
 * Expo Go, the web preview and in tests (or when the native module isn't in the binary).
 */
export const blocking = (useMocks ? null : createPlatformBlocking()) ?? createMockBlocking();
