import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChoiceChip } from './ChoiceChip';

test('a selectable chip', async () => {
  const onPress = jest.fn();
  await render(<ChoiceChip label="30 min" selected={false} onPress={onPress} />);
  await fireEvent.press(screen.getByRole('radio', { name: '30 min' }));
  expect(onPress).toHaveBeenCalled();
});
