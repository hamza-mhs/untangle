import { hopPoints, hopStars, planetX } from '../logic';

describe('Rocket hop', () => {
  it('swings around the centre', () => {
    expect(planetX(0, 132, 88)).toBeCloseTo(132);
    expect(planetX(650, 132, 88)).toBeCloseTo(220);
  });
  it('points and stars', () => {
    expect(hopPoints(0)).toBe(60);
    expect(hopPoints(50)).toBe(20);
    expect([hopStars(6, 3), hopStars(6, 2), hopStars(2, 3)]).toEqual([3, 2, 1]);
  });
});
