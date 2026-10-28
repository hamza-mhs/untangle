import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useT } from '@/i18n';

import { color, layout, motion, size } from '../../tokens';
import { useDuration } from '../../useReducedMotion';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type OnboardingHeaderProps = {
  step: number;
  total: number;
  onBack: () => void;
  /** Step the bar animates from (the step the user came from). Defaults to `step`. */
  fromStep?: number;
};

/** Back button + progress track + "2/15" counter. Fill animates `motion.progress` ease-out. */
export function OnboardingHeader({ step, total, onBack, fromStep }: OnboardingHeaderProps) {
  const t = useT();
  const duration = useDuration(motion.progress);
  const fill = useSharedValue((fromStep ?? step) / total);

  useEffect(() => {
    fill.value = withTiming(step / total, { duration, easing: Easing.out(Easing.cubic) });
  }, [step, total, duration, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={(size.hitTarget - size.backButton) / 2 + 4}
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Icon name="chevronLeft" size={size.icon.sm} color={color.text.primary} />
      </Pressable>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('common.stepOf', { step, total })}
        accessibilityValue={{ min: 0, max: total, now: step }}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text
        variant="meta.strong"
        tone="muted"
        align="right"
        style={styles.counter}
        importantForAccessibility="no"
        accessibilityElementsHidden>
        {t('common.stepCounter', { step, total })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: size.header,
    marginTop: layout.onboarding.headerTop,
    paddingHorizontal: layout.onboarding.headerX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.onboarding.headerX,
  },
  back: {
    width: size.backButton,
    height: size.backButton,
    borderRadius: size.backButton / 2,
    borderWidth: size.backButtonRing,
    borderColor: color.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  track: {
    flex: 1,
    height: size.progressTrack,
    borderRadius: size.progressTrack / 2,
    backgroundColor: color.bg.track,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: size.progressTrack / 2, backgroundColor: color.text.primary },
  counter: { width: size.counterWidth },
});
