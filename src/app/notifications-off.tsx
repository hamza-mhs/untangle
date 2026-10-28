import { router } from 'expo-router';

import { PrimaryButton, Sheet } from '@/design/components';
import { useT } from '@/i18n';
import { notifications } from '@/services/notifications';

/**
 * E02 · Notifications are off. A native formSheet (root layout), shown once on the first
 * Home open after OB11 was denied (see useNotificationsOffSheet).
 */
export default function NotificationsOff() {
  const t = useT();
  const close = () => {
    if (router.canGoBack()) router.back();
  };
  return (
    <Sheet
      testID="e02.sheet"
      icon="bellOff"
      title={t('edge.notificationsOff.title')}
      sub={t('edge.notificationsOff.sub')}
      body={t('edge.notificationsOff.body')}
      actions={
        <>
          <PrimaryButton
            testID="e02.openSettings"
            label={t('edge.notificationsOff.openSettings')}
            variant="light"
            compact
            onPress={() => {
              close();
              void notifications.openSettings();
            }}
          />
          <PrimaryButton
            testID="e02.notNow"
            label={t('edge.notificationsOff.notNow')}
            variant="outline"
            compact
            onPress={close}
          />
        </>
      }
    />
  );
}
