import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { color, pill, size } from '@/design/tokens';

/**
 * R2 "Next step in 2s" bar: fills over `ms` while running; a pause resets it, matching
 * useGameDelay (the step starts over on resume). Re-keyed by the caller per step.
 */
export function DelayBar({ ms, running, fill }: { ms: number; running: boolean; fill: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(0);
    if (running) progress.set(withTiming(1, { duration: ms, easing: Easing.linear }));
    return () => cancelAnimation(progress);
  }, [ms, running, progress]);
  const style = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: fill }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: size.delayBar,
    ...pill(size.delayBar),
    backgroundColor: color.bg.raisedHigh,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
