import { SILENCE_MINUTES } from '../logic';

describe('Silence', () => {
  it('offers 2, 3 and 5 minutes', () => {
    expect([...SILENCE_MINUTES]).toEqual([2, 3, 5]);
  });
});
