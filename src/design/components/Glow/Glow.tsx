import {
  BlurMask,
  Canvas,
  Circle,
  FractalNoise,
  Group,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { GlowSpec } from '../../tokens/glow';
import { useReducedMotion } from '../../useReducedMotion';

export type GlowProps = GlowSpec & {
  /** Set false to stop the pulse (e.g. while the screen is covered). Default true. */
  active?: boolean;
};

/** Grain over the glow so 8-bit gradients do not band (the prototypes' `--noise`, ~3 %). `srcATop` keeps it inside the glow's own alpha. */
const NOISE_OPACITY = 0.03;

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Soft radial glow drawn with Skia in real pixels (FIX-visual-fidelity F1): a circle unless
 * `ry` asks for an ellipse, ≥ 3 stops, dithered, with a faint noise layer that breaks up
 * banding. Fills its parent; decorative, hidden from TalkBack, never takes touches.
 * The optional pulse runs on the UI thread and is off with Reduce motion.
 */
export function Glow({ stops, cx, cy, radius, ry, blur, pulse, active = true }: GlowProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const breathing = !!pulse && !reduced && active;

  useEffect(() => {
    if (!breathing || !pulse) return undefined;
    t.set(
      withRepeat(
        withTiming(1, { duration: pulse.periodMs / 2, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(t);
      t.set(0);
    };
  }, [breathing, pulse, t]);

  const { w, h } = box;
  const x = cx * w;
  const y = cy * h;
  const rx = radius * w;
  const rY = ry === undefined ? rx : ry * h;
  const scaleMax = pulse?.scale ?? 1;
  const opacityMin = pulse?.opacity ?? 1;

  const transform = useDerivedValue(() => [{ scale: 1 + (scaleMax - 1) * t.get() }]);
  const opacity = useDerivedValue(() => 1 - (1 - opacityMin) * t.get());

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setBox({ w: width, h: height });
  };

  // A circle of radius rx; an ellipse squashes the canvas about the centre (shader
  // transforms ignore `origin`, canvas ones don't).
  const squash = [{ scaleY: rx > 0 ? rY / rx : 1 }];
  const centre = vec(x, y);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w > 0 && h > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={transform} origin={centre} opacity={opacity}>
            <Group transform={squash} origin={centre}>
              <Circle c={centre} r={rx} dither>
                <RadialGradient
                  c={centre}
                  r={rx}
                  colors={stops.map(([, tint, a]) => rgba(tint, a))}
                  positions={stops.map(([o]) => o)}
                />
                {blur ? <BlurMask blur={blur} style="normal" /> : null}
              </Circle>
              {blur ? null : (
                <Circle c={centre} r={rx} opacity={NOISE_OPACITY} blendMode="srcATop">
                  <FractalNoise freqX={0.9} freqY={0.9} octaves={2} />
                </Circle>
              )}
            </Group>
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
