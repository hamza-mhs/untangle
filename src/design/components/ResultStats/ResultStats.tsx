import { StyleSheet, View } from 'react-native';

import { space } from '../../tokens';
import { StatCard } from '../StatCard';
import type { TextTone } from '../Text';

export type ResultStat = { label: string; value: string; sub: string; subTone?: TextTone };

/** Three stacked StatCards in a row: Points · Earned · Next time (R6, OxDone, FFocusDone). */
export function ResultStats({ items, testID }: { items: readonly [ResultStat, ResultStat, ResultStat]; testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      {items.map((i) => (
        <StatCard
          key={i.label}
          layout="stacked"
          label={i.label}
          value={i.value}
          sub={i.sub}
          {...(i.subTone ? { subTone: i.subTone } : {})}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
});
