import { StyleSheet } from 'react-native';

import { PrimaryButton, StrengthOption } from '@/design/components';
import { layout } from '@/design/tokens';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import type { Strength } from '@/features/rules/model';
import { useT } from '@/i18n';

const STEP = stepOf('strength');
const STRENGTHS: readonly Strength[] = ['pause', 'earn', 'locked'];

/**
 * Onboarding 08 · the three strengths, before any system dialog. The pick becomes the default
 * for the first rule (preselected Earn). Locked is allowed: the reverse trial unlocks it.
 */
export default function StrengthStep() {
  const t = useT();
  const strength = useOnboardingStore((s) => s.strength);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  return (
    <OnboardingScreen
      step={STEP}
      title={t('onboarding.strength.title')}
      subtitle={t('onboarding.strength.subtitle')}
      contentStyle={styles.list}
      footer={
        <PrimaryButton
          testID="strength.continue"
          label={t('common.continue')}
          variant="light"
          icon="arrowRight"
          onPress={() => goNext(STEP)}
        />
      }>
      {STRENGTHS.map((s) => (
        <StrengthOption
          key={s}
          testID={`strength.option.${s}`}
          strength={s}
          locked={s === 'locked'}
          selected={strength === s}
          onPress={() => setAnswer('strength', s)}
        />
      ))}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: layout.strength.gap },
});
