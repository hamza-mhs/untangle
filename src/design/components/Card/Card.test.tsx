import { fireEvent, render, screen } from '@testing-library/react-native';

import { Text } from '../Text';
import { Card } from './Card';

test('static and pressable cards', async () => {
  const onPress = jest.fn();
  await render(
    <>
      <Card>
        <Text>Static</Text>
      </Card>
      <Card onPress={onPress} accessibilityLabel="Open">
        <Text>Tap</Text>
      </Card>
    </>,
  );
  expect(screen.getByText('Static')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Open' }));
  expect(onPress).toHaveBeenCalled();
});
