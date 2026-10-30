import { dropSlab, slidePos, stackStars } from '../logic';

describe('Stack tower', () => {
  it('slides back and forth', () => {
    expect(slidePos(0, 0.2, 100)).toBe(0);
    expect(slidePos(500, 0.2, 100)).toBe(100);
    expect(slidePos(750, 0.2, 100)).toBe(50);
    expect(slidePos(1000, 0.2, 100)).toBe(0);
  });
  it('perfect drops keep the width, others cut the overhang', () => {
    expect(dropSlab(50, 160, 52)).toEqual({ left: 50, width: 160, cut: 0, perfect: true });
    expect(dropSlab(50, 160, 70)).toEqual({ left: 70, width: 140, cut: 20, perfect: false });
    expect(dropSlab(50, 160, 30)).toEqual({ left: 50, width: 140, cut: 20, perfect: false });
    expect(dropSlab(50, 160, 300).width).toBe(0);
  });
  it('stars', () => {
    expect([stackStars(13), stackStars(8), stackStars(2)]).toEqual([3, 2, 1]);
  });
});
