import { fireEvent, render, screen } from '@testing-library/react-native';

import { Banner } from './Banner';

test('tappable banner reads title, body and action', async () => {
  const onPress = jest.fn();
  await render(<Banner title="Blocking might stop" body="Battery" actionLabel="Fix it" onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Blocking might stop. Battery. Fix it' }));
  expect(onPress).toHaveBeenCalled();
});

test('static banner is an alert', async () => {
  await render(<Banner title="Heads up" />);
  expect(screen.getByRole('alert')).toBeTruthy();
});
