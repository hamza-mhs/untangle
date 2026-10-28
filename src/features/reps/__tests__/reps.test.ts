import {
  checkSpan,
  createRepTimer,
  createRng,
  evaluateChain,
  generateLetterGuess,
  generateMathsChain,
  generatePairs,
  generateSpan,
  generateTarget,
  hashSeed,
  isCorrectGuess,
  isMatch,
  isSolvable,
  maskWord,
  nextSpanLength,
  solveTarget,
} from '@/features/reps';

/** Evaluates a solver expression (only digits, spaces, parens and the four operators). */
function evalExpr(expr: string): number {
  const js = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!/^[\d\s()+\-*/]+$/.test(js)) throw new Error(`unexpected expr ${expr}`);
  return Function(`"use strict"; return (${js});`)() as number;
}

describe('rng', () => {
  test('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
    expect(createRng(1).next()).not.toEqual(createRng(2).next());
  });

  test('int stays within bounds', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(3, 9);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  test('hashSeed is stable', () => {
    expect(hashSeed('2026-10-22:draw')).toBe(hashSeed('2026-10-22:draw'));
  });
});

describe('target-24', () => {
  test('solver finds known solutions and verifies them', () => {
    for (const hand of [
      [4, 7, 8, 8],
      [1, 5, 5, 5], // needs fractions: 5 × (5 − 1/5)
      [3, 3, 8, 8], // 8 ÷ (3 − 8/3)
      [6, 6, 6, 6],
    ]) {
      const expr = solveTarget(hand);
      expect(expr).not.toBeNull();
      expect(evalExpr(expr!)).toBeCloseTo(24, 9);
    }
  });

  test('solver rejects known unsolvable hands', () => {
    for (const hand of [
      [1, 1, 1, 1],
      [1, 1, 1, 2],
      [13, 13, 13, 13],
      [1, 1, 2, 2],
      [1, 1, 1, 3],
    ]) {
      expect(isSolvable(hand)).toBe(false);
    }
  });

  test('generator only produces solvable puzzles (2,000 seeded draws)', () => {
    const rng = createRng(2026);
    for (let i = 0; i < 2000; i++) {
      const p = generateTarget(rng);
      expect(p.numbers).toHaveLength(4);
      p.numbers.forEach((n) => expect(n >= 1 && n <= 13).toBe(true));
      const expr = solveTarget(p.numbers, p.target);
      expect(expr).not.toBeNull();
      expect(evalExpr(expr!)).toBeCloseTo(p.target, 9);
    }
  });

  test('generator is endless and reproducible', () => {
    const a = createRng(9);
    const b = createRng(9);
    const seqA = Array.from({ length: 50 }, () => generateTarget(a).numbers.join());
    const seqB = Array.from({ length: 50 }, () => generateTarget(b).numbers.join());
    expect(seqA).toEqual(seqB);
    expect(new Set(seqA).size).toBeGreaterThan(30);
  });
});

describe('maths chains', () => {
  test.each([1, 2, 3] as const)(
    'level %d answers match evaluation and stay positive ints',
    (level) => {
      const rng = createRng(level * 100);
      for (let i = 0; i < 500; i++) {
        const chain = generateMathsChain(rng, level);
        expect(evaluateChain(chain)).toBe(chain.answer);
        expect(Number.isInteger(chain.answer)).toBe(true);
        expect(chain.answer).toBeGreaterThan(0);
        let v = chain.start;
        for (const s of chain.steps) {
          v = evaluateChain({ start: v, steps: [s] });
          expect(Number.isInteger(v) && v > 0).toBe(true);
        }
      }
    },
  );
});

describe('letter guess', () => {
  test('reveal order is a permutation and masking works', () => {
    const round = generateLetterGuess(createRng(3));
    expect([...round.revealOrder].sort((a, b) => a - b)).toEqual([...round.word].map((_, i) => i));
    expect(maskWord(round, 0)).toBe('_'.repeat(round.word.length));
    expect(maskWord(round, round.word.length)).toBe(round.word);
    expect(isCorrectGuess(round, ` ${round.word.toUpperCase()} `)).toBe(true);
  });
});

describe('pairs', () => {
  test('every symbol appears exactly twice', () => {
    const board = generatePairs(createRng(5), 8);
    expect(board.cards).toHaveLength(16);
    const counts = new Map<number, number>();
    board.cards.forEach((c) => counts.set(c.symbol, (counts.get(c.symbol) ?? 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    const [first] = board.cards;
    const twin = board.cards.find((c) => c.symbol === first!.symbol && c.id !== first!.id)!;
    expect(isMatch(board, first!.id, twin.id)).toBe(true);
    expect(isMatch(board, first!.id, first!.id)).toBe(false);
  });
});

describe('span', () => {
  test('length, no immediate repeats, adaptive length', () => {
    const round = generateSpan(createRng(8), 7);
    expect(round.digits).toHaveLength(7);
    round.digits.forEach((d, i) => i > 0 && expect(d).not.toBe(round.digits[i - 1]));
    expect(checkSpan(round, round.digits)).toBe(true);
    expect(checkSpan(round, round.digits.slice(1))).toBe(false);
    expect(nextSpanLength(5, true, 0)).toBe(6);
    expect(nextSpanLength(5, false, 1)).toBe(5);
    expect(nextSpanLength(5, false, 2)).toBe(4);
    expect(nextSpanLength(3, false, 2)).toBe(3);
  });
});

describe('rep timer', () => {
  test('pauses while backgrounded', () => {
    const t = createRepTimer(60_000);
    t.start(0);
    expect(t.remaining(10_000)).toBe(50_000);
    t.pause(10_000);
    expect(t.remaining(40_000)).toBe(50_000); // 30 s in background didn't count
    t.resume(40_000);
    expect(t.remaining(50_000)).toBe(40_000);
    expect(t.remaining(1_000_000)).toBe(0);
  });

  test('pause/resume are idempotent', () => {
    const t = createRepTimer(10_000);
    t.start(0);
    t.pause(1_000);
    t.pause(2_000);
    t.resume(3_000);
    t.resume(4_000);
    expect(t.elapsed(5_000)).toBe(3_000);
  });
});
