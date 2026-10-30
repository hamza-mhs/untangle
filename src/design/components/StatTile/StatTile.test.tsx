import { render, screen } from '@testing-library/react-native';

import { StatTile } from './StatTile';

test('one accessible summary', async () => {
  await render(<StatTile label="Pick-ups" value="71" delta={{ text: '12 fewer than usual', tone: 'good' }} testID="t" />);
  expect(screen.getByTestId('t').props.accessibilityLabel).toBe('Pick-ups, 71, 12 fewer than usual');
});
