import { render, screen } from '@testing-library/react-native';

import { Skeleton } from './Skeleton';

test('sized placeholder hidden from TalkBack', async () => {
  await render(<Skeleton height={50} width={120} testID="s" />);
  const el = screen.getByTestId('s', { includeHiddenElements: true });
  expect(el).toHaveStyle({ height: 50, width: 120 });
  expect(el.props.accessibilityElementsHidden).toBe(true);
});
