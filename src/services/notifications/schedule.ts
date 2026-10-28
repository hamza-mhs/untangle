import * as Notifications from 'expo-notifications';

import { useSettingsStore } from '@/features/settings/store';
import { t } from '@/i18n';

/**
 * Local notifications only — no push token, no server. Each kind has a stable identifier so
 * rescheduling replaces rather than duplicates. Callers own the copy (i18n) and the user's
 * on/off setting; this module only talks to the OS.
 */
export const NOTIFICATION_IDS = {
  trialNotice: 'trial-day-5',
  focusEnd: 'focus-end',
} as const;

export type NotificationId = (typeof NOTIFICATION_IDS)[keyof typeof NOTIFICATION_IDS];

/** Call once at launch (lib/bootstrap). Foreground notifications show as banners, silently. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function cancelNotification(id: NotificationId): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** Schedules (or replaces) a one-off notification. Past dates are ignored. */
export async function scheduleAt(
  id: NotificationId,
  date: number,
  content: { title: string; body: string },
  /** In-app route opened when the notification is tapped (see useNotificationLinks). */
  url?: string,
): Promise<void> {
  if (date <= Date.now()) return;
  await cancelNotification(id);
  // Discreet notifications (FSettings › Privacy): generic text, no app names or titles.
  const shown = useSettingsStore.getState().discreetNotifications
    ? { title: t('notifications.discreet.title'), body: t('notifications.discreet.body') }
    : content;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: url ? { ...shown, data: { url } } : shown,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
