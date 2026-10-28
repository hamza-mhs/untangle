import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Press feedback for every pressable: scale to `motion.press` on a spring (SPEC §6). */
export function PressableScale({ style, children, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const springTo = (v: number) => {
    if (reduceMotion) return;
    scale.set(withSpring(v, motion.press.spring));
  };
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        springTo(motion.press.scale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        springTo(1);
        onPressOut?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
