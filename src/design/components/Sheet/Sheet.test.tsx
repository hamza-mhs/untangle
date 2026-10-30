import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '../Button';
import { Sheet } from './Sheet';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

test('shows title, body and actions; scrim closes when dismissible', async () => {
  const onClose = jest.fn();
  await render(<SafeAreaProvider initialMetrics={metrics}><Sheet
      visible
      onClose={onClose}
      title="Turn off?"
      body="You can turn it back on."
      actions={<Button label="Turn off" onPress={() => {}} />}
    /></SafeAreaProvider>);
  expect(screen.getByRole('header', { name: 'Turn off?' })).toBeTruthy();
  expect(screen.getByText('You can turn it back on.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close', includeHiddenElements: true }));
  expect(onClose).toHaveBeenCalled();
});

test('not dismissible: no close target', async () => {
  await render(<SafeAreaProvider initialMetrics={metrics}><Sheet visible dismissible={false} onClose={() => {}} title="Choose" /></SafeAreaProvider>);
  expect(screen.queryByRole('button', { name: 'Close', includeHiddenElements: true })).toBeNull();
});
