import { render, screen } from '@testing-library/react-native';

import { Countdown, formatRemaining } from './Countdown';

describe('formatRemaining', () => {
  test.each([
    [0, '0:00'],
    [-5000, '0:00'],
    [999, '0:01'],
    [65_000, '1:05'],
    [3_600_000, '1:00:00'],
    [3_725_000, '1:02:05'],
  ])('%d ms → %s', async (ms, text) => {
    expect(formatRemaining(ms)).toBe(text);
  });
});

test('announces minutes left', async () => {
  await render(<Countdown endsAt={Date.now() + 5 * 60_000} testID="c" />);
  expect(screen.getByTestId('c').props.accessibilityLabel).toBe('5 minutes left');
});
