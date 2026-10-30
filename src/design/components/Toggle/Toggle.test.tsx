import { fireEvent, render, screen } from '@testing-library/react-native';

import { Toggle } from './Toggle';

test('flips its value and exposes checked', async () => {
  const onChange = jest.fn();
  await render(<Toggle value={false} onChange={onChange} accessibilityLabel="Sound" />);
  const sw = screen.getByRole('switch', { name: 'Sound' });
  expect(sw.props.accessibilityState).toMatchObject({ checked: false });
  await fireEvent.press(sw);
  expect(onChange).toHaveBeenCalledWith(true);
});
