import { render, screen } from '@testing-library/react-native';

import { ProgressDots } from './ProgressDots';

test('labels the current page', async () => {
  await render(<ProgressDots count={3} index={1} testID="dots" />);
  expect(screen.getByTestId('dots').props.accessibilityLabel).toBe('Page 2 of 3');
});
