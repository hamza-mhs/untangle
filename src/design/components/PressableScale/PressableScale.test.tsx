import { fireEvent, render, screen } from '@testing-library/react-native';

import { PressableScale } from './PressableScale';

test('calls onPress, and not when disabled', async () => {
  const onPress = jest.fn();
  const { rerender } = await render(<PressableScale testID="p" onPress={onPress} />);
  await fireEvent.press(screen.getByTestId('p'));
  expect(onPress).toHaveBeenCalledTimes(1);
  await rerender(<PressableScale testID="p" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByTestId('p'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
