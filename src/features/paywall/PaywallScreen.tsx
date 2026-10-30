import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  Button,
  Glow,
  Header,
  Icon,
  PressableScale,
  RadioDot,
  Screen,
  Skeleton,
  Text,
  type HeaderProps,
} from '@/design/components';
import { PaywallTiles } from '@/design/illustrations';
import { color, glow, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { showToast } from '@/lib/toast';
import {
  purchases,
  useEntitlementStore,
  type Offering,
  type Plan,
  type PlanId,
} from '@/services/purchases';

import { usePaywallStore } from './paywallStore';
import { ctaKind, savePercent, weeklyString } from './pricing';

/** Close (✕) appears after this long, or at once when prices can't load (§2.15). */
export const CLOSE_DELAY_MS = 2000;
/** Shown in the in-app feature list ("All {n} focus games"). */
const GAME_COUNT = 12;
/** Legal pages. TODO(owner): real URLs before release. */
export const LEGAL_URLS = {
  terms: 'https://untangle.app/terms',
  privacy: 'https://untangle.app/privacy',
} as const;

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; offering: Offering };

export type PaywallOutcome = 'pro' | 'free' | 'pending';

export type PaywallScreenProps = {
  /** Where the user goes next: bought or restored Pro, closed (free), or payment pending. */
  onDone: (outcome: PaywallOutcome) => void;
  /** Onboarding progress / back, passed to the header. */
  header?: Pick<HeaderProps, 'onBack' | 'progress'>;
  /** `trial` = onboarding (§2.15); `inApp` = Settings, 4th lock, locked game… (20-phase2 §10). */
  variant?: 'trial' | 'inApp';
  testID?: string;
};

function FooterLink({
  label,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
    </PressableScale>
  );
}

function PlanCard({
  plan,
  selected,
  disabled,
  save,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  disabled: boolean;
  save: number | null;
  onPress: () => void;
}) {
  const t = useT();
  const name = t(`paywall.plans.${plan.id}.name`);
  const weekly = weeklyString(plan);
  const sub =
    plan.id === 'yearly'
      ? t('paywall.plans.justWeekly', { price: weekly })
      : t('paywall.plans.weekly', { price: weekly });
  const per = t(`paywall.plans.${plan.id}.per`);
  return (
    <PressableScale
      testID={`paywall.plan.${plan.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${name}, ${plan.priceString} ${per}, ${sub}${save ? `, ${t('paywall.save', { percent: save })}` : ''}`}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected ? styles.cardOn : null]}>
      {save ? (
        <View style={styles.badge}>
          <Text variant="micro" tone="onLight">
            {t('paywall.save', { percent: save })}
          </Text>
        </View>
      ) : null}
      <RadioDot selected={selected} />
      <View style={styles.cardText}>
        <Text variant="bodyLg">{name}</Text>
        <Text variant="caption" tone="secondary">
          {sub}
        </Text>
      </View>
      <View style={styles.cardPrice}>
        <Text variant="statMd">{plan.priceString}</Text>
        <Text variant="caption" tone="secondary">
          {per}
        </Text>
      </View>
    </PressableScale>
  );
}

/**
 * The one paywall (10-phase1-onboarding §2.15): yearly and monthly from the RevenueCat offering
 * `default`, prices from the store, close after 2 s to the free tier.
 */
export function PaywallScreen({
  onDone,
  header,
  variant = 'trial',
  testID = 'paywall',
}: PaywallScreenProps) {
  const t = useT();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [picked, setPicked] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [closeShown, setCloseShown] = useState(false);
  const setEntitlement = useEntitlementStore((s) => s.set);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    void purchases.getOffering().then((r) => {
      if (alive) setLoad(r.ok ? { state: 'ready', offering: r.value } : { state: 'failed' });
    });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const retry = () => {
    setLoad({ state: 'loading' });
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    usePaywallStore.getState().markShown();
    const timer = setTimeout(() => setCloseShown(true), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const plans =
    load.state === 'ready' ? load.offering.plans.filter((p) => p.id !== 'lifetime') : [];
  const yearly = plans.find((p) => p.id === 'yearly');
  const monthly = plans.find((p) => p.id === 'monthly');
  const plan = plans.find((p) => p.id === picked) ?? plans[0];
  const save = yearly && monthly ? savePercent(yearly.price, monthly.price) : null;

  const buy = async () => {
    if (!plan) return;
    setBusy('buy');
    const r = await purchases.purchase(plan);
    setBusy(null);
    if (r.ok) {
      setEntitlement(r.value);
      onDone('pro');
      return;
    }
    switch (r.error) {
      case 'cancelled':
        return;
      case 'pending':
        showToast({ title: t('paywall.toast.pending'), tone: 'neutral' });
        onDone('pending');
        return;
      case 'offline':
        showToast({ title: t('paywall.toast.offline'), tone: 'neutral' });
        return;
      case 'unavailable':
        showToast({ title: t('paywall.toast.unavailable'), tone: 'neutral' });
        return;
      default:
        showToast({ title: t('paywall.toast.failed'), tone: 'neutral' });
    }
  };

  const restore = async () => {
    setBusy('restore');
    const r = await purchases.restore();
    setBusy(null);
    if (r.ok) {
      setEntitlement(r.value);
      showToast({ title: t('paywall.toast.restored'), tone: 'success' });
      onDone('pro');
    } else if (r.error === 'none') {
      showToast({ title: t('paywall.toast.noPurchase'), tone: 'neutral' });
    } else {
      showToast({ title: t('paywall.toast.offline'), tone: 'neutral' });
    }
  };

  const failed = load.state === 'failed';
  const showClose = closeShown || failed;
  const ctaLabel = plan ? t(`paywall.cta.${ctaKind(plan)}`) : t('paywall.cta.trial');
  const fine =
    variant === 'inApp' && plan
      ? t(plan.id === 'monthly' ? 'paywall.inApp.fine.monthly' : 'paywall.inApp.fine.yearly', {
          price: plan.priceString,
        })
      : plan && plan.hasTrial
        ? t(`paywall.fine.trial.${plan.id === 'monthly' ? 'monthly' : 'yearly'}`, {
            price: plan.priceString,
          })
        : plan
          ? t(`paywall.fine.plain.${plan.id === 'monthly' ? 'monthly' : 'yearly'}`, {
              price: plan.priceString,
            })
          : '';

  const close = (
    <PressableScale
      testID={`${testID}.close`}
      accessibilityRole="button"
      accessibilityLabel={t('common.close')}
      hitSlop={(size.touch - size.backChip) / 2}
      onPress={() => onDone('free')}
      style={[styles.close, showClose ? null : styles.hidden]}
      disabled={!showClose}>
      <Icon name="close" size={size.icon.sm} color={color.text.primary} />
    </PressableScale>
  );

  return (
    <Screen
      testID={testID}
      scroll
      background={<Glow {...glow.paywall} />}
      header={<Header {...header} right={close} />}
      footer={
        <>
          <Button
            testID={`${testID}.cta`}
            variant="brand"
            label={ctaLabel}
            onPress={() => void buy()}
            loading={busy === 'buy'}
            disabled={load.state !== 'ready' || busy !== null}
          />
          {fine ? (
            <Text variant="caption" tone="tertiary">
              {fine}
            </Text>
          ) : null}
          <View style={styles.footerLinks}>
            <FooterLink
              testID={`${testID}.restore`}
              label={t('paywall.restore')}
              disabled={busy !== null || failed}
              onPress={() => void restore()}
            />
            <Text variant="caption" tone="tertiary">
              ·
            </Text>
            <FooterLink
              label={t('paywall.terms')}
              onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
            />
            <Text variant="caption" tone="tertiary">
              ·
            </Text>
            <FooterLink
              label={t('paywall.privacy')}
              onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
            />
          </View>
        </>
      }>
      <View style={styles.body}>
        <View style={styles.art}>
          <PaywallTiles />
        </View>
        <Text variant="titleLg" accessibilityRole="header">
          {t(variant === 'inApp' ? 'paywall.inApp.title' : 'paywall.title')}
        </Text>
        {variant === 'inApp' ? (
          <View style={styles.features}>
            {(['block', 'games', 'progress'] as const).map((k) => (
              <View key={k} style={styles.feature}>
                <Icon name="check" size={size.icon.sm} color={color.signal.success} />
                <Text variant="body" tone="body" style={styles.flex}>
                  {t(`paywall.inApp.features.${k}`, { count: GAME_COUNT })}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="body" tone="body">
            {t('paywall.body')}
          </Text>
        )}
        <View style={styles.cards}>
          {load.state === 'loading' ? (
            <>
              <Skeleton height={size.listRow + space.xl} testID={`${testID}.skeleton`} />
              <Skeleton height={size.listRow + space.xl} />
            </>
          ) : null}
          {failed ? (
            <View style={styles.failed} testID={`${testID}.failed`}>
              <Text variant="bodyStrong" accessibilityLiveRegion="polite">
                {t('paywall.failed')}
              </Text>
              <Button variant="secondary" size="md" label={t('common.tryAgain')} onPress={retry} />
            </View>
          ) : null}
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              selected={p.id === plan?.id}
              disabled={busy !== null}
              save={p.id === 'yearly' && save ? save : null}
              onPress={() => setPicked(p.id)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const ART_HEIGHT = 110;
const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.sm },
  art: { height: ART_HEIGHT, marginBottom: space.lg },
  cards: { gap: space.md, marginTop: space.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: size.listRow + space.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: color.surface.lineStrong,
    backgroundColor: color.surface.card,
  },
  cardOn: { borderColor: color.brand.violetLight, backgroundColor: color.brand.violetSoft },
  cardText: { flex: 1, gap: 2 },
  cardPrice: { alignItems: 'flex-end' },
  badge: {
    position: 'absolute',
    top: -space.md,
    right: space.lg,
    backgroundColor: color.signal.success,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  failed: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: color.surface.card,
  },
  close: {
    width: size.backChip,
    height: size.backChip,
    borderRadius: radius.pill,
    backgroundColor: color.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { opacity: 0 },
  flex: { flex: 1 },
  features: { gap: space.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  link: { minHeight: size.touch, justifyContent: 'center' },
});
