import { StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '../../tokens';
import { Text } from '../Text';

export type StatTileProps = {
  label: string;
  value: string;
  /** Change line under the value; `good` = green, `bad` = red, `neutral` = grey. */
  delta?: { text: string; tone: 'good' | 'bad' | 'neutral' };
  testID?: string;
};

const DELTA = { good: 'success', bad: 'danger', neutral: 'secondary' } as const;

/** Label, big number, delta line (prototype `.tile`). */
export function StatTile({ label, value, delta, testID }: StatTileProps) {
  return (
    <View
      testID={testID}
      style={styles.tile}
      accessible
      accessibilityLabel={[label, value, delta?.text].filter(Boolean).join(', ')}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="statMd" style={styles.value}>
        {value}
      </Text>
      {delta ? (
        <Text variant="caption" tone={DELTA[delta.tone]}>
          {delta.text}
        </Text>
      ) : null}
    </View>
  );
}

/** Two tiles per row. */
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: color.surface.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.surface.line,
    padding: layout.cardPadding - 2,
  },
  value: { marginTop: space.xs + 2, marginBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
