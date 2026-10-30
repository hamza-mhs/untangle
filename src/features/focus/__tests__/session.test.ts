import { resetMockBlocker } from '@/native';

import { formatCountdown, isActive, minutesLeft, useFocusStore } from '../session';

describe('focus session helpers', () => {
  it('counts down', () => {
    expect(formatCountdown(24 * 60_000 + 22_000)).toBe('24:22');
    expect(formatCountdown(500)).toBe('0:01');
    expect(formatCountdown(-5)).toBe('0:00');
    expect(minutesLeft({ endAt: 10 * 60_000 + 1 }, 0)).toBe(11);
    expect(minutesLeft({ endAt: 0 }, 5)).toBe(0);
  });
});

describe('useFocusStore', () => {
  beforeEach(() => {
    resetMockBlocker();
    useFocusStore.setState({ session: null, finished: null });
  });

  it('runs one session at a time', async () => {
    expect(await useFocusStore.getState().start(25, ['app:x'], 0)).toBe('started');
    expect(isActive(useFocusStore.getState().session, 1000)).toBe(true);
    expect(await useFocusStore.getState().start(25, ['app:x'], 1000)).toBe('alreadyRunning');
  });

  it('ending early records the minutes done', async () => {
    await useFocusStore.getState().start(25, ['app:x'], 0);
    await useFocusStore.getState().end(true, 2, 10 * 60_000);
    expect(useFocusStore.getState().session).toBeNull();
    expect(useFocusStore.getState().finished).toEqual({
      minutes: 10,
      endedEarly: true,
      detours: 2,
    });
  });

  it('a session that ran out counts its full length', async () => {
    await useFocusStore.getState().start(25, ['app:x'], 0);
    await useFocusStore.getState().end(false, 0, 40 * 60_000);
    expect(useFocusStore.getState().finished?.minutes).toBe(25);
  });
});
