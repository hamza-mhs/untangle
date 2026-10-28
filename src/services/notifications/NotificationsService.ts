import type { Result } from '@/lib/result';

export type NotificationStatus = 'granted' | 'denied' | 'undetermined';

/** Permission side of notifications (scheduling lives in `schedule.ts`). */
export interface NotificationsService {
  getStatus(): Promise<NotificationStatus>;
  /** Shows the OS prompt when it still can. iOS never re-prompts after a denial. */
  request(): Promise<Result<'granted', 'denied'>>;
  /** E02 "Open Settings". */
  openSettings(): Promise<void>;
}
