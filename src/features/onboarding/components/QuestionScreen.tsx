import type { ReactNode, Ref } from 'react';
import { StyleSheet } from 'react-native';

import { PrimaryButton } from '@/design/components';
import { layout } from '@/design/tokens';
import { useT } from '@/i18n';

import { OnboardingScreen, type OnboardingScreenHandle } from './OnboardingScreen';

export type QuestionScreenProps = {
  step: number;
  title: string;
  subtitle: string;
  /** `list` → 18 pt gaps; `grid` → 2-column chip grid with 8 pt gaps. */
  layout?: 'list' | 'grid';
  canContinue: boolean;
  onContinue: () => void;
  children: ReactNode;
  ref?: Ref<OnboardingScreenHandle> | undefined;
};

/** Onboarding 02–05: a question with options and the white Continue button. */
export function QuestionScreen({
  step,
  title,
  subtitle,
  layout: kind = 'list',
  canContinue,
  onContinue,
  children,
  ref,
}: QuestionScreenProps) {
  const t = useT();
  return (
    <OnboardingScreen
      ref={ref}
      step={step}
      title={title}
      subtitle={subtitle}
      contentStyle={kind === 'grid' ? styles.grid : styles.list}
      footer={
        <PrimaryButton
          label={t('common.continue')}
          variant="light"
          icon="arrowRight"
          disabled={!canContinue}
          onPress={onContinue}
        />
      }>
      {children}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: layout.onboarding.listGap },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.onboarding.gridGap },
});
