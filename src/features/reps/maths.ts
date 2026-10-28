import type { Rng } from './rng';

/**
 * Mental-maths chains: start number, then a run of operations applied left to right,
 * e.g. 7 → +5 → ×2 → −4 = 20. Intermediate values stay positive integers.
 */

export type MathsLevel = 1 | 2 | 3;
export type MathsStep = { op: '+' | '−' | '×' | '÷'; operand: number };
export type MathsChain = { start: number; steps: MathsStep[]; answer: number };

const CONFIG: Record<MathsLevel, { steps: number; max: number; mul: number }> = {
  1: { steps: 3, max: 20, mul: 3 },
  2: { steps: 4, max: 50, mul: 5 },
  3: { steps: 5, max: 99, mul: 9 },
};

export function generateMathsChain(rng: Rng, level: MathsLevel = 1): MathsChain {
  const cfg = CONFIG[level];
  const start = rng.int(2, Math.min(20, cfg.max));
  let value = start;
  const steps: MathsStep[] = [];

  while (steps.length < cfg.steps) {
    const op = rng.pick(['+', '−', '×', '÷'] as const);
    let operand: number;
    if (op === '+') {
      operand = rng.int(1, Math.max(1, Math.min(20, cfg.max - value)));
      if (value + operand > cfg.max) continue;
      value += operand;
    } else if (op === '−') {
      if (value <= 1) continue;
      operand = rng.int(1, Math.min(20, value - 1));
      value -= operand;
    } else if (op === '×') {
      operand = rng.int(2, cfg.mul);
      if (value * operand > cfg.max) continue;
      value *= operand;
    } else {
      const divisors = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d < value && value % d === 0);
      if (divisors.length === 0) continue;
      operand = rng.pick(divisors);
      value /= operand;
    }
    steps.push({ op, operand });
  }
  return { start, steps, answer: value };
}

export function evaluateChain(chain: Pick<MathsChain, 'start' | 'steps'>): number {
  return chain.steps.reduce((v, s) => {
    switch (s.op) {
      case '+':
        return v + s.operand;
      case '−':
        return v - s.operand;
      case '×':
        return v * s.operand;
      case '÷':
        return v / s.operand;
    }
  }, chain.start);
}
