import { StyleSheet, View } from 'react-native';

import { PrimaryButton, Text } from '@/design/components';
import { color, layout, radius, rounded } from '@/design/tokens';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { wantsMornings } from '@/features/onboarding/logic/firstRules';
import {
  daysPerYear,
  formatGain,
  goodNews,
  hoursPerDay,
} from '@/features/onboarding/logic/yearMath';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useT } from '@/i18n';

const STEP = stepOf('plan');
const P = layout.plan;

type CardTone = 'sky' | 'green' | 'accent';

/**
 * Onboarding 14 · the plan, built from the answers. No new questions; the cards only show
 * (after onboarding each opens its setting).
 */
export default function Plan() {
  const t = useT();
  const apps = useOnboardingStore((s) => s.apps);
  const when = useOnboardingStore((s) => s.when);
  const bucket = useOnboardingStore((s) => s.screenTime);
  const news = goodNews(daysPerYear(hoursPerDay(bucket)));

  const appNames = apps
    .filter((a) => a !== 'other')
    .map((a) => t(`onboarding.apps.options.${a}`))
    .join(', ');
  const locksSub =
    t('onboarding.plan.locksBedtime') +
    (wantsMornings(when) ? t('onboarding.plan.locksMornings') : '');

  return (
    <OnboardingScreen
      step={STEP}
      title={t('onboarding.plan.title')}
      subtitle={t('onboarding.plan.subtitle')}
      contentStyle={styles.content}
      footer={
        <PrimaryButton
          testID="plan.continue"
          label={t('common.continue')}
          variant="light"
          icon="arrowRight"
          onPress={() => goNext(STEP)}
        />
      }>
      <PlanCard
        testID="plan.locks"
        tone="sky"
        label={t('onboarding.plan.locksLabel')}
        title={appNames || t('onboarding.plan.locksFallback')}
        sub={locksSub}
      />
      <PlanCard
        testID="plan.challenges"
        tone="green"
        label={t('onboarding.plan.challengesLabel')}
        title={t('onboarding.plan.challengesTitle')}
        sub={t('onboarding.plan.challengesSub')}
      />
      <PlanCard
        testID="plan.goal"
        tone="accent"
        label={t('onboarding.plan.goalLabel')}
        title={t(
          news.goal === 'hour' ? 'onboarding.plan.goalHour' : 'onboarding.plan.goalHalfHour',
        )}
        sub={t('onboarding.plan.goalSub', { gain: formatGain(news.gain) })}
      />
    </OnboardingScreen>
  );
}

function PlanCard({
  tone,
  label,
  title,
  sub,
  testID,
}: {
  tone: CardTone;
  label: string;
  title: string;
  sub: string;
  testID: string;
}) {
  return (
    <View testID={testID} style={[styles.card, toneStyles[tone]]} accessible>
      <Text variant="overline" tone="onAccent">
        {label}
      </Text>
      <View>
        <Text variant="body.xl" tone="onAccent" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="label.strong" tone="onAccent" style={styles.sub}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: P.top, gap: P.gap },
  card: {
    minHeight: P.cardHeight,
    ...rounded(radius.l),
    paddingVertical: P.paddingY,
    paddingHorizontal: P.paddingX,
    justifyContent: 'space-between',
  },
  sub: { marginTop: P.subTop },
});

const toneStyles = StyleSheet.create({
  sky: { backgroundColor: color.mood.sky },
  green: { backgroundColor: color.mood.green },
  accent: { backgroundColor: color.accent.primary },
});
