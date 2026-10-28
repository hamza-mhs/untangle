import { useSettingsStore } from '@/features/settings/store';
import { t } from '@/i18n';
import { NOTIFICATION_IDS, scheduleAt } from '@/services/notifications';

import { trialMilestones } from './trial';

/** Day-5 "Pro ends in 2 days" notice (respects the user's notifications setting). */
export async function scheduleTrialNotice(trialStartedAt: number): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  await scheduleAt(NOTIFICATION_IDS.trialNotice, trialMilestones(trialStartedAt).noticeAt, {
    title: t('notifications.trialNotice.title'),
    body: t('notifications.trialNotice.body'),
  });
}
