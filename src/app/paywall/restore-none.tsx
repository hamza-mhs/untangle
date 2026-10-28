import { router } from 'expo-router';
import { Platform } from 'react-native';

import { PrimaryButton, Sheet } from '@/design/components';
import { useT } from '@/i18n';

/** E07 · restore found nothing, with the "different Apple ID / Google account" hint. */
export default function RestoreNone() {
  const t = useT();
  return (
    <Sheet
      testID="paywall.restoreNone"
      title={t('paywall.restore.noneTitle')}
      body={t(
        Platform.OS === 'ios' ? 'paywall.restore.noneBodyIos' : 'paywall.restore.noneBodyAndroid',
      )}
      actions={
        <>
          <PrimaryButton
            testID="paywall.restoreNone.plans"
            label={t('paywall.restore.seePlans')}
            compact
            onPress={() => router.replace('/paywall')}
          />
          <PrimaryButton
            testID="paywall.restoreNone.close"
            label={t('common.close')}
            variant="outline"
            compact
            onPress={() => router.back()}
          />
        </>
      }
    />
  );
}
