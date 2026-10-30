import { breathAt } from '../logic';

describe('Breath count', () => {
  it('nine breaths of 4 s in and 6 s out', () => {
    expect(breathAt(0)).toMatchObject({ index: 0, phase: 'in' });
    expect(breathAt(4500)).toMatchObject({ index: 0, phase: 'out' });
    expect(breathAt(10_000)).toMatchObject({ index: 1, phase: 'in' });
    expect(breathAt(90_000).done).toBe(true);
  });
});
