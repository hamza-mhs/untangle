import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Glow, Text } from '@/design/components';
import { glow, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';

/** Three slow breaths: in 4 s, out 6 s (§8 Take a breath). */
export const BREATHS = 3;
export const IN_MS = 4000;
export const OUT_MS = 6000;
const ORB = 140;
/** The canvas is larger than the orb so the 60 px halo is not clipped. */
const WRAP = ORB * 1.8;
const ORB_R = ORB / 2 / WRAP;

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
        <Animated.View style={[styles.orbWrap, orb]}>
          <Glow {...glow.breathHalo} radius={ORB_R} />
          <Glow {...glow.breathOrb} radius={ORB_R} />
        </Animated.View>
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
  orbBox: { height: WRAP, alignItems: 'center', justifyContent: 'center' },
  orbWrap: { width: WRAP, height: WRAP },
});
