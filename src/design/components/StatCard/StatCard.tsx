import { StyleSheet, View } from 'react-native';

import { color, layout, pill, radius, rounded, size, space } from '../../tokens';
import { Text, type TextTone } from '../Text';

export type StatCardProps = {
  label: string;
  value: string;
  /** Plain coloured text inline after the value. No chips, no pills (design rule). */
  delta?: string;
  deltaTone?: TextTone;
  sub: string;
  subTone?: TextTone;
  /** Last 7 days as 0..1 heights; the last bar is today (accent). */
  spark?: readonly number[];
  /** `inline` = Home (value + delta on one line); `stacked` = Focus done (label / value / sub). */
  layout?: 'inline' | 'stacked';
  testID?: string;
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  sub,
  subTone,
  spark,
  layout: kind = 'inline',
  testID,
}: StatCardProps) {
  const a11y = [label, value, delta, sub].filter(Boolean).join(', ');
  if (kind === 'stacked') {
    return (
      <View testID={testID} style={[styles.card, styles.stacked]} accessible accessibilityLabel={a11y}>
        <Text variant="meta" tone="muted">
          {label}
        </Text>
        <Text variant="stat.s">{value}</Text>
        <Text variant="caption" tone={subTone ?? 'accent'}>
          {sub}
        </Text>
      </View>
    );
  }
  return (
    <View testID={testID} style={styles.card} accessible accessibilityLabel={a11y}>
      <Text variant="meta" tone="muted">
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant="stat">{value}</Text>
        {delta ? (
          <Text variant="meta.strong" tone={deltaTone}>
            {delta}
          </Text>
        ) : null}
      </View>
      <Text variant="caption.s" tone={subTone ?? 'faint'}>
        {sub}
      </Text>
      {spark ? (
        <View style={styles.spark}>
          {spark.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                i === spark.length - 1 && styles.barToday,
                { height: Math.max(2, h * size.sparkHeight) },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: size.statCard,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingVertical: space.md,
    paddingHorizontal: layout.home.cardPadding,
  },
  stacked: { minHeight: size.statCardTall, justifyContent: 'space-between' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: space.xs + 2 },
  spark: {
    position: 'absolute',
    right: layout.home.cardPadding,
    top: layout.home.cardPadding,
    height: size.sparkHeight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.xxs + 1,
  },
  bar: { width: size.sparkBar, ...pill(size.sparkBar), backgroundColor: color.border.control },
  barToday: { backgroundColor: color.accent.primary },
});
