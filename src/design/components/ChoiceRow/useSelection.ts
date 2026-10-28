import { useEffect } from 'react';
import { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { color, motion, type MoodColor } from '../../tokens';
import { useDuration } from '../../useReducedMotion';

/** Selection cross-fade (`motion.select`): raised → mood accent, white → black text. */
export function useSelection(selected: boolean, accent: MoodColor) {
  const duration = useDuration(motion.select);
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(selected ? 1 : 0, { duration });
  }, [selected, duration, t]);
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [color.bg.raised, color.mood[accent]]),
  }));
  const fg = useAnimatedStyle(() => ({
    color: interpolateColor(t.value, [0, 1], [color.text.primary, color.text.onAccent]),
  }));
  const check = useAnimatedStyle(() => ({ opacity: t.value }));
  return { bg, fg, check };
}
