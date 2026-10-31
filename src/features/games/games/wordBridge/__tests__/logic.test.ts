import {
  bridgeStars,
  bridgeSteps,
  isBridged,
  judgeStep,
  middleRungs,
  oneApart,
  swapLetter,
} from '../logic';

const dict = new Set(['cold', 'cord', 'word', 'ward', 'warm', 'bold']);

describe('Word bridge rules', () => {
  it('swaps one letter', () => {
    expect(swapLetter('cold', 2, 'r')).toBe('cord');
    expect(swapLetter('cold', 0, 'b')).toBe('bold');
    expect(swapLetter('cold', 3, 't')).toBe('colt');
  });

  it('judges a step: real word, non-word, or a word already on the ladder', () => {
    expect(judgeStep('cord', ['cold'], dict)).toBe('word');
    expect(judgeStep('bord', ['cold', 'cord'], dict)).toBe('notWord');
    expect(judgeStep('cold', ['cold', 'cord'], dict)).toBe('repeat');
  });

  it('is bridged on the bottom word or one letter away from it', () => {
    expect(isBridged('warm', 'warm')).toBe(true);
    expect(isBridged('ward', 'warm')).toBe(true);
    expect(isBridged('word', 'warm')).toBe(false);
    expect(oneApart('ward', 'warm')).toBe(true);
  });

  it('counts the implied last step', () => {
    expect(bridgeSteps(['cold', 'cord', 'word', 'ward'], 'warm')).toBe(4);
    expect(bridgeSteps(['cold', 'cord', 'word', 'ward', 'warm'], 'warm')).toBe(4);
  });

  it('adds a rung when the shortest route runs out', () => {
    expect(middleRungs(3, 0, false)).toBe(3);
    expect(middleRungs(3, 2, false)).toBe(3);
    expect(middleRungs(3, 3, false)).toBe(4);
    expect(middleRungs(3, 4, true)).toBe(4);
  });

  it('stars: clean 3, non-words 2, unfinished 1', () => {
    expect(bridgeStars(0, true)).toBe(3);
    expect(bridgeStars(2, true)).toBe(2);
    expect(bridgeStars(0, false)).toBe(1);
  });
});
