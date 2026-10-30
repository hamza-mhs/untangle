import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar, TabBarButton } from './TabBar';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

test('tabs report selection and press', async () => {
  const onPress = jest.fn();
  await render(<SafeAreaProvider initialMetrics={metrics}><TabBar>
      <TabBarButton icon="tabToday" label="Today" isFocused onPress={onPress} />
      <TabBarButton icon="tabBlock" label="Block" />
    </TabBar></SafeAreaProvider>);
  expect(screen.getByRole('tab', { name: 'Today' }).props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByRole('tab', { name: 'Block' }).props.accessibilityState).toMatchObject({ selected: false });
  await fireEvent.press(screen.getByRole('tab', { name: 'Today' }));
  expect(onPress).toHaveBeenCalled();
});
