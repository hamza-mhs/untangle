import { render, screen } from '@testing-library/react-native';

import { HourChart } from './HourChart';

test('labelled chart with axis', async () => {
  await render(
    <HourChart
      values={Array.from({ length: 24 }, (_, i) => i)}
      highlight={[20]}
      axis={['12 AM', '6 AM', '12 PM', '6 PM']}
      accessibilityLabel="Pick-ups by hour"
    />,
  );
  expect(screen.getByLabelText('Pick-ups by hour')).toBeTruthy();
  expect(screen.getByText('6 PM')).toBeTruthy();
});
