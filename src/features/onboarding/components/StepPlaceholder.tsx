import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Header, Screen, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { useT } from '@/i18n';

import { useOnboardingStore } from '../onboardingStore';
import { CHAPTERS, chaptersDone, hasBack, hrefFor, nextStep, type OnboardingStep } from '../steps';

/**
 * TEMPORARY (1.2): stands in for every onboarding screen until 1.4 builds them, so the flow,
 * the progress bar, back behaviour and resume can be tested end to end.
 */
export function StepPlaceholder({ step }: { step: OnboardingStep }) {
  const t = useT();
  const setStep = useOnboardingStore((s) => s.setStep);
  const complete = useOnboardingStore((s) => s.complete);
  const next = nextStep(step);

  useEffect(() => {
    setStep(step);
  }, [setStep, step]);

  const goNext = () => {
    if (next) router.push(hrefFor(next));
    else complete();
  };

  return (
    <Screen
      testID={`onboarding.${step}`}
      header={
        step === 'index' ? null : (
          <Header
            {...(hasBack(step) ? { onBack: () => router.back() } : {})}
            progress={{ total: CHAPTERS.length, done: chaptersDone(step) }}
          />
        )
      }
      footer={
        <>
          <Button
            testID={`onboarding.${step}.next`}
            label={next ? t('onboarding.placeholder.next') : t('onboarding.placeholder.finish')}
            onPress={goNext}
          />
          {__DEV__ ? (
            <Button
              label={t('dev.menu.open')}
              variant="ghost"
              size="md"
              onPress={() => router.push('/dev')}
            />
          ) : null}
        </>
      }>
      <View style={styles.body}>
        <Text variant="titleLg" accessibilityRole="header">
          {t('onboarding.placeholder.title', { screen: t(`onboarding.screens.${step}`) })}
        </Text>
        <Text variant="body" tone="body">
          {t('onboarding.placeholder.body')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: space['2xl'], gap: space.md },
});
