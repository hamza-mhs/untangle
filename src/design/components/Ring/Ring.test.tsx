import { render, screen } from '@testing-library/react-native';

import { Ring } from './Ring';

test('clamps progress and reports it', async () => {
  await render(<Ring progress={1.4} size={64} accessibilityLabel="Time left" testID="r" />);
  expect(screen.getByTestId('r').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
});
