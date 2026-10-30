import { fireEvent, render, screen } from '@testing-library/react-native';

import { Header } from './Header';

test('back chip is labelled and calls onBack; progress is shown', async () => {
  const onBack = jest.fn();
  await render(<Header onBack={onBack} progress={{ total: 5, done: 2 }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalled();
  expect(screen.getByRole('progressbar')).toBeTruthy();
});

test('title mode shows a header and no back chip without onBack', async () => {
  await render(<Header title="Screen time" />);
  expect(screen.getByRole('header', { name: 'Screen time' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
});
