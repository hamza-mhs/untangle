import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';

/** Three slow breaths: in 4 s, out 6 s (§8 Take a breath). */
export const BREATHS = 3;
export const IN_MS = 4000;
export const OUT_MS = 6000;
const ORB = 140;

export function BreathView({ onDone }: { onDone: () => void }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [count, setCount] = useState(0);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    if (count >= BREATHS) {
      onDone();
      return undefined;
    }
    const ms = phase === 'in' ? IN_MS : OUT_MS;
    scale.set(
      withTiming(phase === 'in' ? 1.15 : 0.7, {
        duration: reduced ? 0 : ms,
        easing: Easing.inOut(Easing.sin),
      }),
    );
    const id = setTimeout(() => {
      if (phase === 'in') setPhase('out');
      else {
        setPhase('in');
        setCount((c) => c + 1);
      }
    }, ms);
    return () => clearTimeout(id);
  }, [count, onDone, phase, reduced, scale]);

  const orb = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <View style={styles.root}>
      <View
        style={styles.orbBox}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.glow, orb]} />
        <Animated.View style={[styles.orb, orb]} />
      </View>
      <Text variant="heading" align="center" accessibilityLiveRegion="polite">
        {t(phase === 'in' ? 'pause.breath.in' : 'pause.breath.out')}
      </Text>
      <Text variant="body" tone="secondary" align="center">
        {t('pause.breath.left', { count: BREATHS - count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', gap: space.lg },
  orbBox: { height: ORB * 1.8, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: ORB * 1.6,
    height: ORB * 1.6,
    borderRadius: radius.pill,
    backgroundColor: color.game.cobalt,
    opacity: 0.18,
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: radius.pill,
    backgroundColor: color.game.cobalt,
    opacity: 0.55,
  },
});
