import { render, screen } from '@testing-library/react-native';

import { color, type } from '../../tokens';
import { Text } from './Text';

test('applies the type role and tone', async () => {
  await render(
    <Text variant="titleLg" tone="secondary">
      Hello
    </Text>,
  );
  expect(screen.getByText('Hello')).toHaveStyle({
    fontSize: type.titleLg.fontSize,
    color: color.text.secondary,
  });
});

test('caps font scaling on titles, not on body text', async () => {
  await render(
    <>
      <Text variant="display">Big</Text>
      <Text variant="body">Small</Text>
    </>,
  );
  expect(screen.getByText('Big').props.maxFontSizeMultiplier).toBe(1.3);
  expect(screen.getByText('Small').props.maxFontSizeMultiplier).toBe(2);
});
