import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { color } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

const PULSE_MS = 1600;
const SPREAD = 22;
const STATIC_RING = 4;
const START_OPACITY = 0.75;

/**
 * The yellow "tap this" pulse behind a mock button (`@keyframes pulse`: a 0 → 22 pt ring
 * fading out over 1.6 s). Reduce Motion: a steady 4 pt ring.
 */
export function PulseRing({ cornerRadius }: { cornerRadius: number }) {
  const still = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.ease) }), -1));
  }, [still, p]);

  const ring = useAnimatedStyle(() => {
    const spread = still ? STATIC_RING : SPREAD * p.value;
    return {
      top: -spread,
      left: -spread,
      right: -spread,
      bottom: -spread,
      borderRadius: cornerRadius + spread,
      opacity: still ? 1 : START_OPACITY * (1 - p.value),
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.ring, ring]} />;
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', backgroundColor: color.accent.primary },
});
