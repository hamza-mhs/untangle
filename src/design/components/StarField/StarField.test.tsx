import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { StarField } from './StarField';

describe('StarField', () => {
  test('renders a Skia canvas sized to the width and scaled height', async () => {
    await render(
      <StarField
        testID="stars"
        stars={[{ x: 10, y: 10, r: 1, a: 0.5, d: 4 }]}
        tileWidth={390}
        height={330}
        width={780}
      />,
    );
    // Compare the style only: the Skia tree holds host objects that don't serialise.
    expect(StyleSheet.flatten(screen.getByTestId('stars').props.style)).toMatchObject({
      width: 780,
      height: 660,
    });
  });
});
