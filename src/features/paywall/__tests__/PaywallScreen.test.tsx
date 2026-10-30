import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useToastStore } from '@/lib/toast';
import { useDevMocksStore } from '@/services/devMocks';
import { NO_ENTITLEMENT, purchases, useEntitlementStore } from '@/services/purchases';

import { CLOSE_DELAY_MS, PaywallScreen } from '../PaywallScreen';

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function show(onDone = jest.fn()) {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PaywallScreen onDone={onDone} />
    </SafeAreaProvider>,
  );
  return onDone;
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  useDevMocksStore.getState().set({ offerings: 'ready', purchase: 'success', restore: 'found' });
  useEntitlementStore.getState().set(NO_ENTITLEMENT);
  useToastStore.getState().hide();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('PaywallScreen', () => {
  it('uses the mock store in tests', () => {
    expect(purchases.isMock).toBe(true);
  });

  it('shows skeletons, then both plans with SAVE % and weekly prices', async () => {
    await show();
    expect(screen.getByTestId('paywall.skeleton', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('paywall.cta')).toBeDisabled();
    await advance(1000);
    expect(screen.getByText('Save 64%')).toBeTruthy();
    // The currency symbol follows the machine's locale ("$" or "US$").
    expect(screen.getByText(/^Just \S*0\.58 a week$/)).toBeTruthy();
    expect(screen.getByText(/^\S*1\.61 a week$/)).toBeTruthy();
    expect(screen.getByText('Start 3-day free trial')).toBeTruthy();
  });

  it('monthly without a trial says Subscribe', async () => {
    await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.plan.monthly'));
    expect(screen.getByText('Subscribe')).toBeTruthy();
    expect(screen.getByText(/\$6\.99 a month\. Cancel any time in Google Play\./)).toBeTruthy();
  });

  it('close appears after 2 s and continues on the free tier', async () => {
    const onDone = await show();
    expect(screen.getByTestId('paywall.close')).toBeDisabled();
    await advance(CLOSE_DELAY_MS);
    await fireEvent.press(screen.getByTestId('paywall.close'));
    expect(onDone).toHaveBeenCalledWith('free');
  });

  it('offline: message, Retry, and close at once', async () => {
    useDevMocksStore.getState().set({ offerings: 'offline' });
    await show();
    await advance(1000);
    expect(screen.getByText("Can't load prices. Check your connection.")).toBeTruthy();
    expect(screen.getByTestId('paywall.close')).toBeEnabled();
  });

  it('a purchase grants Pro and continues', async () => {
    const onDone = await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.cta'));
    await advance(1000);
    expect(onDone).toHaveBeenCalledWith('pro');
    expect(useEntitlementStore.getState().entitlement.isActive).toBe(true);
  });

  it('cancelling stays on the paywall without a message', async () => {
    useDevMocksStore.getState().set({ purchase: 'cancelled' });
    const onDone = await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.cta'));
    await advance(1000);
    expect(onDone).not.toHaveBeenCalled();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('pending payment continues with a note', async () => {
    useDevMocksStore.getState().set({ purchase: 'pending' });
    const onDone = await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.cta'));
    await advance(1000);
    expect(onDone).toHaveBeenCalledWith('pending');
    expect(useToastStore.getState().toast?.title).toMatch(/pending/);
  });

  it('restore that finds Pro continues', async () => {
    const onDone = await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.restore'));
    await advance(1000);
    expect(onDone).toHaveBeenCalledWith('pro');
    expect(useToastStore.getState().toast?.title).toBe('Welcome back. Pro is active.');
  });

  it('restore with nothing found shows a toast', async () => {
    useDevMocksStore.getState().set({ restore: 'none' });
    const onDone2 = await show();
    await advance(1000);
    await fireEvent.press(screen.getByTestId('paywall.restore'));
    await advance(1000);
    expect(onDone2).not.toHaveBeenCalled();
    expect(useToastStore.getState().toast?.title).toBe(
      'No purchase found for this Google account.',
    );
  });
});
