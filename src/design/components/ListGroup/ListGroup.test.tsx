import { fireEvent, render, screen } from '@testing-library/react-native';

import { Toggle } from '../Toggle';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';

test('rows, a label, a pressable row and a control row', async () => {
  const onPress = jest.fn();
  await render(
    <ListGroup label="Privacy">
      <ListRow title="Unlock length" value="5 min" onPress={onPress} />
      <ListRow
        title="Sound"
        trailing={<Toggle value onChange={() => {}} accessibilityLabel="Sound" />}
      />
    </ListGroup>,
  );
  expect(screen.getByText('Privacy')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Unlock length, 5 min' }));
  expect(onPress).toHaveBeenCalled();
  expect(screen.getByRole('switch', { name: 'Sound' })).toBeTruthy();
});
