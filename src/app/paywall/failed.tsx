import { router } from 'expo-router';

import { PrimaryButton, Sheet } from '@/design/components';
import { useT } from '@/i18n';
import { purchases } from '@/services/purchases';

/**
 * E05 · payment didn't go through (a store error that isn't user-cancelled). Over the paywall.
 * "Try again" returns to it; "Check payment method" opens the store's own page.
 */
export default function PurchaseFailed() {
  const t = useT();
  return (
    <Sheet
      testID="paywall.failed"
      icon="warning"
      iconTone="danger"
      title={t('paywall.failed.title')}
      sub={t('paywall.failed.sub')}
      body={t('paywall.failed.body')}
      actions={
        <>
          <PrimaryButton
            testID="paywall.failed.retry"
            label={t('common.tryAgain')}
            compact
            onPress={() => router.back()}
          />
          <PrimaryButton
            testID="paywall.failed.check"
            label={t('paywall.failed.check')}
            variant="outline"
            compact
            onPress={() => void purchases.openManageSubscriptions()}
          />
        </>
      }
    />
  );
}
