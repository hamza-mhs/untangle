import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { useSettingsStore } from '@/features/settings/store';
import { haptics } from '@/lib/haptics';
import { cancelFocusEnd, scheduleFocusEnd } from '@/features/focus/focusNotifications';
import { scheduleTrialNotice } from '@/features/paywall/trialNotifications';
import { NOTIFICATION_IDS } from '@/services/notifications';
import { DAY } from '@/lib/time';

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
}));

beforeEach(() => jest.clearAllMocks());

describe('haptics wrapper', () => {
  test('fires when enabled, silent when the user turned it off', () => {
    useSettingsStore.getState().setHapticsEnabled(true);
    haptics.tap();
    haptics.success();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');

    jest.clearAllMocks();
    useSettingsStore.getState().setHapticsEnabled(false);
    haptics.tap();
    haptics.select();
    haptics.error();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

describe('local notifications', () => {
  beforeEach(() => useSettingsStore.getState().setNotificationsEnabled(true));

  test('day-5 trial notice is scheduled 5 days after the start', async () => {
    const start = Date.now();
    await scheduleTrialNotice(start);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: NOTIFICATION_IDS.trialNotice,
        content: { title: 'Two days of Pro left', body: expect.stringContaining('No card') },
        trigger: { type: 'date', date: start + 5 * DAY },
      }),
    );
  });

  test('focus end replaces any previous one and can be cancelled', async () => {
    const endsAt = Date.now() + 25 * 60_000;
    await scheduleFocusEnd(endsAt);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      NOTIFICATION_IDS.focusEnd,
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    await cancelFocusEnd();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  });

  test('nothing is scheduled in the past or when notifications are off', async () => {
    await scheduleFocusEnd(Date.now() - 1000);
    useSettingsStore.getState().setNotificationsEnabled(false);
    await scheduleFocusEnd(Date.now() + 60_000);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
