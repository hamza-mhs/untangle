import { ChoiceChip } from '@/design/components';
import { QuestionScreen } from '@/features/onboarding/components/QuestionScreen';
import { toggleCapped } from '@/features/onboarding/logic/toggleCapped';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { APP_LABELS } from '@/features/onboarding/types';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

const STEP = stepOf('apps');

/** Onboarding 03 · Which apps pull you in? (multi-select chip grid, sky). */
export default function Apps() {
  const t = useT();
  const selected = useOnboardingStore((s) => s.apps);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  return (
    <QuestionScreen
      step={STEP}
      title={t('onboarding.apps.title')}
      subtitle={t('onboarding.apps.subtitle')}
      layout="grid"
      canContinue={selected.length > 0}
      onContinue={() => goNext(STEP)}>
      {APP_LABELS.map((id) => (
        <ChoiceChip
          key={id}
          testID={`apps.option.${id}`}
          label={t(`onboarding.apps.options.${id}`)}
          accent="sky"
          selected={selected.includes(id)}
          onPress={() => {
            haptics.select();
            setAnswer('apps', toggleCapped(selected, id) ?? selected);
          }}
        />
      ))}
    </QuestionScreen>
  );
}
