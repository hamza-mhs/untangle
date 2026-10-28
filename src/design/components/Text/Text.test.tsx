import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { color, typeScale } from '../../tokens';
import { Text } from './Text';

describe('Text', () => {
  test('applies the variant, tone and tabular figures', async () => {
    await render(
      <Text variant="title.m" tone="muted">
        Hello
      </Text>,
    );
    const style = StyleSheet.flatten(screen.getByText('Hello').props.style);
    expect(style).toMatchObject({
      fontSize: typeScale['title.m'].fontSize,
      fontFamily: typeScale['title.m'].fontFamily,
      color: color.text.muted,
      fontVariant: ['tabular-nums'],
    });
  });

  test('Dynamic Type caps: titles 1.3, body 1.6, display 1.0', async () => {
    await render(
      <>
        <Text variant="title.l">T</Text>
        <Text variant="body">B</Text>
        <Text variant="display.xl">D</Text>
      </>,
    );
    expect(screen.getByText('T').props.maxFontSizeMultiplier).toBe(1.3);
    expect(screen.getByText('B').props.maxFontSizeMultiplier).toBe(1.6);
    expect(screen.getByText('D').props.maxFontSizeMultiplier).toBe(1);
  });
});
