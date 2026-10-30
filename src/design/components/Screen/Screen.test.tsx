import { render, screen } from '@testing-library/react-native';

import { Text } from '../Text';
import { Screen } from './Screen';

test('renders header, content and footer', async () => {
  await render(
    <Screen header={<Text>Head</Text>} footer={<Text>Foot</Text>} scroll>
      <Text>Body</Text>
    </Screen>,
  );
  expect(screen.getByText('Head')).toBeTruthy();
  expect(screen.getByText('Body')).toBeTruthy();
  expect(screen.getByText('Foot')).toBeTruthy();
});
