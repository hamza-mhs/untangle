import { render } from '@testing-library/react-native';

import { color } from '../../tokens';
import { Glow } from './Glow';

describe('Glow', () => {
  it('renders hidden from accessibility', async () => {
    const r = await render(<Glow tint={color.brand.violet} />);
    expect(r.toJSON()).toBeTruthy();
    expect(r.queryByRole('image')).toBeNull();
  });
});
