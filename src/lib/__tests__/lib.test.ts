import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';
import { haptics } from '@/lib/haptics';

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
