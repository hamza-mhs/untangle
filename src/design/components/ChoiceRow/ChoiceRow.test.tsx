import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChoiceRow } from './ChoiceRow';

describe('ChoiceRow', () => {
  test('single mode is a radio with checked state', async () => {
    await render(<ChoiceRow label="4–6 hours" mode="single" accent="pink" selected onPress={() => {}} />);
    expect(screen.getByRole('radio', { name: '4–6 hours' })).toBeChecked();
  });

  test('multi mode is a checkbox and reports presses', async () => {
    const onPress = jest.fn();
    await render(<ChoiceRow label="In bed at night" mode="multi" accent="peri" selected={false} onPress={onPress} />);
    const row = screen.getByRole('checkbox', { name: 'In bed at night' });
    expect(row).not.toBeChecked();
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('sub-line shows only when selected, and is part of the label', async () => {
    const props = { label: 'Better sleep', sub: 'Phone down overnight', mode: 'multi', accent: 'green', onPress: () => {} } as const;
    const { rerender } = await render(<ChoiceRow {...props} selected={false} />);
    expect(screen.queryByText('Phone down overnight')).toBeNull();
    await rerender(<ChoiceRow {...props} selected />);
    expect(screen.getByText('Phone down overnight')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Better sleep, Phone down overnight' })).toBeTruthy();
  });
});
