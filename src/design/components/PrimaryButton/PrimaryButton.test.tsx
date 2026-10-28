import { fireEvent, render, screen } from '@testing-library/react-native';

import { haptics } from '@/lib/haptics';

import { PrimaryButton } from './PrimaryButton';

jest.mock('@/lib/haptics', () => ({
  haptics: { tap: jest.fn(), select: jest.fn(), success: jest.fn(), warning: jest.fn(), error: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('PrimaryButton', () => {
  test('fires onPress with a tap haptic', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Start" icon="arrowRight" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(haptics.tap).toHaveBeenCalledTimes(1);
  });

  test('disabled: not pressable, announced as disabled', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Continue" variant="light" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('loading: swaps the label for "Loading…" and is busy', async () => {
    await render(<PrimaryButton label="Keep Pro" loading onPress={() => {}} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('Keep Pro')).toBeNull();
    expect(screen.getByRole('button')).toBeBusy();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test.each(['accent', 'light', 'outline', 'ghost'] as const)('renders the %s variant', async (variant) => {
    await render(<PrimaryButton label={variant} variant={variant} onPress={() => {}} />);
    expect(screen.getByRole('button', { name: variant })).toBeTruthy();
  });
});
