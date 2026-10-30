import { useEffect } from 'react';
import { type DimensionValue, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { color, motion, radius } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';

export type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  /** Corner radius; defaults to the card radius. */
  rounded?: number;
  testID?: string;
};

const PULSE_MS = motion.duration.slow * 2;

/** Loading placeholder that pulses (static when Remove animations is on). */
export function Skeleton({ width = '100%', height, rounded = radius.lg, testID }: SkeletonProps) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.set(withRepeat(withTiming(0.45, { duration: PULSE_MS }), -1, true));
    return () => cancelAnimation(o);
  }, [reduced, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width, height, borderRadius: rounded }, style]}
    />
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: color.surface.raised },
});
