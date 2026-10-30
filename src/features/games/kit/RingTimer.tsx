import Animated, {
  interpolateColor,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { color } from '@/design/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Small per-question ring (prototype `.qring`): drains as `left` goes 1 → 0, white → amber
 * (< 60 %) → red (< 35 %). `left` is a shared value the board drives from the game clock.
 */
export function RingTimer({ left, size }: { left: SharedValue<number>; size: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const props = useAnimatedProps(() => {
    const f = left.get();
    return {
      strokeDashoffset: c * (1 - f),
      stroke: interpolateColor(
        f,
        [0, 0.34, 0.36, 0.59, 0.61, 1],
        [
          color.signal.danger,
          color.signal.danger,
          color.signal.warning,
          color.signal.warning,
          color.text.primary,
          color.text.primary,
        ],
      ),
    };
  });
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color.surface.track}
        strokeWidth={3}
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        animatedProps={props}
      />
    </Svg>
  );
}
