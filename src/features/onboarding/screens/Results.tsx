import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle } from 'react-native-svg';

import { Glow, ProgressDots, Screen, Text } from '@/design/components';
import { DistractedDesk, FogCloud } from '@/design/illustrations';
import { color, glow, layout, radius, size, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useT } from '@/i18n';

import { ShrinkChart, SignPills, YearDotGrid } from '../components/Charts';
import { OnboardingFrame, useTrackStep } from '../components/OnboardingFrame';
import { goNext } from '../components/QuestionList';
import { daysPerYear, fiveYearLine, NOT_SURE_HOURS, SIGN_TOTAL } from '../logic';
import { useOnboardingStore } from '../onboardingStore';
import { hrefFor } from '../steps';

/** §2.6: fill time, and with Reduce motion. */
export const STUDY_MS = 2400;
export const STUDY_MS_REDUCED = 800;
const STUDY_HOLD_MS = 450;

/** Fixed star positions (fractions of the field) so the sky doesn't jump between renders. */
const STARS = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { x: r(1), y: r(2) * 0.62, s: 0.6 + r(3) * 1.3, o: 0.25 + r(4) * 0.6 };
});

function StarField() {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    drift.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [drift, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drift.get() * -10 }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Glow {...glow.studyingOrb} cy={ORB_Y} />
      <Glow {...glow.studyingCoreOuter} cy={ORB_Y} />
      <Glow {...glow.studyingCoreInner} cy={ORB_Y} />
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map((s, i) => (
          <Circle
            key={i}
            cx={s.x * 100}
            cy={s.y * 100}
            r={s.s * 0.18}
            fill={color.text.primary}
            opacity={s.o}
          />
        ))}
      </Svg>
      <View style={styles.orbCore} />
    </Animated.View>
  );
}

/** §2.6 Studying your answers: no back, one bar fills, turns green, moves on by itself. */
export function StudyingScreen() {
  const t = useT();
  useTrackStep('studying');
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    const leave = () => router.replace(hrefFor('your-year'));
    p.set(
      withSequence(
        withTiming(1, {
          duration: reduced ? STUDY_MS_REDUCED : STUDY_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(2, { duration: STUDY_HOLD_MS }, (done) => {
          if (done) scheduleOnRN(leave);
        }),
      ),
    );
  }, [p, reduced]);
  const bar = useAnimatedStyle(() => ({
    width: `${Math.min(1, p.get()) * 100}%`,
    backgroundColor: interpolateColor(
      p.get(),
      [0.98, 1.1],
      [color.text.primary, color.signal.success],
    ),
  }));
  return (
    <Screen testID="onboarding.studying" variant="game" background={<StarField />}>
      <View style={styles.studyBody}>
        <Text variant="titleLg" accessibilityRole="header" accessibilityLiveRegion="polite">
          {t('onboarding.studying.title')}
        </Text>
        <View
          style={styles.track}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.studying.title')}>
          <Animated.View style={[styles.trackFill, bar]} />
        </View>
      </View>
    </Screen>
  );
}

/** §2.7 That's N days of your year. */
export function YourYearScreen() {
  const t = useT();
  const hours = useOnboardingStore((s) => s.answers.scrollHours) ?? NOT_SURE_HOURS;
  const age = useOnboardingStore((s) => s.answers.ageMid) ?? 21;
  const notSure = useOnboardingStore((s) => s.answers.scrollAnswer) === 'notSure';
  const days = daysPerYear(hours);
  const later = fiveYearLine(hours, age);
  return (
    <OnboardingFrame
      step="your-year"
      layout="story"
      glow={glow.yourYear}
      title={t('onboarding.yourYear.title', { days })}
      body={t(notSure ? 'onboarding.yourYear.bodyNotSure' : 'onboarding.yourYear.body', {
        later: later.days,
        age: later.age,
      })}
      cta={{ label: t('onboarding.yourYear.cta'), onPress: () => goNext('your-year') }}>
      <YearDotGrid filled={days} label={t('onboarding.yourYear.gridLabel', { days })} />
    </OnboardingFrame>
  );
}

function ProblemDots({ index }: { index: number }) {
  return (
    <View style={styles.dots}>
      <ProgressDots count={3} index={index} />
    </View>
  );
}

/** §2.8 Problem 1 · Your focus is shrinking. */
export function ProblemFocusScreen() {
  const t = useT();
  return (
    <OnboardingFrame
      step="problem-focus"
      layout="story"
      glow={glow.problem}
      title={t('onboarding.problemFocus.title')}
      body={t('onboarding.problemFocus.body')}
      below={
        <>
          <Text variant="caption" tone="tertiary" style={styles.source}>
            {t('onboarding.problemFocus.source')}
          </Text>
          <ProblemDots index={0} />
        </>
      }
      cta={{ label: t('onboarding.problems.cta'), onPress: () => goNext('problem-focus') }}>
      <ShrinkChart
        before={t('onboarding.problemFocus.before')}
        after={t('onboarding.problemFocus.after')}
        beforeYear={t('onboarding.problemFocus.beforeYear')}
        afterYear={t('onboarding.problemFocus.afterYear')}
        drop={t('onboarding.problemFocus.drop')}
        label={t('onboarding.problemFocus.chartLabel')}
      />
    </OnboardingFrame>
  );
}

/** §2.9 Problem 2 · You get distracted easily. */
export function ProblemDistractedScreen() {
  const t = useT();
  return (
    <OnboardingFrame
      step="problem-distracted"
      layout="story"
      glow={glow.problem}
      title={t('onboarding.problemDistracted.title')}
      body={t('onboarding.problemDistracted.body')}
      below={<ProblemDots index={1} />}
      cta={{ label: t('onboarding.problems.cta'), onPress: () => goNext('problem-distracted') }}>
      <DistractedDesk
        docTitle={t('onboarding.problemDistracted.art.doc')}
        docLines={[
          t('onboarding.problemDistracted.art.line1'),
          t('onboarding.problemDistracted.art.line2'),
          t('onboarding.problemDistracted.art.line3'),
        ]}
        timer={t('onboarding.problemDistracted.art.timer')}
      />
    </OnboardingFrame>
  );
}

/** §2.10 Problem 3 · Your focus feels foggy (or, with no signs, worth guarding). */
export function ProblemFoggyScreen() {
  const t = useT();
  const k = useOnboardingStore((s) => s.answers.signs.length);
  const calm = k === 0;
  return (
    <OnboardingFrame
      step="problem-foggy"
      layout="story"
      glow={glow.problem}
      title={t(calm ? 'onboarding.problemFoggy.titleNone' : 'onboarding.problemFoggy.title')}
      body={t(calm ? 'onboarding.problemFoggy.bodyNone' : 'onboarding.problemFoggy.body', {
        k,
        total: SIGN_TOTAL,
      })}
      below={<ProblemDots index={2} />}
      cta={{ label: t('onboarding.problems.cta'), onPress: () => goNext('problem-foggy') }}>
      <View style={styles.foggy}>
        <FogCloud mood={calm ? 'calm' : 'grumpy'} />
        {calm ? null : (
          <SignPills
            filled={k}
            total={SIGN_TOTAL}
            label={t('onboarding.problemFoggy.pills', { k, total: SIGN_TOTAL })}
          />
        )}
      </View>
    </OnboardingFrame>
  );
}

/** Studying core dot (`.orb .oc`, 20 px). */
const ORB = 20;
/** Studying orb centre, as a fraction of the screen height. */
const ORB_Y = 0.34;
const styles = StyleSheet.create({
  orbCore: {
    position: 'absolute',
    left: '50%',
    top: `${ORB_Y * 100}%`,
    width: ORB,
    height: ORB,
    marginLeft: -ORB / 2,
    marginTop: -ORB / 2,
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
  },
  studyBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: '45%',
    gap: space['2xl'],
    paddingTop: layout.headerGap,
  },
  track: {
    height: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.track,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: radius.pill },
  dots: { marginTop: space.xl, minHeight: size.dot.size },
  source: { marginTop: space.md },
  foggy: { flex: 1, gap: space.lg },
});
