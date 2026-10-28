import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { ChoiceRow } from '@/design/components';
import { QuestionScreen } from '@/features/onboarding/components/QuestionScreen';
import { goNext } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { stepOf } from '@/features/onboarding/steps';
import { SCREEN_TIME_BUCKETS, type ScreenTimeBucket } from '@/features/onboarding/types';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';

const STEP = stepOf('screen-time');
/** Single select = one tap: advance shortly after the selection lands. */
const AUTO_ADVANCE_MS = 250;

/** Onboarding 02 · How much phone a day? (single select, pink, auto-advance). */
export default function ScreenTime() {
  const t = useT();
  const value = useOnboardingStore((s) => s.screenTime);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel a pending auto-advance if the user leaves (e.g. taps Back quickly).
  useFocusEffect(
    useCallback(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      },
      [],
    ),
  );

  const handleChoose = (id: ScreenTimeBucket) => {
    haptics.select();
    setAnswer('screenTime', id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      goNext(STEP);
    }, AUTO_ADVANCE_MS);
  };

  return (
    <QuestionScreen
      step={STEP}
      title={t('onboarding.screenTime.title')}
      subtitle={t('onboarding.screenTime.subtitle')}
      canContinue={value !== null}
      onContinue={() => goNext(STEP)}>
      {SCREEN_TIME_BUCKETS.map((id) => (
        <ChoiceRow
          key={id}
          testID={`screenTime.option.${id}`}
          label={t(`onboarding.screenTime.options.${id}`)}
          mode="single"
          accent="pink"
          selected={value === id}
          onPress={() => handleChoose(id)}
        />
      ))}
    </QuestionScreen>
  );
}
