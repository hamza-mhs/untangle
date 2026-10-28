import { useSettingsStore } from '@/features/settings/store';
import { t } from '@/i18n';
import { cancelNotification, NOTIFICATION_IDS, scheduleAt } from '@/services/notifications';

/**
 * "Focus done · +15 min earned" at `endsAt`, deep-linking to Focus done (EDGE_CASES: a
 * session that ended while the app was closed). Respects the notifications setting.
 */
export async function scheduleFocusEnd(endsAt: number, earnedMinutes = 0): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  await scheduleAt(
    NOTIFICATION_IDS.focusEnd,
    endsAt,
    {
      title: t('notifications.focusEnd.title'),
      body:
        earnedMinutes > 0
          ? t('notifications.focusEnd.bodyEarned', { minutes: earnedMinutes })
          : t('notifications.focusEnd.body'),
    },
    '/focus/done',
  );
}

export function cancelFocusEnd(): Promise<void> {
  return cancelNotification(NOTIFICATION_IDS.focusEnd);
}
