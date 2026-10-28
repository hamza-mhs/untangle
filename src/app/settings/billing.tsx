import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ErrorBoundary,
  Icon,
  IconButton,
  ListGroup,
  ListRow,
  Text,
  type TextTone,
} from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { onProActivated, restoredLine } from '@/features/paywall/usePaywall';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { purchases, useEntitlementStore } from '@/services/purchases';

/**
 * P09 · Plan & billing. Plan card (Active / In grace / Expires {date}; "via Family"; Lifetime
 * has no renewal and no Cancel), Change plan, Manage in the store, Restore (inline offline
 * error), Family Sharing, the "Free, always" list and the promise.
 */
export default function Billing() {
  const t = useT();
  const e = useEntitlementStore((s) => s.entitlement);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const store = t(Platform.OS === 'ios' ? 'settings.appStore' : 'settings.playStore');

  const planName = e.isActive
    ? t('settings.billingPlan', {
        plan: e.plan ? t(`paywall.plans.${e.plan}.name`) : t('paywall.plans.pro'),
      })
    : t('settings.billingFree');
  const status: { label: string; tone: TextTone; bg: 'success' | 'warning' | 'neutral' } | null =
    !e.isActive
      ? null
      : e.isInGrace
        ? { label: t('settings.statusGrace'), tone: 'warning', bg: 'warning' }
        : !e.willRenew && e.expiresAt
          ? {
              label: t('settings.statusExpires', { date: formatLongDate(e.expiresAt) }),
              tone: 'muted',
              bg: 'neutral',
            }
          : { label: t('settings.statusActive'), tone: 'success', bg: 'success' };
  const sub = !e.isActive
    ? t('settings.billingFreeSub')
    : e.plan === 'lifetime'
      ? t('settings.lifetime')
      : e.isFamilyShared
        ? t('settings.viaFamily')
        : e.expiresAt
          ? t(e.willRenew ? 'settings.renews' : 'settings.ends', {
              date: formatLongDate(e.expiresAt),
            })
          : '';

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreError(null);
    const r = await purchases.restore();
    setIsRestoring(false);
    if (r.ok) {
      onProActivated(r.value);
      showToast({
        title: t('paywall.restore.okTitle'),
        sub: restoredLine(r.value),
        tone: 'success',
      });
    } else if (r.error === 'none') router.push('/paywall/restore-none');
    else setRestoreError(t('paywall.restore.offline', { store }));
  };

  const chevron = <Icon name="chevronRight" size={size.icon.sm} color={color.text.muted} />;
  const canCancel = e.isActive && e.plan !== 'lifetime' && !e.isFamilyShared && e.willRenew;

  return (
    <ErrorBoundary name="billing">
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text variant="title.page" accessibilityRole="header">
            {t('settings.billing')}
          </Text>
          <IconButton
            icon="close"
            accessibilityLabel={t('common.close')}
            onPress={() => router.back()}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.plan} testID="billing.plan" accessible>
            <View style={styles.planTop}>
              <Text variant="title.s">{planName}</Text>
              {status ? (
                <View style={[styles.status, statusBg[status.bg]]}>
                  <Text variant="caption.strong" tone={status.tone}>
                    {status.label}
                  </Text>
                </View>
              ) : null}
            </View>
            {sub ? (
              <Text variant="label" tone="muted" style={styles.planSub}>
                {sub}
              </Text>
            ) : null}
          </View>
          <ListGroup>
            <ListRow
              title={e.isActive ? t('settings.changePlan') : t('settings.seePlans')}
              onPress={() => router.push('/paywall?from=settings')}
              trailing={chevron}
            />
            {e.isActive && !e.isFamilyShared ? (
              <ListRow
                title={t('settings.manage', { store })}
                subtitle={t('settings.manageSub')}
                onPress={() =>
                  canCancel
                    ? router.push('/settings/cancel')
                    : void purchases.openManageSubscriptions()
                }
                trailing={chevron}
              />
            ) : null}
            <ListRow
              title={isRestoring ? t('common.loading') : t('paywall.main.restore')}
              {...(restoreError ? { subtitle: restoreError } : {})}
              onPress={() => void handleRestore()}
              trailing={chevron}
            />
            <ListRow
              title={t('settings.family')}
              subtitle={t('settings.familySub')}
              trailing={
                <Text variant="label" tone="muted">
                  {e.isFamilyShared ? t('settings.on') : t('settings.off')}
                </Text>
              }
            />
          </ListGroup>
          <View>
            <Text variant="label" tone="muted" style={styles.label}>
              {t('onboarding.trial.freeLabel')}
            </Text>
            <View style={styles.free}>
              <Text variant="label" tone="secondary">
                {t('settings.freeList')}
              </Text>
            </View>
          </View>
          <Text variant="caption.s" tone="faint" align="center">
            {t('settings.promise')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screen.titleX,
    paddingTop: layout.screen.top,
  },
  content: { padding: layout.gutter, gap: space.lg },
  plan: { ...rounded(radius.l), backgroundColor: color.bg.surface, padding: space.lg + 2 },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planSub: { marginTop: space.xs + 2 },
  status: {
    height: size.statusPill - 2,
    ...pill(size.statusPill - 2),
    paddingHorizontal: space.md - 1,
    justifyContent: 'center',
  },
  label: { marginBottom: space.sm, paddingHorizontal: layout.screen.labelX - layout.gutter },
  free: {
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: layout.screen.cardPaddingY,
    paddingHorizontal: layout.screen.cardPaddingX,
  },
});

const statusBg = StyleSheet.create({
  success: { backgroundColor: color.status.successSoftBg },
  warning: { backgroundColor: color.status.warningSoftBg },
  neutral: { backgroundColor: color.bg.raisedHigh },
});
