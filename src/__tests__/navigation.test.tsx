import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useLocksStore } from '@/features/locks';
import {
  ONBOARDING_STEPS,
  resetWelcomeResume,
  resumeStep,
  useOnboardingStore,
  usePermissionFlow,
} from '@/features/onboarding';
import { resetMockBlocker } from '@/native';

/** The real app routes (src/app). */
const APP = 'src/app';

beforeEach(() => {
  useOnboardingStore.getState().reset();
  useLocksStore.setState({ locks: [] });
  usePermissionFlow.getState().reset();
  resetMockBlocker();
  resetWelcomeResume();
});

describe('onboarding flow', () => {
  test('a new user starts on the welcome slides', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    expect(screen.getByTestId('onboarding.index')).toBeTruthy();
    expect(screen.getByTestId('onboarding.welcome.slide.block')).toBeTruthy();
  });

  test('Get started walks the three slides, then the age question', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByTestId('onboarding.index.cta'));
    expect(await screen.findByTestId('onboarding.age')).toBeTruthy();
    expect(useOnboardingStore.getState().step).toBe('age');
  });

  test('a single-choice answer is saved and moves on by itself', async () => {
    await renderRouter(APP, { initialUrl: '/age' });
    await fireEvent.press(screen.getByTestId('onboarding.age.25to34'));
    expect(useOnboardingStore.getState().answers.ageMid).toBe(29);
    expect(await screen.findByTestId('onboarding.scroll-time', {}, { timeout: 2000 })).toBeTruthy();
  });

  test('focus signs: Continue waits for a pick and None is exclusive', async () => {
    await renderRouter(APP, { initialUrl: '/focus-signs' });
    expect(screen.getByTestId('onboarding.focus-signs.cta')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('onboarding.focusSigns.work'));
    await fireEvent.press(screen.getByTestId('onboarding.focusSigns.none'));
    expect(useOnboardingStore.getState().answers).toMatchObject({ signs: [], signsNone: true });
    expect(screen.getByTestId('onboarding.focus-signs.cta')).toBeEnabled();
  });

  test('the year screen shows the maths from the answers', async () => {
    await act(async () => {
      const s = useOnboardingStore.getState();
      s.setAnswer('scrollHours', 2.5);
      s.setAnswer('scrollAnswer', '2to3');
      s.setAnswer('ageMid', 21);
    });
    await renderRouter(APP, { initialUrl: '/your-year' });
    expect(screen.getByText("That's 38 days of your year.")).toBeTruthy();
    expect(screen.getByText(/190 days by the time you're 26/)).toBeTruthy();
  });

  test('foggy screen switches to the calm variant with no signs', async () => {
    await renderRouter(APP, { initialUrl: '/problem-foggy' });
    expect(screen.getByText('Your focus is worth guarding.')).toBeTruthy();
  });

  test.each(ONBOARDING_STEPS.filter((s) => s !== 'index' && s !== 'studying'))(
    'resumes on %s after the app was killed',
    async (step) => {
      await act(async () => {
        useOnboardingStore.getState().setStep(step);
      });
      await renderRouter(APP, { initialUrl: '/' });
      expect(await screen.findByTestId(`onboarding.${resumeStep(step)}`)).toBeTruthy();
    },
  );

  test('pick apps creates one lock per picked app (30 min, gentle)', async () => {
    await renderRouter(APP, { initialUrl: '/pick-apps' });
    expect(await screen.findByTestId('onboarding.pickApps.app.com.instagram.android')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding.pick-apps.cta'));
    const locks = useLocksStore.getState().locks;
    expect(locks).toHaveLength(3);
    expect(locks.every((l) => l.dailyMinutes === 30 && l.strictness === 'gentle')).toBe(true);
    expect(await screen.findByTestId('onboarding.all-set')).toBeTruthy();
  });

  test('leaving All set completes onboarding and shows the tabs', async () => {
    await renderRouter(APP, { initialUrl: '/all-set' });
    await fireEvent.press(screen.getByTestId('onboarding.all-set.home'));
    expect(useOnboardingStore.getState().completedAt).not.toBeNull();
    expect(await screen.findByTestId('tab.today')).toBeTruthy();
  });

  test('once onboarding is complete the root shows the four tabs', async () => {
    await act(async () => {
      useOnboardingStore.getState().complete(1);
    });
    await renderRouter(APP, { initialUrl: '/' });
    expect(screen.getByTestId('tab.today')).toBeTruthy();
    for (const tab of ['today', 'games', 'progress', 'block']) {
      expect(screen.getByTestId(`tab.${tab}.button`)).toBeTruthy();
    }
    await fireEvent.press(screen.getByTestId('tab.block.button'));
    expect(await screen.findByTestId('tab.block')).toBeTruthy();
  });
});
