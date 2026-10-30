import { fireEvent, render, screen } from '@testing-library/react-native';

import { Stepper } from './Stepper';

test('steps within bounds', async () => {
  const onChange = jest.fn();
  await render(<Stepper value={5} min={1} max={5} onChange={onChange} accessibilityLabel="Goal" testID="s" />);
  await fireEvent.press(screen.getByTestId('s.plus'));
  expect(onChange).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('s.minus'));
  expect(onChange).toHaveBeenCalledWith(4);
  expect(screen.getByTestId('s').props.accessibilityValue).toEqual({ min: 1, max: 5, now: 5 });
});
