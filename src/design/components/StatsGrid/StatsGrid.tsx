import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';

import { color, layout, pill, radius, rounded, size, space } from '../../tokens';
import { StatCard, type StatCardProps } from '../StatCard';
import { Text } from '../Text';

export const BASELINE_DAYS = 7;

export type StatsGridProps =
  | {
      mode: 'normal';
      /** Exactly four cards, in order. Any card may be a custom node (e.g. the iOS report view). */
      cards: readonly [StatSlot, StatSlot, StatSlot, StatSlot];
      testID?: string;
    }
  | { mode: 'baseline'; day: number; testID?: string };

export type StatSlot = StatCardProps | { custom: ReactNode };

/** 2×2 StatCards, or the single "Building your baseline · day n of 7" card (SPEC §3). */
export function StatsGrid(props: StatsGridProps) {
  const t = useT();
  if (props.mode === 'baseline') {
    const day = Math.min(BASELINE_DAYS, Math.max(1, props.day));
    return (
      <View testID={props.testID}>
        <Text variant="meta" tone="muted" style={styles.header}>
          {t('home.stats.title')}
        </Text>
        <View
          style={styles.baseline}
          accessible
          accessibilityLabel={t('home.stats.baselineTitle', { day, total: BASELINE_DAYS })}>
          <Text variant="body.strong">
            {t('home.stats.baselineTitle', { day, total: BASELINE_DAYS })}
          </Text>
          <Text variant="meta" tone="muted" style={styles.baselineBody}>
            {t('home.stats.baselineBody')}
          </Text>
          <View style={styles.segments}>
            {Array.from({ length: BASELINE_DAYS }, (_, i) => (
              <View key={i} style={[styles.segment, i < day && styles.segmentOn]} />
            ))}
          </View>
        </View>
      </View>
    );
  }
  const [a, b, c, d] = props.cards;
  return (
    <View testID={props.testID}>
      <View style={[styles.header, styles.headerRow]}>
        <Text variant="meta" tone="muted">
          {t('home.stats.title')}
        </Text>
        <Text variant="meta" tone="muted">
          {t('home.stats.vsFirstWeek')}
        </Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.row}>
          <Slot slot={a} />
          <Slot slot={b} />
        </View>
        <View style={styles.row}>
          <Slot slot={c} />
          <Slot slot={d} />
        </View>
      </View>
    </View>
  );
}

function Slot({ slot }: { slot: StatSlot }) {
  if ('custom' in slot) return <View style={styles.custom}>{slot.custom}</View>;
  return <StatCard {...slot} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.home.labelX - layout.home.x,
    marginBottom: layout.home.sectionLabelGap,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  grid: { gap: layout.home.statGap },
  row: { flexDirection: 'row', gap: layout.home.statGap },
  custom: { flex: 1 },
  baseline: {
    minHeight: size.baselineCard,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: layout.home.cardPadding,
    paddingHorizontal: space.lg,
  },
  baselineBody: { marginTop: space.xs },
  segments: { flexDirection: 'row', gap: space.xs, marginTop: space.md },
  segment: {
    flex: 1,
    height: size.segmentBar,
    ...pill(size.segmentBar),
    backgroundColor: color.border.control,
  },
  segmentOn: { backgroundColor: color.accent.primary },
});
