import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { color } from '@/design/tokens';

/** The prototype draws Pip in a 34 × 34 box. */
const BOX = 34;
/** The waving arm's own box inside Pip's (x, y, w, h), pivoting at its shoulder (29, 18). */
const ARM = { x: 26, y: 6, w: 10, h: 14 };
const PIVOT = `${((29 - ARM.x) / ARM.w) * 100}% ${((18 - ARM.y) / ARM.h) * 100}%`;

/**
 * PLACEHOLDER for Pip (BATCH-3.3b): the prototype's little creature, until the mascot is
 * chosen. Swap this component for the mascot sprite; the round only passes `size` and `wave`.
 * `wave` is the arm's rotation in degrees.
 */
export function PipPlaceholder({ size, wave }: { size: number; wave: SharedValue<number> }) {
  const k = size / BOX;
  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wave.get()}deg` }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
        <Ellipse cx={17} cy={20} rx={13} ry={11} fill={color.signal.successText} />
        <Ellipse cx={13} cy={16} rx={4} ry={2.5} fill={color.text.primary} opacity={0.5} />
        <Circle cx={12.5} cy={20} r={2.4} fill={color.bg.ink} />
        <Circle cx={21.5} cy={20} r={2.4} fill={color.bg.ink} />
        <Path
          d="M14 25 q3 2 6 0"
          stroke={color.bg.ink}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View
        style={[
          styles.arm,
          {
            left: ARM.x * k,
            top: ARM.y * k,
            width: ARM.w * k,
            height: ARM.h * k,
            transformOrigin: PIVOT,
          },
          armStyle,
        ]}>
        <Svg width={ARM.w * k} height={ARM.h * k} viewBox={`${ARM.x} ${ARM.y} ${ARM.w} ${ARM.h}`}>
          <Path
            d="M29 18 q5 -4 3 -9"
            stroke={color.signal.successText}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ arm: { position: 'absolute' } });
