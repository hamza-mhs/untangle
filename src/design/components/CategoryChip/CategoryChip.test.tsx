import { render, screen } from '@testing-library/react-native';

import { focusGroupColor } from '../../tokens';
import { CategoryChip } from './CategoryChip';

test('uses the focus group colour', async () => {
  await render(<CategoryChip group="memory" label="Memory" testID="c" />);
  expect(screen.getByTestId('c')).toHaveStyle({ backgroundColor: focusGroupColor.memory });
  expect(screen.getByText('Memory')).toBeTruthy();
});
