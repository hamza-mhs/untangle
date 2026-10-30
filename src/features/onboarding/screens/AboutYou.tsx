import { useT } from '@/i18n';
import { glow } from '@/design/tokens';

import { OnboardingFrame } from '../components/OnboardingFrame';
import { goNext, QuestionList, useAutoAdvance } from '../components/QuestionList';
import {
  AGE_OPTIONS,
  PICKUP_OPTIONS,
  SCROLL_OPTIONS,
  SIGN_EMOJI,
  SIGN_IDS,
  signsAnswered,
  toggleSign,
  type SignId,
} from '../logic';
import { useOnboardingStore } from '../onboardingStore';

/** §2.2 Your age: single choice, stores the band's midpoint. */
export function AgeScreen() {
  const t = useT();
  const ageMid = useOnboardingStore((s) => s.answers.ageMid);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const advance = useAutoAdvance('age');
  return (
    <OnboardingFrame
      glow={glow.question}
      step="age"
      title={t('onboarding.age.title')}
      body={t('onboarding.age.body')}
      cta={{
        label: t('common.continue'),
        onPress: () => goNext('age'),
        disabled: ageMid === null,
      }}>
      <QuestionList
        testID="onboarding.age"
        items={AGE_OPTIONS.map((o) => ({
          id: o.id,
          emoji: o.emoji,
          label: t(`onboarding.age.options.${o.id}`),
          selected: ageMid === o.value,
        }))}
        onPick={(id) => {
          const o = AGE_OPTIONS.find((x) => x.id === id);
          if (!o) return;
          setAnswer('ageMid', o.value);
          advance();
        }}
      />
    </OnboardingFrame>
  );
}

/** §2.3 Scroll time: single choice, stores the hours used for the maths. */
export function ScrollTimeScreen() {
  const t = useT();
  const answer = useOnboardingStore((s) => s.answers.scrollAnswer);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const advance = useAutoAdvance('scroll-time');
  return (
    <OnboardingFrame
      glow={glow.question}
      step="scroll-time"
      title={t('onboarding.scrollTime.title')}
      body={t('onboarding.scrollTime.body')}
      cta={{
        label: t('common.continue'),
        onPress: () => goNext('scroll-time'),
        disabled: answer === null,
      }}>
      <QuestionList
        testID="onboarding.scrollTime"
        items={SCROLL_OPTIONS.map((o) => ({
          id: o.id,
          emoji: o.emoji,
          label: t(`onboarding.scrollTime.options.${o.id}`),
          selected: answer === o.id,
        }))}
        onPick={(id) => {
          const o = SCROLL_OPTIONS.find((x) => x.id === id);
          if (!o) return;
          setAnswer('scrollAnswer', o.id);
          setAnswer('scrollHours', o.value);
          advance();
        }}
      />
    </OnboardingFrame>
  );
}

/** §2.4 Pick-ups: single choice, stored for Progress later. */
export function PickupsScreen() {
  const t = useT();
  const answer = useOnboardingStore((s) => s.answers.pickupsAnswer);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const advance = useAutoAdvance('pickups');
  return (
    <OnboardingFrame
      glow={glow.question}
      step="pickups"
      title={t('onboarding.pickups.title')}
      body={t('onboarding.pickups.body')}
      cta={{
        label: t('common.continue'),
        onPress: () => goNext('pickups'),
        disabled: answer === null,
      }}>
      <QuestionList
        testID="onboarding.pickups"
        items={PICKUP_OPTIONS.map((o) => ({
          id: o.id,
          emoji: o.emoji,
          label: t(`onboarding.pickups.options.${o.id}`),
          selected: answer === o.value,
        }))}
        onPick={(id) => {
          setAnswer('pickupsAnswer', id);
          advance();
        }}
      />
    </OnboardingFrame>
  );
}

/** §2.5 Focus signs: multi choice; "None of these" is exclusive. */
export function FocusSignsScreen() {
  const t = useT();
  const signs = useOnboardingStore((s) => s.answers.signs);
  const none = useOnboardingStore((s) => s.answers.signsNone);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const ids: (SignId | 'none')[] = [...SIGN_IDS, 'none'];
  return (
    <OnboardingFrame
      glow={glow.question}
      step="focus-signs"
      title={t('onboarding.focusSigns.title')}
      body={t('onboarding.focusSigns.body')}
      cta={{
        label: t('common.continue'),
        onPress: () => goNext('focus-signs'),
        disabled: !signsAnswered({ signs, none }),
      }}>
      <QuestionList
        testID="onboarding.focusSigns"
        multi
        items={ids.map((id) => ({
          id,
          emoji: SIGN_EMOJI[id],
          label: t(`onboarding.focusSigns.options.${id}`),
          selected: id === 'none' ? none : signs.includes(id),
        }))}
        onPick={(id) => {
          const next = toggleSign({ signs, none }, id as SignId | 'none');
          setAnswer('signs', next.signs);
          setAnswer('signsNone', next.none);
        }}
      />
    </OnboardingFrame>
  );
}
