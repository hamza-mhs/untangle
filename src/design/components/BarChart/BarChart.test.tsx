import { render, screen } from '@testing-library/react-native';

import { BarChart } from './BarChart';

test('one accessible bar per day plus the legend', async () => {
  await render(
    <BarChart
      data={[
        { label: 'M', blocked: 20, other: 60, a11y: 'Monday 1h 20m' },
        { label: 'T', blocked: 10, other: 30, isToday: true, a11y: 'Tuesday 40m' },
      ]}
      legend={{ blocked: 'Blocked apps', other: 'Everything else' }}
    />,
  );
  expect(screen.getByLabelText('Monday 1h 20m')).toBeTruthy();
  expect(screen.getByLabelText('Tuesday 40m')).toBeTruthy();
  expect(screen.getByText('Blocked apps', { includeHiddenElements: true })).toBeTruthy();
});
