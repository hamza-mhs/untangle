import type { BlockingService } from './BlockingService';

/** Web / other platforms: no native blocking — the mock is used instead. */
export function createPlatformBlocking(): BlockingService | null {
  return null;
}
