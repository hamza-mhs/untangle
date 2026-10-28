import { ChoiceRow } from '@/design/components';
import { QuestionScreen } from '@/features/onboarding/components/QuestionScreen';
import { toggleCapped } from '@/features/onboarding/logic/toggleCapped';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { WHEN_TRIGGERS } from '@/features/onboarding/types';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

const STEP = stepOf('when');

/** Onboarding 04 · When does it hit hardest? (multi-select list, periwinkle). */
export default function When() {
  const t = useT();
  const selected = useOnboardingStore((s) => s.when);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  return (
    <QuestionScreen
      step={STEP}
      title={t('onboarding.when.title')}
      subtitle={t('onboarding.when.subtitle')}
      canContinue={selected.length > 0}
      onContinue={() => goNext(STEP)}>
      {WHEN_TRIGGERS.map((id) => (
        <ChoiceRow
          key={id}
          testID={`when.option.${id}`}
          label={t(`onboarding.when.options.${id}`)}
          mode="multi"
          accent="peri"
          selected={selected.includes(id)}
          onPress={() => {
            haptics.select();
            setAnswer('when', toggleCapped(selected, id) ?? selected);
          }}
        />
      ))}
    </QuestionScreen>
  );
}
