import { StyleSheet, View } from 'react-native';

import { color, radius, size, space } from '../../tokens';
import { Text } from '../Text';

export type HourChartProps = {
  /** 24 values, index 0 = midnight. */
  values: readonly number[];
  /** Hours to draw in red (busiest hours, or hours on blocked apps). */
  highlight?: readonly number[];
  /** Axis labels at 0, 6, 12 and 18 h ("12 AM", "6 AM", …), already formatted. */
  axis: readonly [string, string, string, string];
  height?: number;
  accessibilityLabel: string;
  testID?: string;
};

const MIN_BAR = 3;

/** 24 thin bars of pick-ups by hour (Screen time). */
export function HourChart({
  values,
  highlight = [],
  axis,
  height = size.hourChart.height,
  accessibilityLabel,
  testID,
}: HourChartProps) {
  const max = Math.max(1, ...values);
  return (
    <View testID={testID} accessible accessibilityLabel={accessibilityLabel} style={styles.root}>
      <View style={[styles.bars, { height }]}>
        {Array.from({ length: 24 }, (_, h) => (
          <View
            key={h}
            style={[
              styles.bar,
              { height: Math.max(MIN_BAR, ((values[h] ?? 0) / max) * height) },
              highlight.includes(h) ? styles.hot : null,
            ]}
          />
        ))}
      </View>
      <View style={styles.axis}>
        {axis.map((a) => (
          <Text key={a} variant="caption" tone="tertiary" style={styles.tick}>
            {a}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1, borderRadius: radius.pill, backgroundColor: color.surface.controlStrong },
  hot: { backgroundColor: color.signal.danger },
  axis: { flexDirection: 'row' },
  tick: { flex: 1 },
});
