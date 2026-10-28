import { render, screen } from '@testing-library/react-native';

import { Text } from '../Text';
import { Screen } from './Screen';

describe('Screen', () => {
  test('renders header, scrolling content and a pinned footer', async () => {
    await render(
      <Screen header={<Text>Header</Text>} footer={<Text>Footer</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });
});
