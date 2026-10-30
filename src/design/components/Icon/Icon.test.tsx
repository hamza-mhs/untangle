import { render, screen } from '@testing-library/react-native';

import { ICON_NAMES } from '../../icons';
import { Icon } from './Icon';

test('every glyph renders and is hidden from TalkBack', async () => {
  for (const name of ICON_NAMES) {
    const { unmount } = await render(<Icon name={name} color="white" testID="icon" />);
    expect(screen.getByTestId('icon', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    await unmount();
  }
});
