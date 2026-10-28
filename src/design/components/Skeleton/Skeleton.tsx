import { StyleSheet, View } from 'react-native';

import { color, pill, radius, rounded, size, space } from '../../tokens';

/** E03: a plan-row placeholder (radio, name bar, price bar). `nameWidth` varies per row. */
export function PlanSkeleton({ nameWidth }: { nameWidth: number }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.dot} />
      <View style={[styles.bar, { width: nameWidth }]} />
      <View style={[styles.bar, styles.price]} />
    </View>
  );
}

const BAR = 12;
const PRICE_WIDTH = 56;

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
  dot: { width: size.radio, height: size.radio, ...pill(size.radio), backgroundColor: color.bg.raisedHigh },
  bar: { height: BAR, ...pill(BAR), backgroundColor: color.bg.raisedHigh },
  price: { marginLeft: 'auto', width: PRICE_WIDTH },
});
