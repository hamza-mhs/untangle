import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChoiceChip } from './ChoiceChip';

describe('ChoiceChip', () => {
  test('is a checkbox reflecting selection', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<ChoiceChip label="TikTok" accent="sky" selected={false} onPress={onPress} />);
    expect(screen.getByRole('checkbox', { name: 'TikTok' })).not.toBeChecked();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'TikTok' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await rerender(<ChoiceChip label="TikTok" accent="sky" selected onPress={onPress} />);
    expect(screen.getByRole('checkbox', { name: 'TikTok' })).toBeChecked();
  });
});
