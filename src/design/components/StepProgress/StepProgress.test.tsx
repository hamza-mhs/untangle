import { render, screen } from '@testing-library/react-native';

import { StepProgress } from './StepProgress';

test('announces done of total', async () => {
  await render(<StepProgress total={5} done={2} />);
  const bar = screen.getByRole('progressbar');
  expect(bar.props.accessibilityLabel).toBe('Step 2 of 5');
  expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 2 });
});
