import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { err, ok } from '@/lib/result';

import { useDevMocksStore } from '../devMocks';
import type { NotificationsService, NotificationStatus } from './NotificationsService';

export * from './NotificationsService';
export * from './schedule';

const toStatus = (p: Notifications.NotificationPermissionsStatus): NotificationStatus =>
  p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';

/**
 * Local notifications only. The real OS prompt works on simulators and emulators (no
 * entitlement needed), so the mock only kicks in when a dev switch forces allow / deny.
 */
export const notifications: NotificationsService = {
  getStatus: async () => {
    const forced = useDevMocksStore.getState().notifications;
    if (forced !== 'system') return forced === 'allow' ? 'granted' : 'denied';
    try {
      return toStatus(await Notifications.getPermissionsAsync());
    } catch {
      return 'undetermined';
    }
  },
  request: async () => {
    const forced = useDevMocksStore.getState().notifications;
    if (forced !== 'system') return forced === 'allow' ? ok('granted') : err('denied');
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return ok('granted');
      if (!current.canAskAgain) return err('denied');
      const asked = await Notifications.requestPermissionsAsync();
      return asked.granted ? ok('granted') : err('denied');
    } catch {
      return err('denied');
    }
  },
  openSettings: () => Linking.openSettings(),
};
