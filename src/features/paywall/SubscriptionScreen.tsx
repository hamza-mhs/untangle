import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Header, Screen, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { purchases, useEntitlementStore, type Offering } from '@/services/purchases';

import { weeklyString } from './pricing';

/**
 * Subscription (`122:8755`): plan, weekly price, renewal, switch plan, manage in Google Play.
 * Plan switches go through the store's own purchase flow. TODO(1.5 on device): pass Play's
 * product-change mode once the real products exist.
 */
export function SubscriptionScreen() {
  const t = useT();
  const ent = useEntitlementStore((s) => s.entitlement);
  const setEnt = useEntitlementStore((s) => s.set);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void purchases.getOffering().then((r) => {
      if (r.ok) setOffering(r.value);
    });
  }, []);

  const current = offering?.plans.find((p) => p.id === ent.plan) ?? null;
  const other =
    offering?.plans.find((p) => p.id === (ent.plan === 'monthly' ? 'yearly' : 'monthly')) ?? null;

  const switchPlan = async () => {
    if (!other) return;
    setBusy(true);
    const r = await purchases.purchase(other);
    setBusy(false);
    if (r.ok) setEnt(r.value);
    else if (r.error !== 'cancelled')
      showToast({ title: t('paywall.toast.failed'), tone: 'neutral' });
  };

  const planName =
    ent.plan === 'lifetime'
      ? t('paywall.sub.lifetime')
      : t(`paywall.plans.${ent.plan === 'monthly' ? 'monthly' : 'yearly'}.name`);

  return (
    <Screen
      testID="subscription"
      gutter="tab"
      scroll
      header={<Header title={t('paywall.sub.title')} onBack={() => router.back()} />}>
      <View style={styles.body}>
        <Card>
          <Text variant="heading">
            {ent.isFamilyShared
              ? t('paywall.sub.family')
              : t('paywall.sub.plan', { plan: planName })}
          </Text>
          {current ? (
            <Text variant="body" tone="secondary">
              {`${current.priceString} · ${t('paywall.sub.weekly', { price: weeklyString(current) })}`}
            </Text>
          ) : null}
          {ent.expiresAt ? (
            <Text variant="body" tone="secondary">
              {t(ent.willRenew ? 'paywall.sub.renews' : 'paywall.sub.ends', {
                date: formatLongDate(ent.expiresAt),
              })}
            </Text>
          ) : null}
        </Card>
        {other && ent.plan !== 'lifetime' && !ent.isFamilyShared ? (
          <Button
            variant="secondary"
            loading={busy}
            label={t(other.id === 'monthly' ? 'paywall.sub.switch' : 'paywall.sub.switchYearly')}
            onPress={() => void switchPlan()}
          />
        ) : null}
        {!ent.isFamilyShared ? (
          <Button
            variant="secondary"
            label={t('paywall.sub.manage')}
            onPress={() => void purchases.openManageSubscriptions()}
          />
        ) : null}
        <Text variant="caption" tone="tertiary">
          {t('paywall.sub.note')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, marginTop: space.lg },
});
