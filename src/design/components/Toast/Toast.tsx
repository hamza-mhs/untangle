import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { color, radius, size, space } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type ToastProps = {
  title: string;
  sub?: string;
  tone: 'success' | 'neutral';
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. */
  durationMs?: number;
  testID?: string;
};

const DEFAULT_MS = 3200;

/** White pill toast at the top (prototype `.toast`). Announced to TalkBack. */
export function Toast({ title, sub, tone, onDismiss, durationMs = DEFAULT_MS, testID }: ToastProps) {
  const reduced = useReducedMotion();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(sub ? `${title}. ${sub}` : title);
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [title, sub, onDismiss, durationMs]);
  return (
    <Animated.View
      testID={testID}
      {...(reduced ? {} : { entering: FadeInUp, exiting: FadeOutUp })}
      style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sub ? `${title}. ${sub}` : title}
        onPress={onDismiss}
        style={styles.toast}>
        {tone === 'success' ? (
          <Icon name="check" size={size.icon.sm} color={color.text.onLight} />
        ) : null}
        <Text variant="bodyStrong" tone="onLight" numberOfLines={2} style={styles.text}>
          {sub ? `${title} · ${sub}` : title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderRadius: radius.card,
    backgroundColor: color.text.primary,
    minHeight: size.touch,
    maxWidth: '100%',
  },
  text: { flexShrink: 1 },
});
