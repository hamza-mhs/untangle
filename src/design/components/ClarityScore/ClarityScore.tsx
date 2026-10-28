import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/i18n';

import { clarityColor, motion } from '../../tokens';
import { useDuration } from '../../useReducedMotion';
import { LiveText } from '../LiveText';
import { Text } from '../Text';

export type ClarityScoreProps = {
  value: number;
  label?: string;
  /** Frozen while blocking is off (HomeBOff): no count-up, muted announcement. */
  isFrozen?: boolean;
  testID?: string;
};

/**
 * The Clarity number (SPEC §3): coloured by `clarityColor`, counts up over `motion.countUp`
 * when it changes (instantly with Reduce Motion), read as "Clarity 64 out of 100".
 */
export function ClarityScore({ value, label, isFrozen = false, testID }: ClarityScoreProps) {
  const t = useT();
  const duration = useDuration(isFrozen ? 0 : motion.countUp);
  const shown = useSharedValue(value);
  const text = useSharedValue(String(Math.round(value)));

  useEffect(() => {
    shown.set(withTiming(value, { duration, easing: Easing.out(Easing.cubic) }));
  }, [value, duration, shown]);

  useAnimatedReaction(
    () => Math.round(shown.value),
    (n, prev) => {
      if (n !== prev) text.set(String(n));
    },
  );

  return (
    <View
      style={styles.root}
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('home.clarity.a11y', { value: Math.round(value) })}>
      <LiveText text={text} variant="display.score" style={{ color: clarityColor(value) }} />
      <Text variant="caption.caps" tone="muted">
        {label ?? t('home.clarity.label')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
});
