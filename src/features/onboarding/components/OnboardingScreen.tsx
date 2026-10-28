import { useEffect, useImperativeHandle, useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingHeader, Screen, Text, type TextTone } from '@/design/components';
import { layout, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

import { useOnboardingBack } from '../hooks/useOnboardingBack';
import { goBack, markShown, peekShownStep } from '../navigation';
import { FIRST_NO_GESTURE_STEP, ONBOARDING_TOTAL } from '../steps';

export type OnboardingScreenHandle = { shakeSubtitle: () => void };

export type OnboardingScreenProps = {
  step: number;
  title?: string;
  /** Plain string, or rich text (bold runs) built by the screen. */
  subtitle?: ReactNode;
  subtitleTone?: TextTone;
  /** Pinned footer (the CTA). */
  footer?: ReactNode;
  children?: ReactNode;
  /** Content wrapper style (defaults to the 32 pt gap under the subtitle, options gutter). */
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  ref?: Ref<OnboardingScreenHandle> | undefined;
};

const SHAKE_STEP_MS = 50;

/**
 * Shared scaffold for onboarding 02–15 (SPEC "Shared layout"): header, title, subtitle,
 * content and a footer pinned 16 pt above the safe area.
 */
export function OnboardingScreen({
  step,
  title,
  subtitle,
  subtitleTone = 'muted',
  footer,
  children,
  contentStyle,
  scroll = true,
  ref,
}: OnboardingScreenProps) {
  // Read-only during render (Strict Mode double-invokes initialisers); committed in the effect.
  const [fromStep] = useState(peekShownStep);
  const reduceMotion = useReducedMotion();
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const isBackBlocked = step >= FIRST_NO_GESTURE_STEP;

  useOnboardingBack(step, isBackBlocked);
  useEffect(() => {
    markShown(step);
  }, [step]);

  useImperativeHandle(ref, () => ({
    shakeSubtitle: () => {
      if (reduceMotion) return;
      shake.set(
        withSequence(
          withTiming(-6, { duration: SHAKE_STEP_MS }),
          withTiming(6, { duration: SHAKE_STEP_MS }),
          withTiming(-4, { duration: SHAKE_STEP_MS }),
          withTiming(4, { duration: SHAKE_STEP_MS }),
          withTiming(0, { duration: SHAKE_STEP_MS }),
        ),
      );
    },
  }));

  return (
    <Screen
      scroll={scroll}
      header={
        <OnboardingHeader
          step={step}
          total={ONBOARDING_TOTAL}
          fromStep={fromStep}
          onBack={() => (isBackBlocked ? undefined : goBack(step))}
        />
      }
      footer={footer}>
      {title ? (
        <Text variant="title.m" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text variant="body.lead" tone={subtitleTone} style={[styles.subtitle, shakeStyle]}>
          {subtitle}
        </Text>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: layout.onboarding.titleTop, paddingHorizontal: layout.onboarding.titleX },
  subtitle: { marginTop: space.sm, paddingHorizontal: layout.onboarding.subtitleX },
  content: {
    marginTop: layout.onboarding.contentTop,
    paddingHorizontal: layout.onboarding.optionsX,
  },
});
