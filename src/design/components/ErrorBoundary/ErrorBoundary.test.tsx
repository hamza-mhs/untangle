import { render, screen } from '@testing-library/react-native';

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

test('shows the fallback when a child throws', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await render(
    <ErrorBoundary name="test">
      <Boom />
    </ErrorBoundary>,
  );
  expect(screen.getByText('Something went wrong.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});
