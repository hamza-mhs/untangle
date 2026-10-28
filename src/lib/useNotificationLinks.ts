import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

/**
 * Tapping a local notification opens its `data.url` (Focus done, the shield's "Spend 10 min").
 * Also handles the notification that launched the app from cold.
 */
export function useNotificationLinks() {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
    };
    void Notifications.getLastNotificationResponseAsync?.()
      .then(open)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
