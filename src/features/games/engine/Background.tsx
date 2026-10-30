import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';

import { color } from '@/design/tokens';

/**
 * Game background (30-phase3 §A.2.6): a very subtle grid, dot field or perspective grid with a
 * soft glow in the game colour. `quiet` fades the lines during memorise phases. Static (no
 * render loop), so it costs nothing while the game runs or is paused.
 */
const LINE_ALPHA = 0.05;
const GLOW_ALPHA = 0.16;

export function GameBackground({
  kind,
  glow,
  quiet,
}: {
  kind: 'grid' | 'dots' | 'persp';
  glow: string;
  quiet: boolean;
}) {
  const lines = useAnimatedStyle(() => ({
    opacity: withTiming(quiet ? 0.4 : 1, { duration: 400 }),
  }));
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="gbGlow" cx="50%" cy="45%" rx="70%" ry="45%">
            <Stop offset="0" stopColor={glow} stopOpacity={GLOW_ALPHA} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="200" fill={color.bg.ink} />
        <Rect width="100" height="200" fill="url(#gbGlow)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, lines]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none">
          {kind === 'grid'
            ? [
                ...Array.from({ length: 9 }, (_, i) => (
                  <Line
                    key={`v${i}`}
                    x1={(i + 1) * 10}
                    y1={0}
                    x2={(i + 1) * 10}
                    y2={200}
                    stroke={color.text.primary}
                    strokeOpacity={LINE_ALPHA}
                    strokeWidth={0.2}
                  />
                )),
                ...Array.from({ length: 19 }, (_, i) => (
                  <Line
                    key={`h${i}`}
                    x1={0}
                    y1={(i + 1) * 10}
                    x2={100}
                    y2={(i + 1) * 10}
                    stroke={color.text.primary}
                    strokeOpacity={LINE_ALPHA}
                    strokeWidth={0.2}
                  />
                )),
              ]
            : null}
          {kind === 'dots'
            ? Array.from({ length: 10 * 20 }, (_, i) => (
                <Circle
                  key={i}
                  cx={5 + (i % 10) * 10}
                  cy={5 + Math.floor(i / 10) * 10}
                  r={0.45}
                  fill={color.text.primary}
                  fillOpacity={LINE_ALPHA * 2}
                />
              ))
            : null}
          {kind === 'persp'
            ? [
                ...Array.from({ length: 13 }, (_, i) => (
                  <Line
                    key={`r${i}`}
                    x1={50}
                    y1={110}
                    x2={-60 + i * 18.3}
                    y2={200}
                    stroke={color.text.primary}
                    strokeOpacity={LINE_ALPHA}
                    strokeWidth={0.25}
                  />
                )),
                ...Array.from({ length: 8 }, (_, i) => {
                  const y = 110 + Math.pow(i / 7, 1.8) * 90;
                  return (
                    <Line
                      key={`p${i}`}
                      x1={0}
                      y1={y}
                      x2={100}
                      y2={y}
                      stroke={color.text.primary}
                      strokeOpacity={LINE_ALPHA}
                      strokeWidth={0.25}
                    />
                  );
                }),
              ]
            : null}
        </Svg>
      </Animated.View>
    </View>
  );
}
