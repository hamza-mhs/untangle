import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FeatureTable,
  Icon,
  IconButton,
  PlanOption,
  PlanSkeleton,
  PressableScale,
  PrimaryButton,
  Text,
  TextLink,
  type TextTone,
} from '@/design/components';
import { color, layout, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { Plan } from '@/services/purchases';

import { featureRows } from '../featureRows';
import { contextCopy, isContextual, type PaywallSource } from '../paywallCopy';
import type { LoadState } from '../paywallMachine';
import { usePaywall } from '../usePaywall';

const S = layout.screen;
const SKELETON_WIDTHS = [120, 100, 80] as const;
const BENEFIT_TONE: Record<'accent' | 'sky' | 'pink', TextTone> = {
  accent: 'accent',
  sky: 'sky',
  pink: 'pink',
};

/**
 * P03 (general: feature table) and P13 (contextual: headline from `?from=`). Close × is visible
 * from frame 1. Loading → E03 skeletons (Continue free still works); offline → E04.
 */
export function PaywallScreen({ source }: { source: PaywallSource | null }) {
  const t = useT();
  const pw = usePaywall();
  const contextual = isContextual(source);
  const copy = contextual && source ? contextCopy(source) : null;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));
  const isBusy = pw.purchase.status === 'purchasing';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.closeRow}>
        <IconButton
          testID="paywall.close"
          icon="close"
          accessibilityLabel={t('common.close')}
          onPress={close}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {copy ? (
          <>
            <Text variant="title.m" accessibilityRole="header" style={styles.headline}>
              {copy.headline}
            </Text>
            <Text variant="body" tone="muted" style={styles.body}>
              {copy.body}
            </Text>
            <View style={styles.group}>
              {copy.benefits.map((b, i) => (
                <View key={b.id} style={[styles.benefit, i > 0 && styles.separator]} accessible>
                  <View style={[styles.benefitTile, tileTones[b.tone]]}>
                    <Icon name="check" size={size.icon.xs} color={color.text.onAccent} />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="body">{b.title}</Text>
                    <Text variant="caption" tone="muted">
                      {b.sub}
                    </Text>
                  </View>
                  <Text variant="label.strong" tone={BENEFIT_TONE[b.tone]}>
                    ✓
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text variant="title.m" accessibilityRole="header" style={styles.headline}>
              {t('paywall.main.title')}
              {'\n'}
              <Text variant="title.m" tone="muted">
                {t('paywall.main.titleFree')}
              </Text>
            </Text>
            <View style={styles.table}>
              <FeatureTable rows={featureRows()} testID="paywall.table" />
            </View>
          </>
        )}
        <View style={styles.plans}>
          <Plans
            load={pw.load}
            plans={pw.plans}
            selected={pw.selected}
            onSelect={pw.setSelected}
            onRetry={pw.retry}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {pw.load.status === 'offline' || pw.load.status === 'error' ? (
          <PrimaryButton
            testID="paywall.retry"
            label={t('common.tryAgain')}
            variant="light"
            compact
            onPress={pw.retry}
          />
        ) : (
          <PrimaryButton
            testID="paywall.cta"
            label={
              pw.load.status === 'loading'
                ? t('paywall.main.loadingPrices')
                : ctaLabel(t, pw.plan, contextual)
            }
            compact
            loading={isBusy}
            disabled={pw.load.status !== 'ready' || !pw.plan}
            onPress={() => void pw.buy()}
          />
        )}
        {pw.isOnItsWay ? (
          <Text variant="meta" tone="muted" align="center">
            {t('paywall.main.onItsWay')}
          </Text>
        ) : null}
        <TextLink
          testID="paywall.free"
          label={contextual ? t('paywall.main.notNow') : t('paywall.main.continueFree')}
          tone="primary"
          onPress={close}
        />
        <View style={styles.legal}>
          <Text variant="caption.s" tone="faint" align="center">
            {contextual ? t('paywall.main.legalShort') : t('paywall.main.legal')}
            {' · '}
          </Text>
          <PressableScale
            testID="paywall.restore"
            accessibilityRole="button"
            accessibilityLabel={t('paywall.main.restore')}
            hitSlop={space.md}
            disabled={pw.isRestoring}
            onPress={() => void pw.restore()}>
            <Text variant="caption.s" tone="faint" style={styles.underline}>
              {pw.isRestoring ? t('common.loading') : t('paywall.main.restore')}
            </Text>
          </PressableScale>
        </View>
        {pw.restoreError ? (
          <Text variant="caption" tone="warning" align="center">
            {pw.restoreError}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ctaLabel(t: ReturnType<typeof useT>, plan: Plan | null, contextual: boolean): string {
  if (!plan) return t('paywall.main.keepPro');
  const key = contextual ? 'paywall.main.ctaGet' : 'paywall.main.ctaKeep';
  return t(`${key}.${plan.id}`, { price: plan.priceString });
}

function Plans({
  load,
  plans,
  selected,
  onSelect,
  onRetry,
}: {
  load: LoadState;
  plans: Plan[];
  selected: string;
  onSelect: (id: Plan['id']) => void;
  onRetry: () => void;
}) {
  const t = useT();
  switch (load.status) {
    case 'loading':
      return (
        <View style={styles.planList} accessibilityLabel={t('paywall.main.loadingPrices')}>
          {SKELETON_WIDTHS.map((w) => (
            <PlanSkeleton key={w} nameWidth={w} />
          ))}
        </View>
      );
    case 'offline':
    case 'error':
      return (
        <PressableScale
          testID="paywall.offline"
          accessibilityRole="button"
          accessibilityLabel={`${t('paywall.offline.title')}. ${t('paywall.offline.body')}`}
          onPress={onRetry}
          style={styles.offline}>
          <Icon name="offline" size={size.icon.md} color={color.text.muted} />
          <Text variant="label.chip" align="center">
            {t('paywall.offline.title')}
          </Text>
          <Text variant="meta" tone="muted" align="center">
            {t('paywall.offline.body')}
          </Text>
        </PressableScale>
      );
    case 'ready':
      return (
        <View style={styles.planList} accessibilityRole="radiogroup">
          {plans.map((p) => (
            <PlanOption
              key={p.id}
              testID={`paywall.plan.${p.id}`}
              name={t(`paywall.plans.${p.id}.name`)}
              {...(p.id === 'yearly' ? { tag: t('paywall.plans.yearly.tag') } : {})}
              sub={
                p.id === 'yearly' && p.pricePerMonthString
                  ? t('paywall.plans.yearly.sub', { perMonth: p.pricePerMonthString })
                  : t(`paywall.plans.${p.id}.sub`)
              }
              price={p.priceString}
              selected={selected === p.id}
              onPress={() => onSelect(p.id)}
            />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  closeRow: { alignItems: 'flex-end', paddingHorizontal: S.x, paddingTop: S.top },
  content: { paddingHorizontal: S.x, paddingBottom: space.lg },
  headline: { marginTop: space.sm, paddingHorizontal: S.titleX - S.x, paddingRight: space.huge },
  body: { marginTop: space.md, paddingHorizontal: S.titleX - S.x },
  table: { marginTop: space.xl },
  group: {
    marginTop: space.xxl,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    overflow: 'hidden',
  },
  benefit: {
    height: size.suggestionRow,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  separator: { borderTopWidth: size.hairline, borderTopColor: color.border.hairline },
  benefitTile: {
    width: size.iconTile,
    height: size.iconTile,
    ...rounded(size.appTile.m.radius),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  plans: { marginTop: space.xl },
  planList: { gap: space.sm },
  offline: {
    minHeight: size.planOption * 3 + space.sm * 2,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xxl,
  },
  footer: {
    gap: space.xs,
    paddingHorizontal: S.x,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  legal: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  underline: { textDecorationLine: 'underline' },
});

const tileTones = StyleSheet.create({
  accent: { backgroundColor: color.accent.primary },
  sky: { backgroundColor: color.mood.sky },
  pink: { backgroundColor: color.mood.pink },
});
