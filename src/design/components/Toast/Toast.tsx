import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { color, radius, rounded, size, space } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';
import { Icon } from '../Icon';
import { Text } from '../Text';

export const TOAST_MS = 3000;

export type ToastProps = {
  title: string;
  sub?: string;
  tone: 'success' | 'neutral';
  onDismiss: () => void;
  testID?: string;
};

/** Top toast, 60 pt, announced to screen readers, gone after 3 s (SPEC §3, E08). */
export function Toast({ title, sub, tone, onDismiss, testID }: ToastProps) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(sub ? `${title}. ${sub}` : title);
    const timer = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(timer);
  }, [title, sub, onDismiss]);
  return (
    <Animated.View
      testID={testID}
      {...(reduceMotion ? {} : { entering: FadeInUp, exiting: FadeOutUp })}
      style={[styles.toast, tone === 'success' ? styles.success : styles.neutral]}
      accessibilityLiveRegion="polite">
      <Icon
        name="checkCircle"
        size={size.icon.md}
        color={tone === 'success' ? color.status.success : color.text.primary}
      />
      <View>
        <Text variant="label.strong">{title}</Text>
        {sub ? (
          <Text variant="meta" tone="secondary">
            {sub}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    height: size.toast,
    ...rounded(radius.m),
    borderWidth: size.ring,
    paddingHorizontal: space.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  success: {
    backgroundColor: color.status.successSoftBg,
    borderColor: color.status.successSoftRing,
  },
  neutral: { backgroundColor: color.bg.raised, borderColor: color.border.hairline },
});
