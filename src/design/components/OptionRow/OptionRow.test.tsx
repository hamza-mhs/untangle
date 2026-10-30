import { fireEvent, render, screen } from '@testing-library/react-native';

import { OptionRow } from './OptionRow';

test('single select is a radio with its checked state', async () => {
  const onPress = jest.fn();
  await render(<OptionRow label="18 to 24" emoji="🎓" selected onPress={onPress} />);
  const row = screen.getByRole('radio', { name: '18 to 24' });
  expect(row.props.accessibilityState).toMatchObject({ checked: true });
  await fireEvent.press(row);
  expect(onPress).toHaveBeenCalled();
});

test('multi select is a checkbox', async () => {
  await render(<OptionRow label="A foggy mind" multi selected={false} onPress={() => {}} />);
  expect(
    screen.getByRole('checkbox', { name: 'A foggy mind' }).props.accessibilityState,
  ).toMatchObject({ checked: false });
});
