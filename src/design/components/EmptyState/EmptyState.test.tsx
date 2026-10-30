import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

test('title, body and action', async () => {
  const onAction = jest.fn();
  await render(<EmptyState icon="lockOutline" title="No locks yet" body="Pick an app." actionLabel="Add a lock" onAction={onAction} />);
  expect(screen.getByRole('header', { name: 'No locks yet' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Add a lock' }));
  expect(onAction).toHaveBeenCalled();
});
