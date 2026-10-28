import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { color, pill, radius, rounded, size, space } from '../../tokens';
import { PressableScale } from '../PressableScale';
import { RadioDot } from '../RadioDot';
import { Text } from '../Text';

export type PlanOptionProps = {
  name: string;
  /** "Saves 50%". */
  tag?: string;
  sub: string;
  /** Straight from the store product (`priceString`); never formatted here. */
  price: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** 64 pt plan row: radio, name, optional tag, sub, price. Selected = 2 pt yellow ring. */
export function PlanOption({ name, tag, sub, price, selected, onPress, testID }: PlanOptionProps) {
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[name, tag, sub, price].filter(Boolean).join(', ')}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[styles.row, selected && styles.selected]}>
      <RadioDot isSelected={selected} />
      <View style={styles.texts}>
        <View style={styles.nameRow}>
          <Text variant="label.chip">{name}</Text>
          {tag ? (
            <View style={styles.tag}>
              <Text variant="caption.strong" tone="onAccent">
                {tag}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="meta" tone="muted">
          {sub}
        </Text>
      </View>
      <Text variant="label.chip">{price}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    height: size.planOption,
    ...rounded(radius.m),
    backgroundColor: color.bg.raised,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  selected: { borderWidth: size.selectedRing, borderColor: color.accent.primary },
  texts: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tag: {
    height: size.smallTag,
    ...pill(size.smallTag),
    paddingHorizontal: space.sm + 1,
    justifyContent: 'center',
    backgroundColor: color.accent.primary,
  },
});
