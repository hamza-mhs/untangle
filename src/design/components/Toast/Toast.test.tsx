import { act, render, screen } from '@testing-library/react-native';

import { Toast } from './Toast';

test('auto-dismisses after its duration', async () => {
  jest.useFakeTimers();
  const onDismiss = jest.fn();
  await render(<Toast title="Saved" tone="success" durationMs={1000} onDismiss={onDismiss} />);
  expect(screen.getByText('Saved')).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(onDismiss).toHaveBeenCalled();
  jest.useRealTimers();
});
