import { fireEvent, render, screen } from '@testing-library/react-native';

import { GameCard } from './GameCard';

test('reads name, meta and tag; opens on press', async () => {
  const onPress = jest.fn();
  await render(<GameCard name="Stack tower" meta="Timing · 40 sec" gameColor="orange" isNew onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Stack tower, Timing · 40 sec, New' }));
  expect(onPress).toHaveBeenCalled();
});

test('locked card shows the Pro tag', async () => {
  await render(<GameCard name="Rocket hop" meta="Timing" gameColor="blue" isLocked onPress={() => {}} />);
  expect(screen.getByText('Pro')).toBeTruthy();
});
