import { Skia } from '@shopify/react-native-skia';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { ghostNodes } from '@/design/components/Ghost/ghostData';
import type { GhostNode } from '@/design/components/Ghost/ghostTypes';
import { scene } from '@/features/onboarding/components/splash/sceneData';
import type { SceneNode } from '@/features/onboarding/components/splash/sceneTypes';
import { toggleCapped } from '@/features/onboarding/logic/toggleCapped';
import { resetOnboardingNavigation } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { GOALS_MAX } from '@/features/onboarding/types';
import { useRulesStore } from '@/features/rules/store';
import { useSettingsStore } from '@/features/settings/store';
import { useTrialStore } from '@/features/paywall/trialStore';
import { haptics } from '@/lib/haptics';
import { useDevMocksStore } from '@/services/devMocks';

jest.mock('@/lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    select: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

const APP = './src/app';
const SHEET_WAIT = { timeout: 3000 };

beforeEach(() => {
  jest.clearAllMocks();
  resetOnboardingNavigation();
  useOnboardingStore.getState().reset();
  useSettingsStore.getState().setOnboarded(false);
  useDevMocksStore
    .getState()
    .set({ screenTime: 'approve', picker: 'select', notifications: 'allow', sensor: 'none' });
  useRulesStore.setState({ rules: [] });
  useTrialStore.setState({ startedAt: null });
});

describe('ghost art (real CanvasKit)', () => {
  test('every splash tangled/untangled path pair is interpolatable', () => {
    const paths = (nodes: SceneNode[]): Extract<SceneNode, { kind: 'path' }>[] =>
      nodes.flatMap((n) => (n.kind === 'group' ? paths(n.children) : n.kind === 'path' ? [n] : []));
    const all = paths(scene);
    expect(all.length).toBe(29);
    for (const p of all) {
      const a = Skia.Path.MakeFromSVGString(p.d[0])!;
      const b = Skia.Path.MakeFromSVGString(p.d[1])!;
      expect(a.isInterpolatable(b)).toBe(true);
    }
  });

  test('every standing-ghost keyframe pair is interpolatable', () => {
    const anims = (nodes: GhostNode[]): string[][] =>
      nodes.flatMap((n) => [
        ...(n.anims ?? []).flatMap((a) => (a.attr === 'd' ? [a.values] : [])),
        ...(n.kind === 'g' ? anims(n.children) : []),
      ]);
    const all = anims(ghostNodes);
    expect(all.length).toBeGreaterThan(15);
    for (const values of all) {
      const paths = values.map((d) => Skia.Path.MakeFromSVGString(d)!);
      for (let i = 1; i < paths.length; i++) {
        expect(paths[i - 1]!.isInterpolatable(paths[i]!)).toBe(true);
      }
    }
  });
});

describe('toggleCapped', () => {
  test('adds, removes, and refuses past the cap', () => {
    expect(toggleCapped([], 'a')).toEqual(['a']);
    expect(toggleCapped(['a'], 'a')).toEqual([]);
    expect(toggleCapped(['a', 'b'], 'c', GOALS_MAX)).toBeNull();
    expect(toggleCapped(['a', 'b'], 'a', GOALS_MAX)).toEqual(['b']);
  });
});

describe('onboarding 1–5', () => {
  test('Start → screen time; one tap auto-advances to apps after 250 ms', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
    expect(screen).toHavePathname('/screen-time');
    expect(haptics.tap).toHaveBeenCalled();
    expect(screen.getByLabelText('Step 2 of 15')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: '4–6 hours' }));
    expect(haptics.select).toHaveBeenCalled();
    expect(useOnboardingStore.getState().screenTime).toBe('4-6');
    expect(screen).toHavePathname('/screen-time');
    await waitFor(() => expect(screen).toHavePathname('/apps'), { timeout: 2000 });
  });

  test('apps: Continue is disabled until one chip is picked; Back keeps answers', async () => {
    await renderRouter(APP, { initialUrl: '/apps' });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'TikTok' }));
    expect(useOnboardingStore.getState().apps).toEqual(['tiktok']);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen).toHavePathname('/when');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen).toHavePathname('/apps');
    expect(screen.getByRole('checkbox', { name: 'TikTok' })).toBeChecked();
  });

  test('goals: max two; a third tap warns; Continue goes to OB06', async () => {
    await renderRouter(APP, { initialUrl: '/goals' });
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Focus for work or study' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Better sleep' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'A calmer head' }));
    expect(haptics.warning).toHaveBeenCalledTimes(1);
    expect(useOnboardingStore.getState().goals).toEqual(['focus', 'sleep']);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen).toHavePathname('/your-year');
  });

  test('resumes at the last unfinished step after a relaunch', async () => {
    useOnboardingStore.setState({ lastStep: 7, screenTime: '4-6' });
    await renderRouter(APP, { initialUrl: '/' });
    await waitFor(() => expect(screen).toHavePathname('/good-news'));
  });

  test('onboarded users skip the splash', async () => {
    useSettingsStore.getState().setOnboarded(true);
    await renderRouter(APP, { initialUrl: '/' });
    expect(screen).toHavePathname('/today');
  });
});

describe('onboarding 6–8', () => {
  test('OB06 shows their number with copy scaled to it; OB07 never shows an empty bar', async () => {
    useOnboardingStore.setState({ screenTime: '4-6' });
    await renderRouter(APP, { initialUrl: '/your-year' });
    expect(screen.getByTestId('yourYear.days')).toHaveTextContent('76');
    expect(screen.getByTestId('yourYear.body')).toHaveTextContent(
      "on your phone. That's more than two months, awake.",
    );
    expect(screen.getByText(/about 5 hours a day/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen).toHavePathname('/good-news');
    expect(screen.getByLabelText('Now, 76 days')).toBeTruthy();
    expect(screen.getByLabelText('With us, 61 days')).toBeTruthy();
    expect(screen.getByTestId('goodNews.body')).toHaveTextContent(
      'One hour less a day gives you 15 days a year back.',
    );
  });

  test('OB06 under 30 days names the number', async () => {
    useOnboardingStore.setState({ screenTime: 'lt2' });
    await renderRouter(APP, { initialUrl: '/your-year' });
    expect(screen.getByTestId('yourYear.body')).toHaveTextContent(/That's 23 days, awake./);
  });

  test('OB08: Earn preselected; the pick is saved for the first rule', async () => {
    await renderRouter(APP, { initialUrl: '/strength' });
    expect(screen.getByRole('radio', { name: /^Earn/ })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: /^Locked, Pro/ }));
    expect(useOnboardingStore.getState().strength).toBe('locked');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen).toHavePathname('/screen-time-access');
  });
});

describe('onboarding 9–11 (mock services)', () => {
  test('Screen Time approved → picker; picker cancelled → warning; picked → notifications', async () => {
    useDevMocksStore.getState().set({ picker: 'cancel' });
    await renderRouter(APP, { initialUrl: '/screen-time-access' });
    await fireEvent.press(screen.getByRole('button', { name: 'Show me' }));
    await waitFor(() => expect(screen).toHavePathname('/pick-apps'), SHEET_WAIT);
    expect(useOnboardingStore.getState().blocking).toBe('approved');

    await fireEvent.press(screen.getByRole('button', { name: 'Open picker' }));
    await waitFor(
      () => expect(screen.getByText('Pick at least one to continue.')).toBeTruthy(),
      SHEET_WAIT,
    );
    expect(screen).toHavePathname('/pick-apps');

    useDevMocksStore.getState().set({ picker: 'select' });
    await fireEvent.press(screen.getByRole('button', { name: 'Open picker' }));
    await waitFor(() => expect(screen).toHavePathname('/notifications'), SHEET_WAIT);
    expect(useOnboardingStore.getState().appSelection).not.toBeNull();
  });

  test('Screen Time denied → E01; "Continue without blocking" skips the picker', async () => {
    useDevMocksStore.getState().set({ screenTime: 'deny' });
    await renderRouter(APP, { initialUrl: '/screen-time-access' });
    await fireEvent.press(screen.getByRole('button', { name: 'Show me' }));
    await waitFor(() => expect(screen).toHavePathname('/screen-time-denied'), SHEET_WAIT);
    expect(screen.getByText('Blocking needs Screen Time access')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue without blocking' }));
    expect(screen).toHavePathname('/notifications');
    expect(useOnboardingStore.getState().blocking).toBe('skipped');
  });

  test('E01 "Try again" re-requests and continues to the picker when approved', async () => {
    useDevMocksStore.getState().set({ screenTime: 'approve' });
    await renderRouter(APP, { initialUrl: '/screen-time-denied' });
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen).toHavePathname('/pick-apps'), SHEET_WAIT);
  });

  test('notifications denied still continues and queues E02 for Home', async () => {
    useDevMocksStore.getState().set({ notifications: 'deny' });
    await renderRouter(APP, { initialUrl: '/notifications' });
    await fireEvent.press(screen.getByRole('button', { name: 'Show me' }));
    await waitFor(() => expect(screen).toHavePathname('/quiet-minute'));
    expect(useOnboardingStore.getState()).toMatchObject({
      notifications: 'denied',
      isNotificationsSheetPending: true,
    });
  });
});

describe('onboarding 12–15', () => {
  test('OB12 without a sensor: Hold fallback; Skip after 10 s fixes the Clarity and moves on', async () => {
    jest.useFakeTimers();
    try {
      useOnboardingStore.setState({ screenTime: '4-6', when: ['morning', 'bed'] });
      await renderRouter(APP, { initialUrl: '/quiet-minute' });
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Hold to continue' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();

      await fireEvent(screen.getByRole('button', { name: 'Hold to continue' }), 'pressIn');
      expect(screen.getByTestId('quietMinute.status.running')).toBeTruthy();
      await fireEvent(screen.getByRole('button', { name: 'Hold to continue' }), 'pressOut');
      expect(screen.getByTestId('quietMinute.status.paused')).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(10_000);
      });
      await fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
      expect(screen).toHavePathname('/knot-loosened');
      expect(useOnboardingStore.getState().startingClarity).toBe(36);
      expect(screen.getByLabelText('Starting Clarity 36 out of 100')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  test('OB14 summarises the answers', async () => {
    useOnboardingStore.setState({
      apps: ['instagram', 'tiktok', 'youtube'],
      when: ['morning'],
      screenTime: '4-6',
    });
    await renderRouter(APP, { initialUrl: '/plan' });
    expect(screen.getByText('Instagram, TikTok, YouTube')).toBeTruthy();
    expect(screen.getByText('Bedtime 23:00–07:00, on by default · mornings 7–9')).toBeTruthy();
    expect(screen.getByText('1 hour less a day')).toBeTruthy();
    expect(screen.getByText('15 days a year back')).toBeTruthy();
  });

  test('OB15 creates bedtime + mornings rules with the OB08 strength, starts the trial, goes Home', async () => {
    useOnboardingStore.setState({
      blocking: 'approved',
      appSelection: { platform: 'ios', token: 't', count: 3 },
      strength: 'locked',
      when: ['morning'],
    });
    await renderRouter(APP, { initialUrl: '/trial' });
    await fireEvent.press(screen.getByRole('button', { name: 'Turn on my first lock' }));
    expect(screen).toHavePathname('/today');
    const rules = useRulesStore.getState().rules;
    expect(rules.map((r) => [r.name, r.schedule.start, r.strength])).toEqual([
      ['Bedtime', '23:00', 'locked'],
      ['Mornings', '07:00', 'locked'],
    ]);
    expect(useTrialStore.getState().startedAt).not.toBeNull();
    expect(useSettingsStore.getState().onboarded).toBe(true);
  });

  test('OB15 in no-blocking mode creates no rules and leaves the trial for the first lock', async () => {
    useOnboardingStore.setState({ blocking: 'skipped' });
    await renderRouter(APP, { initialUrl: '/trial' });
    await fireEvent.press(screen.getByRole('button', { name: 'Turn on my first lock' }));
    expect(screen).toHavePathname('/today');
    expect(useRulesStore.getState().rules).toEqual([]);
    expect(useTrialStore.getState().startedAt).toBeNull();
  });
});

describe('E02 notifications off', () => {
  test('shows once on the first Home open, never again', async () => {
    useSettingsStore.getState().setOnboarded(true);
    useOnboardingStore.setState({ isNotificationsSheetPending: true });
    await renderRouter(APP, { initialUrl: '/today' });
    await waitFor(() => expect(screen).toHavePathname('/notifications-off'));
    expect(screen.getByText('Notifications are off')).toBeTruthy();
    expect(useOnboardingStore.getState().isNotificationsSheetPending).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(screen).toHavePathname('/today');
  });
});
