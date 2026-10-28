import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { onboardingSteps } from '@/features/onboarding/steps';
import { useSettingsStore } from '@/features/settings/store';
import { useDevMocksStore } from '@/services/devMocks';

const APP = './src/app';

describe('navigation skeleton', () => {
  test('first launch opens the onboarding splash', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    expect(screen).toHavePathname('/');
    expect(screen.getByText('Your attention is tangled.')).toBeTruthy();
  });

  test('there are exactly 15 onboarding steps', () => {
    expect(onboardingSteps).toHaveLength(15);
  });

  test('four tabs, no centre Focus button; Start focus lives on Home', async () => {
    useSettingsStore.getState().setOnboarded(true);
    useDevMocksStore.getState().set({ home: 'idle' });
    await renderRouter(APP, { initialUrl: '/today' });
    for (const label of ['Today', 'Challenges', 'Block', 'Rewards']) {
      expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    }
    expect(screen.getAllByRole('button', { name: 'Start focus' })).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('home.startFocus'));
    expect(screen).toHavePathname('/focus/start');
  });

  test.each([
    '/block',
    '/paywall',
    '/settings',
    '/settings/billing',
    '/rule/new',
    '/challenges',
    '/rewards',
    '/reps/target',
    '/receipt',
    '/lights-out',
    '/reading',
  ])('%s renders', async (url) => {
    await renderRouter(APP, { initialUrl: url });
    expect(screen).toHavePathname(url);
  });
});
