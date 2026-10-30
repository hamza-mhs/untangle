import { fireEvent, render, screen } from '@testing-library/react-native';

import { Segmented } from './Segmented';

test('selects another segment', async () => {
  const onChange = jest.fn();
  await render(
    <Segmented
      options={[
        { value: 'week', label: 'This week' },
        { value: 'month', label: 'This month' },
      ]}
      value="week"
      onChange={onChange}
    />,
  );
  expect(screen.getByRole('tab', { name: 'This week' }).props.accessibilityState).toMatchObject({
    selected: true,
  });
  await fireEvent.press(screen.getByRole('tab', { name: 'This month' }));
  expect(onChange).toHaveBeenCalledWith('month');
});
