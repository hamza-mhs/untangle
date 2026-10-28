import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, IconButton, PressableScale, PrimaryButton, Text } from '@/design/components';
import { color, layout, radius, rounded, space } from '@/design/tokens';
import { usePaywallStore } from '@/features/paywall/paywallStore';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { purchases, useEntitlementStore } from '@/services/purchases';

const REASONS = ['price', 'freeEnough', 'tooStrict', 'notNow', 'broke'] as const;

/**
 * P10 · cancelling. Optional reasons, "Switch to monthly instead", "Keep Pro" first, and the
 * honest exit: we can't cancel in-app (iOS showManageSubscriptions, Play subscriptions link),
 * and we don't hide the button.
 */
export default function Cancel() {
  const t = useT();
  const e = useEntitlementStore((s) => s.entitlement);
  const logReasons = usePaywallStore((s) => s.logCancelReasons);
  const [reasons, setReasons] = useState<string[]>([]);
  const until = e.expiresAt ? formatLongDate(e.expiresAt) : '';
  const store = t(Platform.OS === 'ios' ? 'settings.appStore' : 'settings.playStore');

  const toggle = (r: string) =>
    setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  const handleContinue = () => {
    if (reasons.length) logReasons(reasons);
    void purchases.openManageSubscriptions();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.closeRow}>
        <IconButton
          icon="close"
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title.m" accessibilityRole="header">
          {t('settings.cancel.title')}
        </Text>
        <Text variant="body" tone="muted" style={styles.body}>
          {t('settings.cancel.body', { date: until })}
        </Text>
        <Text variant="label" tone="muted" style={styles.label}>
          {t('settings.cancel.reasonsLabel')}
        </Text>
        <View style={styles.chips}>
          {REASONS.map((r) => (
            <Chip
              key={r}
              testID={`cancel.reason.${r}`}
              label={t(`settings.cancel.reasons.${r}`)}
              mode="multi"
              surface="canvas"
              selected={reasons.includes(r)}
              onPress={() => toggle(r)}
            />
          ))}
        </View>
        {e.plan === 'yearly' ? (
          <PressableScale
            testID="cancel.switchMonthly"
            accessibilityRole="button"
            accessibilityLabel={t('settings.cancel.switchTitle')}
            onPress={() => router.push('/paywall?from=settings')}
            style={styles.offer}>
            <Text variant="label.strong">{t('settings.cancel.switchTitle')}</Text>
            <Text variant="meta" tone="muted" style={styles.offerSub}>
              {t('settings.cancel.switchSub', { date: until })}
            </Text>
          </PressableScale>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="cancel.keep"
          label={t('settings.cancel.keep')}
          compact
          onPress={() => router.back()}
        />
        <PrimaryButton
          testID="cancel.continue"
          label={t('settings.cancel.continue', { store })}
          variant="outline"
          compact
          onPress={handleContinue}
        />
        <Text variant="caption.s" tone="faint" align="center">
          {t('settings.cancel.legal')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  closeRow: {
    alignItems: 'flex-end',
    paddingHorizontal: layout.screen.x,
    paddingTop: layout.screen.top,
  },
  content: { paddingHorizontal: layout.screen.titleX, paddingBottom: space.xl },
  body: { marginTop: space.sm },
  label: { marginTop: space.xxl, marginBottom: space.sm, paddingHorizontal: space.sm + 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginHorizontal: -space.xs },
  offer: {
    marginTop: space.xxl,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: layout.screen.cardPaddingY,
    paddingHorizontal: layout.screen.cardPaddingX,
    marginHorizontal: -space.xs,
  },
  offerSub: { marginTop: space.xxs },
  footer: {
    gap: layout.state.actionsGap,
    paddingHorizontal: layout.gutter,
    paddingBottom: space.sm,
  },
});
