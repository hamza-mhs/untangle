import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/design/components';
import type { IconName } from '@/design/icons';
import { PauseCardPhone } from '@/design/illustrations';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import { WeekBars, YearLinesChart } from '../components/Charts';
import { OnboardingFrame } from '../components/OnboardingFrame';
import { goNext } from '../components/QuestionList';
import { goalCutMinutes, hoursBack, NOT_SURE_HOURS, yearLines } from '../logic';
import { useOnboardingStore } from '../onboardingStore';

/** §2.11 Hours back. */
export function HoursBackScreen() {
  const t = useT();
  const hours = useOnboardingStore((s) => s.answers.scrollHours) ?? NOT_SURE_HOURS;
  const cut = goalCutMinutes(hours);
  const lines = yearLines(hours);
  const back = hoursBack(hours);
  return (
    <OnboardingFrame
      step="hours-back"
      layout="story"
      glow={color.signal.success}
      title={t('onboarding.hoursBack.title', { hours: back })}
      body={t('onboarding.hoursBack.body', { minutes: cut })}
      cta={{
        label: t('onboarding.hoursBack.cta'),
        onPress: () => goNext('hours-back'),
        variant: 'brand',
      }}>
      <YearLinesChart
        now={lines.now}
        goal={lines.goal}
        ticks={[
          t('onboarding.hoursBack.ticks.now'),
          t('onboarding.hoursBack.ticks.m3'),
          t('onboarding.hoursBack.ticks.m6'),
          t('onboarding.hoursBack.ticks.m9'),
          t('onboarding.hoursBack.ticks.m12'),
        ]}
        nowLabel={t('onboarding.hoursBack.sameAsNow')}
        goalLabel={t('onboarding.hoursBack.withGoal', { minutes: cut })}
        label={t('onboarding.hoursBack.chartLabel', { hours: back, minutes: cut })}
      />
    </OnboardingFrame>
  );
}

/** §2.12 Moment of pause (mock copy changed: no schedules in v1). */
export function MomentOfPauseScreen() {
  const t = useT();
  return (
    <OnboardingFrame
      step="moment-of-pause"
      layout="story"
      glow={color.brand.violet}
      title={t('onboarding.momentOfPause.title')}
      body={t('onboarding.momentOfPause.body')}
      cta={{
        label: t('onboarding.momentOfPause.cta'),
        onPress: () => goNext('moment-of-pause'),
        variant: 'brand',
      }}>
      <PauseCardPhone
        label={t('onboarding.momentOfPause.artLabel')}
        appMonogram="IG"
        title={t('onboarding.momentOfPause.art.title')}
        subtitle={t('onboarding.momentOfPause.art.subtitle')}
        actions={[
          t('onboarding.momentOfPause.art.game'),
          t('onboarding.momentOfPause.art.breath'),
          t('onboarding.momentOfPause.art.back'),
        ]}
      />
    </OnboardingFrame>
  );
}

const STEPS: { key: 'block' | 'practise' | 'goal'; icon: IconName }[] = [
  { key: 'block', icon: 'lock' },
  { key: 'practise', icon: 'flag' },
  { key: 'goal', icon: 'chart' },
];

/** §2.13 Blocking is step one. Focus is the goal. */
export function StepOneScreen() {
  const t = useT();
  return (
    <OnboardingFrame
      step="step-one"
      glow={color.brand.violet}
      title={t('onboarding.stepOne.title')}
      cta={{ label: t('common.continue'), onPress: () => goNext('step-one'), variant: 'brand' }}>
      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const goal = s.key === 'goal';
          return (
            <View key={s.key} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.badge, goal ? styles.badgeGoal : null]}>
                  <Icon name={s.icon} size={size.icon.md} color={color.text.onLight} />
                </View>
                {i < STEPS.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyLg" tone={goal ? 'success' : 'primary'}>
                  {t(`onboarding.stepOne.${s.key}.title`)}
                </Text>
                <Text variant="body" tone="secondary">
                  {t(`onboarding.stepOne.${s.key}.body`)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

/** Example weekly values for §2.14 (minutes; the last bar is labelled 48 min). */
const EXAMPLE_WEEKS = [14, 20, 26, 31, 38, 48];

/** §2.14 Watch your focus grow. */
export function FocusGrowScreen() {
  const t = useT();
  const labels = EXAMPLE_WEEKS.map((_, i) => t('onboarding.focusGrow.week', { n: i + 1 }));
  return (
    <OnboardingFrame
      step="focus-grow"
      glow={color.signal.success}
      title={t('onboarding.focusGrow.title')}
      body={t('onboarding.focusGrow.body')}
      cta={{ label: t('common.continue'), onPress: () => goNext('focus-grow'), variant: 'brand' }}>
      <View style={styles.grow}>
        <WeekBars
          values={EXAMPLE_WEEKS}
          labels={labels}
          top={t('onboarding.focusGrow.top', { minutes: EXAMPLE_WEEKS[EXAMPLE_WEEKS.length - 1] })}
          label={t('onboarding.focusGrow.chartLabel')}
        />
        <Text variant="caption" tone="tertiary">
          {t('onboarding.focusGrow.caption')}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

const BADGE = 48;
const styles = StyleSheet.create({
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: space.lg },
  rail: { alignItems: 'center', width: BADGE },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: space.xs,
    borderColor: color.surface.controlStrong,
  },
  badgeGoal: { backgroundColor: color.signal.success, borderColor: color.signal.successSoft },
  line: { width: 2, flex: 1, minHeight: space.xl, backgroundColor: color.brand.violet },
  stepText: { flex: 1, gap: space.xs, paddingBottom: space['2xl'] },
  grow: { flex: 1, gap: space.lg, paddingBottom: space.sm },
});
