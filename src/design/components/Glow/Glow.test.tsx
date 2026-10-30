import { render } from '@testing-library/react-native';

import { glow } from '../../tokens';
import { Glow } from './Glow';

describe('Glow', () => {
  it('renders hidden from accessibility', async () => {
    const r = await render(<Glow {...glow.welcome} />);
    expect(r.toJSON()).toBeTruthy();
    expect(r.queryByRole('image')).toBeNull();
  });

  it('every preset has at least 3 stops or a blur', () => {
    for (const spec of Object.values(glow)) {
      expect(spec.stops.length >= 3 || ('blur' in spec && spec.blur)).toBeTruthy();
    }
  });
});
