import { StyleSheet, View } from 'react-native';

import { PrimaryButton, Text } from '@/design/components';
import { color, layout, radius, rounded } from '@/design/tokens';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import {
  daysPerYear,
  formatHours,
  hoursPerDay,
  yearBodyKey,
} from '@/features/onboarding/logic/yearMath';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { useT } from '@/i18n';

const STEP = stepOf('your-year');
const Y = layout.yourYear;

/** Onboarding 06 · the year in days, from their own OB02 answer. */
export default function YourYear() {
  const t = useT();
  const bucket = useOnboardingStore((s) => s.screenTime);
  const hours = hoursPerDay(bucket);
  const days = daysPerYear(hours);
  const bodyKey = yearBodyKey(days);

  return (
    <OnboardingScreen
      step={STEP}
      contentStyle={styles.content}
      footer={
        <PrimaryButton
          testID="yourYear.continue"
          label={t('common.continue')}
          variant="light"
          icon="arrowRight"
          onPress={() => goNext(STEP)}
        />
      }>
      <View accessible accessibilityLabel={t('onboarding.yourYear.a11y', { count: days })}>
        <Text variant="label" tone="muted" style={styles.label}>
          {t('onboarding.yourYear.label')}
        </Text>
        <Text testID="yourYear.days" variant="display.hero" style={styles.hero}>
          {days}
        </Text>
        <Text variant="display.unit" tone="pink" style={styles.unit}>
          {t('onboarding.yourYear.unit')}
        </Text>
      </View>
      <Text testID="yourYear.body" variant="lead" style={styles.body}>
        {bodyKey === 'days'
          ? t('onboarding.yourYear.body.days', { count: days })
          : t(`onboarding.yourYear.body.${bodyKey}`)}
      </Text>
      <View style={styles.card}>
        <Text variant="body.s" tone="muted">
          {t('onboarding.yourYear.formula', { hours: formatHours(hours) })}
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: Y.top, paddingHorizontal: 0 },
  label: { paddingHorizontal: Y.labelX },
  hero: { marginTop: Y.heroTop, paddingLeft: Y.heroX },
  unit: { marginTop: Y.unitTop, paddingLeft: Y.unitX },
  body: { marginTop: Y.bodyTop, paddingLeft: Y.bodyLeft, paddingRight: Y.bodyRight },
  card: {
    marginTop: Y.cardTop,
    marginHorizontal: layout.onboarding.optionsX,
    ...rounded(radius.l),
    backgroundColor: color.bg.surface,
    paddingVertical: Y.cardPaddingY,
    paddingHorizontal: Y.cardPaddingX,
  },
});
