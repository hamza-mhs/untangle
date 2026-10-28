import { useRef } from 'react';

import { ChoiceRow } from '@/design/components';
import type { OnboardingScreenHandle } from '@/features/onboarding/components/OnboardingScreen';
import { QuestionScreen } from '@/features/onboarding/components/QuestionScreen';
import { toggleCapped } from '@/features/onboarding/logic/toggleCapped';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { GOAL_IDS, GOALS_MAX, type GoalId } from '@/features/onboarding/types';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

const STEP = stepOf('goals');

/** Onboarding 05 · What do you want back? (multi-select, max 2, green, sub-lines). */
export default function Goals() {
  const t = useT();
  const selected = useOnboardingStore((s) => s.goals);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const screen = useRef<OnboardingScreenHandle>(null);

  const handleToggle = (id: GoalId) => {
    const next = toggleCapped(selected, id, GOALS_MAX);
    if (next === null) {
      // A third pick: warn, shake the "Pick up to two" line, keep the current two.
      haptics.warning();
      screen.current?.shakeSubtitle();
      return;
    }
    haptics.select();
    setAnswer('goals', next);
  };

  return (
    <QuestionScreen
      ref={screen}
      step={STEP}
      title={t('onboarding.goals.title')}
      subtitle={t('onboarding.goals.subtitle')}
      canContinue={selected.length > 0}
      onContinue={() => goNext(STEP)}>
      {GOAL_IDS.map((id) => (
        <ChoiceRow
          key={id}
          testID={`goals.option.${id}`}
          label={t(`onboarding.goals.options.${id}`)}
          sub={t(`onboarding.goals.subs.${id}`)}
          mode="multi"
          accent="green"
          selected={selected.includes(id)}
          onPress={() => handleToggle(id)}
        />
      ))}
    </QuestionScreen>
  );
}
