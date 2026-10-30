import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

test.each(['primary', 'brand', 'secondary', 'ghost', 'danger'] as const)(
  '%s renders its label',
  async (variant) => {
    await render(<Button label="Continue" variant={variant} onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  },
);

test('loading and disabled block presses and expose their state', async () => {
  const onPress = jest.fn();
  const { rerender } = await render(<Button testID="b" label="Go" loading onPress={onPress} />);
  await fireEvent.press(screen.getByTestId('b'));
  expect(screen.getByTestId('b').props.accessibilityState).toMatchObject({
    busy: true,
    disabled: true,
  });
  await rerender(<Button testID="b" label="Go" disabled onPress={onPress} />);
  await fireEvent.press(screen.getByTestId('b'));
  expect(onPress).not.toHaveBeenCalled();
});
