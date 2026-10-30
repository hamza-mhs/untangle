import { render, screen } from '@testing-library/react-native';

import { GameIcon } from './GameIcon';

test('decorative badge with a lip below the face', async () => {
  await render(<GameIcon color="orange" glyph="timer" size={50} testID="g" />);
  const el = screen.getByTestId('g', { includeHiddenElements: true });
  expect(el.props.accessibilityElementsHidden).toBe(true);
  expect(el).toHaveStyle({ width: 50, height: 54 });
});
