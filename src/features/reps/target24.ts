import type { Rng } from './rng';

/**
 * "Make the target": combine four numbers with + − × ÷ to reach the target (24 by default).
 * The generator only ever returns puzzles the solver can solve.
 */

export type TargetPuzzle = { numbers: [number, number, number, number]; target: number };

const EPS = 1e-9;

type Term = { value: number; expr: string };

/** Returns one solution expression, or null if the numbers can't reach the target. */
export function solveTarget(numbers: readonly number[], target = 24): string | null {
  const search = (terms: Term[]): string | null => {
    if (terms.length === 1) {
      return Math.abs(terms[0]!.value - target) < EPS ? terms[0]!.expr : null;
    }
    for (let i = 0; i < terms.length; i++) {
      for (let j = 0; j < terms.length; j++) {
        if (i === j) continue;
        const a = terms[i]!;
        const b = terms[j]!;
        const rest = terms.filter((_, k) => k !== i && k !== j);
        const candidates: Term[] = [];
        // + and × are commutative: only try them once per pair.
        if (i < j) {
          candidates.push({ value: a.value + b.value, expr: `(${a.expr} + ${b.expr})` });
          candidates.push({ value: a.value * b.value, expr: `(${a.expr} × ${b.expr})` });
        }
        candidates.push({ value: a.value - b.value, expr: `(${a.expr} − ${b.expr})` });
        if (Math.abs(b.value) > EPS) {
          candidates.push({ value: a.value / b.value, expr: `(${a.expr} ÷ ${b.expr})` });
        }
        for (const c of candidates) {
          const found = search([...rest, c]);
          if (found) return found;
        }
      }
    }
    return null;
  };
  const found = search(numbers.map((n) => ({ value: n, expr: String(n) })));
  return found ? stripOuterParens(found) : null;
}

function stripOuterParens(expr: string): string {
  return expr.startsWith('(') && expr.endsWith(')') ? expr.slice(1, -1) : expr;
}

export function isSolvable(numbers: readonly number[], target = 24): boolean {
  return solveTarget(numbers, target) !== null;
}

/** Endless, seeded generator. Draws 1–13 (a card deck) and rejects unsolvable hands. */
export function generateTarget(rng: Rng, target = 24, maxAttempts = 500): TargetPuzzle {
  for (let i = 0; i < maxAttempts; i++) {
    const numbers = [rng.int(1, 13), rng.int(1, 13), rng.int(1, 13), rng.int(1, 13)] as [
      number,
      number,
      number,
      number,
    ];
    if (isSolvable(numbers, target)) return { numbers, target };
  }
  // ~80% of random hands are solvable for 24, so this is effectively unreachable.
  return { numbers: [1, 2, 3, 4], target: 24 };
}
