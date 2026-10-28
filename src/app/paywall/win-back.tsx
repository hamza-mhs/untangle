import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ghost, IconButton, PrimaryButton, Text, TextLink } from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { blocking } from '@/services/blocking';
import { purchases, useEntitlementStore } from '@/services/purchases';

const DAY = 24 * 60 * 60 * 1000;
const MONTH_DAYS = 30;

/**
 * P12 · win-back, once, 60+ days after Pro ended. The offer itself (price, eligibility) is an
 * Apple win-back offer / Google Play offer configured in the stores, not in code; DECIDE item:
 * the designs show $14.99 first year. The price shown is whatever the store returns.
 */
export default function WinBack() {
  const t = useT();
  const endedAt = useEntitlementStore((s) => s.entitlement.endedAt);
  const [now] = useState(() => Date.now());
  const [offerPrice, setOfferPrice] = useState<string | null>(null);
  const [yearPrice, setYearPrice] = useState<string | null>(null);
  const [opens, setOpens] = useState(0);
  const months = endedAt ? Math.max(2, Math.round((now - endedAt) / (MONTH_DAYS * DAY))) : 2;

  useEffect(() => {
    let alive = true;
    void purchases.getOffering().then((r) => {
      if (!alive || !r.ok) return;
      setOfferPrice(r.value.winBack?.priceString ?? null);
      setYearPrice(r.value.plans.find((p) => p.id === 'yearly')?.priceString ?? null);
    });
    if (endedAt) {
      void blocking.getShieldEvents(endedAt).then((events) => {
        if (alive)
          setOpens(events.filter((e) => e.strength === 'pause' && e.outcome === 'opened').length);
      });
    }
    return () => {
      alive = false;
    };
  }, [endedAt]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.closeRow}>
        <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={close} />
      </View>
      <View style={styles.content}>
        <View style={styles.ghost}>
          <Ghost mood={0.3} width={size.ghost.state} />
        </View>
        <Text variant="title.m" accessibilityRole="header" style={styles.title}>
          {t('paywall.winBack.title', { count: months })}
        </Text>
        <Text variant="body" tone="muted" style={styles.body}>
          {opens > 0 ? `${t('paywall.winBack.line', { count: opens })} ` : ''}
          {t('paywall.winBack.offerLead')}
        </Text>
        {offerPrice ? (
          <View style={styles.offer} accessible>
            <Text variant="micro" tone="accent">
              {t('paywall.winBack.overline')}
            </Text>
            <View style={styles.priceRow}>
              <Text variant="title.page">{offerPrice}</Text>
              <Text variant="body" tone="muted">
                {t('paywall.winBack.firstYear')}
              </Text>
            </View>
            {yearPrice ? (
              <Text variant="meta" tone="secondary">
                {t('paywall.winBack.then', { price: yearPrice })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          testID="paywall.winBack.cta"
          label={
            offerPrice ? t('paywall.winBack.cta', { price: offerPrice }) : t('paywall.main.keepPro')
          }
          compact
          onPress={() => router.replace('/paywall?from=expiry')}
        />
        <TextLink label={t('paywall.winBack.noThanks')} tone="primary" onPress={close} />
        <Text variant="caption.s" tone="faint" align="center">
          {t('paywall.winBack.legal')}
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
  content: { flex: 1, paddingHorizontal: layout.screen.x },
  ghost: { alignItems: 'center', marginTop: space.xl },
  title: { marginTop: space.xxl, paddingHorizontal: space.xs },
  body: { marginTop: space.md, paddingHorizontal: space.xs },
  offer: {
    marginTop: space.xxl,
    ...rounded(radius.l),
    backgroundColor: color.bg.raised,
    borderWidth: size.selectedRing,
    borderColor: color.accent.primary,
    padding: space.lg + 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm + 2,
    marginTop: space.xs + 2,
  },
  footer: {
    gap: space.xs,
    paddingHorizontal: layout.gutter,
    paddingBottom: space.sm,
  },
});
