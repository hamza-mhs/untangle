import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LiveText } from '@/design/components';
import { color, size } from '@/design/tokens';

const STROKE = 6;

/**
 * FShield "breathe" ring counting `seconds` → 0. The ring empties over the breath; the number
 * is a UI-thread LiveText. `onDone` fires once at 0 (the secondary button unlocks then).
 */
export function BreathRing({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const d = size.breathRing;
  // Starts at 12 o'clock, clockwise (two half arcs, so trimming with `end` works).
  const path = useMemo(() => {
    const c = d / 2;
    const r = c - STROKE;
    return Skia.Path.MakeFromSVGString(
      `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c} ${c + r} A ${r} ${r} 0 1 1 ${c} ${c - r}`,
    )!;
  }, [d]);
  const left = useSharedValue(1);
  const text = useSharedValue(String(seconds));
  useEffect(() => {
    left.set(withTiming(0, { duration: seconds * 1000, easing: Easing.linear }));
  }, [left, seconds]);
  useAnimatedReaction(
    () => Math.ceil(left.value * seconds),
    (n, prev) => {
      if (n === prev) return;
      text.set(String(n));
      if (n === 0) scheduleOnRN(onDone);
    },
  );
  const end = useDerivedValue(() => left.value);
  return (
    <View style={styles.root} accessibilityRole="timer">
      <Canvas style={StyleSheet.absoluteFill}>
        <Path path={path} style="stroke" strokeWidth={STROKE} color={color.bg.raisedHigh} />
        <Path
          path={path}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color={color.accent.primary}
          start={0}
          end={end}
        />
      </Canvas>
      <LiveText text={text} variant="display.l" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: size.breathRing,
    height: size.breathRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
