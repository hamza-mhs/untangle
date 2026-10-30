import { StyleSheet, View } from 'react-native';

import { color, fontFamily, radius, size, space } from '../../tokens';
import { Text } from '../Text';

export type BarDatum = {
  /** "M", "T"… or "Wk 1". */
  label: string;
  /** Blocked-apps time (red, bottom of the bar). */
  blocked: number;
  /** Everything else (grey, on top). */
  other: number;
  isToday?: boolean;
  /** Full TalkBack text for the bar ("Monday, 1h 42m, 20m on blocked apps"). */
  a11y: string;
};

export type BarChartProps = {
  data: readonly BarDatum[];
  height?: number;
  /** Legend labels; omit to hide the legend. */
  legend?: { blocked: string; other: string };
  testID?: string;
};

/** Stacked week bars (Home, Progress): blocked time in red under everything else. */
export function BarChart({ data, height = size.barChart.height, legend, testID }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.blocked + d.other));
  return (
    <View testID={testID} style={styles.root}>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => {
          const total = d.blocked + d.other;
          return (
            <View key={i} style={styles.col} accessible accessibilityLabel={d.a11y}>
              <View style={[styles.bar, { height: (total / max) * height }]}>
                <View style={[styles.other, { flex: d.other }]} />
                <View style={[styles.blocked, { flex: d.blocked }]} />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={i}
            variant="caption"
            tone={d.isToday ? 'primary' : 'tertiary'}
            align="center"
            style={[styles.label, d.isToday ? styles.today : null]}
            importantForAccessibility="no">
            {d.label}
          </Text>
        ))}
      </View>
      {legend ? (
        <View style={styles.legend} importantForAccessibility="no-hide-descendants">
          <LegendDot fill={color.signal.danger} label={legend.blocked} />
          <LegendDot fill={color.surface.controlStrong} label={legend.other} />
        </View>
      ) : null}
    </View>
  );
}

function LegendDot({ fill, label }: { fill: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: fill }]} />
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderRadius: radius.sm, overflow: 'hidden', minHeight: 2 },
  other: { backgroundColor: color.surface.controlStrong },
  blocked: { backgroundColor: color.signal.danger },
  labels: { flexDirection: 'row', gap: space.sm },
  label: { flex: 1 },
  today: { fontFamily: fontFamily.bold },
  legend: { flexDirection: 'row', gap: space.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
});
