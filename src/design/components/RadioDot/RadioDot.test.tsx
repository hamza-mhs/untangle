import { render } from '@testing-library/react-native';

import { RadioDot } from './RadioDot';

test('renders both states', async () => {
  expect((await render(<RadioDot selected />)).toJSON()).toBeTruthy();
  expect((await render(<RadioDot selected={false} />)).toJSON()).toBeTruthy();
});
