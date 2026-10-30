import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';

import { color, motion, radius, size } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';

export type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
};

const TRAVEL = size.toggle.width - size.toggle.knob - size.toggle.inset * 2;

/** 44 × 26 switch (prototype `.sw`): green track when on, white knob. */
export function Toggle({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  testID,
}: ToggleProps) {
  const reduced = useReducedMotion();
  const x = useSharedValue(value ? TRAVEL : 0);
  useEffect(() => {
    const to = value ? TRAVEL : 0;
    x.set(reduced ? withTiming(to, { duration: 0 }) : withSpring(to, motion.spring.press));
  }, [value, reduced, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={(size.touch - size.toggle.height) / 2}
      onPress={() => {
        haptics.select();
        onChange(!value);
      }}
      style={[styles.track, value ? styles.on : null, disabled ? styles.disabled : null]}>
      <Animated.View style={[styles.knob, knob]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: size.toggle.width,
    height: size.toggle.height,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
    padding: size.toggle.inset,
  },
  on: { backgroundColor: color.signal.success },
  disabled: { opacity: 0.4 },
  knob: {
    width: size.toggle.knob,
    height: size.toggle.knob,
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
  },
});
