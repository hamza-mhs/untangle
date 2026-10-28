import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, PrimaryButton, Text } from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { onProActivated } from '@/features/paywall/usePaywall';
import { DevSkip } from '@/features/dev/DevSkip';
import { useT } from '@/i18n';
import { NO_ENTITLEMENT, purchases } from '@/services/purchases';

/**
 * E06 · waiting for approval (Ask to Buy, SCA or a bank). Pro switches on by itself through the
 * customer-info listener; if that happens while this is open, we move straight to P05.
 */
export default function PurchasePending() {
  const t = useT();
  useEffect(
    () =>
      purchases.onChange((e) => {
        if (!e.isActive) return;
        onProActivated(e);
        router.replace({ pathname: '/pro/success', params: { plan: e.plan ?? 'yearly' } });
      }),
    [],
  );
  const devApprove = () => {
    onProActivated({
      ...NO_ENTITLEMENT,
      isActive: true,
      plan: 'yearly',
      willRenew: true,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });
    router.replace({ pathname: '/pro/success', params: { plan: 'yearly' } });
  };
  return (
    <>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Ghost mood={0.5} width={size.ghost.state} />
          <Text variant="title.s" align="center" accessibilityRole="header" style={styles.title}>
            {t('paywall.pending.title')}
          </Text>
          <Text variant="body" tone="muted" align="center" style={styles.body}>
            {t('paywall.pending.body')}
          </Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            testID="paywall.pending.ok"
            label={t('common.ok')}
            variant="light"
            compact
            onPress={() => router.replace('/today')}
          />
        </View>
      </SafeAreaView>
      <DevSkip label="DEV · Approve purchase" onSkip={devApprove} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingTop: layout.state.ghostTop * 2,
    paddingHorizontal: layout.state.textX,
  },
  title: { marginTop: layout.state.titleTop },
  body: { marginTop: space.sm },
  footer: { paddingHorizontal: layout.gutter, paddingBottom: layout.onboarding.footerBottom },
});
