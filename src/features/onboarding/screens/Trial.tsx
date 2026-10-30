import { router } from 'expo-router';

import { PaywallScreen } from '@/features/paywall';

import { goBack, useTrackStep } from '../components/OnboardingFrame';
import { CHAPTERS, chaptersDone, hrefFor } from '../steps';

/** §2.15 Paywall (trial). Every outcome continues to Set up; closing keeps the free tier. */
export function TrialScreen() {
  useTrackStep('trial');
  return (
    <PaywallScreen
      testID="onboarding.trial"
      header={{
        onBack: () => goBack('trial'),
        progress: { total: CHAPTERS.length, done: chaptersDone('trial') },
      }}
      onDone={() => router.push(hrefFor('permissions'))}
    />
  );
}
