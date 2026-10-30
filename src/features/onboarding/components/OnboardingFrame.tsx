import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, type ReactNode } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Button, Glow, Header, Screen, Text, type ButtonVariant } from '@/design/components';
import { type GlowSpec, layout, motion, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

import { useOnboardingStore } from '../onboardingStore';
import { CHAPTERS, chaptersDone, hasBack, hrefFor, prevStep, type OnboardingStep } from '../steps';

export type FrameCta = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export type OnboardingFrameProps = {
  step: OnboardingStep;
  title?: string;
  body?: string;
  /**
   * `question`: title on top, content below (About you, Permissions, Pick apps).
   * `story`: illustration on top, text at the bottom above the CTA (results, the fix).
   */
  layout?: 'question' | 'story';
  children?: ReactNode;
  /** Pinned under the text in `story` layouts (carousel dots, footnotes). */
  below?: ReactNode;
  cta?: FrameCta;
  secondary?: FrameCta;
  /** Glow behind the screen (a preset from `glow` in the design tokens). */
  glow?: GlowSpec;
  /** Hide the header entirely (welcome). */
  noHeader?: boolean;
  scroll?: boolean;
};

/** Go to the previous onboarding screen, also when resume left no history to pop. */
export function goBack(step: OnboardingStep) {
  if (router.canGoBack()) router.back();
  else {
    const prev = prevStep(step);
    if (prev === 'index') router.replace('/?welcome=1');
    else if (prev) router.replace(hrefFor(prev));
  }
}

/** Saves the current screen for resume each time it comes into focus (§1 Resume). */
export function useTrackStep(step: OnboardingStep) {
  const setStep = useOnboardingStore((s) => s.setStep);
  useFocusEffect(
    useCallback(() => {
      setStep(step);
    }, [setStep, step]),
  );
}

/** Content enter: slides 24 dp and fades (motion.duration.base); header stays put. */
function useEnterStyle() {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withTiming(1, {
        duration: motion.duration.base,
        easing: Easing.bezier(...motion.easing.standard),
      }),
    );
  }, [p]);
  return useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ translateX: reduced ? 0 : (1 - p.get()) * motion.enterOffset }],
  }));
}

/**
 * Every onboarding screen's frame: progress header with the back rules, optional glow, the
 * content, and the bottom CTA (10-phase1-onboarding §1 shared rules).
 */
export function OnboardingFrame({
  step,
  title,
  body,
  layout: kind = 'question',
  children,
  below,
  cta,
  secondary,
  glow,
  noHeader = false,
  scroll = false,
}: OnboardingFrameProps) {
  useTrackStep(step);
  const enter = useEnterStyle();
  const back = hasBack(step);

  // System Back = the chevron; no-op where there is none (Studying). Welcome exits the app.
  useFocusEffect(
    useCallback(() => {
      if (step === 'index') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (back) goBack(step);
        return true;
      });
      return () => sub.remove();
    }, [back, step]),
  );

  const text =
    title || body ? (
      <View style={styles.text}>
        {title ? (
          <Text variant={kind === 'question' ? 'title' : 'titleLg'} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {body ? (
          <Text variant="body" tone="body">
            {body}
          </Text>
        ) : null}
      </View>
    ) : null;

  return (
    <Screen
      background={glow ? <Glow {...glow} /> : null}
      testID={`onboarding.${step}`}
      scroll={scroll}
      header={
        noHeader ? null : (
          <Header
            testID="onboarding.header"
            {...(back ? { onBack: () => goBack(step) } : {})}
            progress={{ total: CHAPTERS.length, done: chaptersDone(step) }}
          />
        )
      }
      footer={
        cta || secondary ? (
          <>
            {cta ? (
              <Button
                testID={cta.testID ?? `onboarding.${step}.cta`}
                label={cta.label}
                onPress={cta.onPress}
                variant={cta.variant ?? 'primary'}
                {...(cta.disabled !== undefined ? { disabled: cta.disabled } : {})}
                {...(cta.loading !== undefined ? { loading: cta.loading } : {})}
              />
            ) : null}
            {secondary ? (
              <Button
                testID={secondary.testID ?? `onboarding.${step}.secondary`}
                label={secondary.label}
                onPress={secondary.onPress}
                variant="ghost"
                size="md"
              />
            ) : null}
          </>
        ) : undefined
      }>
      <Animated.View style={[styles.content, enter]}>
        {kind === 'question' ? (
          <>
            {text}
            <View style={styles.questionBody}>{children}</View>
          </>
        ) : (
          <>
            <View style={styles.visual}>{children}</View>
            {text}
            {below}
          </>
        )}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: layout.headerGap - space.sm },
  text: { gap: space.md },
  questionBody: { flex: 1, marginTop: space.xl },
  // The visual shrinks first: it may go down to 40 % of the content height (§2.1 edge case).
  visual: { flex: 1, minHeight: '40%', marginBottom: space['2xl'], justifyContent: 'center' },
});
