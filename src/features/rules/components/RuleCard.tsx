import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppTileRow,
  PressableScale,
  ProgressBar,
  Text,
  Toggle,
  type AppTileApp,
  type TextTone,
} from '@/design/components';
import { color, layout, pill, radius, rounded, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { Rule, Strength } from '../model';

const STRENGTH_TONE: Record<Strength, TextTone> = { locked: 'accent', earn: 'sky', pause: 'muted' };
const S = layout.screen;

export type RuleCardProps = {
  rule: Rule;
  scheduleLine: string;
  apps: AppTileApp[];
  appsTotal: number;
  /** Open-budget rules: opens used today. */
  opensUsed?: number;
  /** Whole list muted while blocking is off. */
  isMuted: boolean;
  onToggle: (enabled: boolean) => void;
  onPress: () => void;
};

/**
 * FBlock rule card: name, optional "Default" tag, schedule, up to 3 tiles + "+n", the strength
 * in coloured micro caps, and a Toggle. Disabled rules read muted.
 */
export const RuleCard = memo(function RuleCard({
  rule,
  scheduleLine,
  apps,
  appsTotal,
  opensUsed,
  isMuted,
  onToggle,
  onPress,
}: RuleCardProps) {
  const t = useT();
  const isDim = isMuted || !rule.enabled;
  if (rule.budget) {
    const used = Math.min(opensUsed ?? 0, rule.budget.opens);
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('rules.card.budgetA11y', {
          name: rule.name,
          used,
          total: rule.budget.opens,
        })}
        onPress={onPress}
        style={[styles.card, styles.budget]}>
        <View style={styles.budgetTop}>
          <AppTileRow apps={apps} total={appsTotal} max={1} size="m" />
          <View style={styles.flex}>
            <Text variant="body.strong" tone={isDim ? 'muted' : 'primary'}>
              {t('rules.card.budgetTitle', { name: rule.name })}
            </Text>
            <Text variant="caption" tone="muted">
              {t('rules.card.budgetSub', { count: rule.budget.opens, time: rule.budget.resetsAt })}
            </Text>
          </View>
          <Text variant="body.strong">
            {t('rules.card.budgetCount', { used, total: rule.budget.opens })}
          </Text>
        </View>
        <View style={styles.budgetBar}>
          <ProgressBar progress={used / rule.budget.opens} />
        </View>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('rules.card.a11y', {
        name: rule.name,
        schedule: scheduleLine,
        strength: t(`strength.${rule.strength}.title`),
      })}
      accessibilityHint={t('rules.card.editHint')}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text variant="label.chip" tone={isDim ? 'muted' : 'primary'} numberOfLines={1}>
              {rule.name}
            </Text>
            {rule.isDefault ? (
              <View style={styles.tag}>
                <Text variant="overline.s" tone="muted">
                  {t('rules.card.default')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="meta" tone="muted" style={styles.schedule}>
            {rule.isPausedByPlan ? t('rules.card.pausedByPlan') : scheduleLine}
          </Text>
        </View>
        <Toggle
          value={rule.enabled}
          onChange={onToggle}
          disabled={isMuted}
          accessibilityLabel={t('rules.card.toggleA11y', { name: rule.name })}
        />
      </View>
      <View style={styles.bottom}>
        <AppTileRow apps={apps} total={appsTotal} max={3} size="xs" />
        <Text variant="overline.s" tone={isDim ? 'muted' : STRENGTH_TONE[rule.strength]}>
          {t(`strength.${rule.strength}.title`)}
        </Text>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: size.ruleCard,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: S.cardPaddingY,
    paddingHorizontal: S.cardPaddingX,
    justifyContent: 'space-between',
  },
  budget: { minHeight: size.budgetCard },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  schedule: { marginTop: space.xxs },
  tag: {
    height: size.tinyTag,
    ...pill(size.tinyTag),
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    backgroundColor: color.bg.raisedHigh,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2 },
  budgetBar: { marginTop: space.sm + 2 },
});
