import { urgeLevel, urgeStage } from '../logic';

describe('Urge surfing', () => {
  it('the urge rises, peaks and passes', () => {
    expect(urgeLevel(0)).toBeCloseTo(0);
    expect(urgeLevel(30_000)).toBeCloseTo(1);
    expect(urgeLevel(75_000)).toBeCloseTo(0);
    expect(urgeStage(0)).toBe('notice');
    expect(urgeStage(33_000)).toBe('peak');
    expect(urgeStage(74_000)).toBe('gone');
  });
});
