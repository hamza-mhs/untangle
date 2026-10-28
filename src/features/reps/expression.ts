/**
 * Make the target: the expression the user builds from number chips, operators and brackets.
 * Pure: tokens in, a value (or null when it doesn't parse yet) out.
 */

export type TargetOp = '+' | '−' | '×' | '÷';
export type ExprToken =
  { kind: 'num'; index: number } | { kind: 'op'; op: TargetOp } | { kind: 'paren'; open: boolean };

const EPS = 1e-9;

/** Recursive descent over expr := term (('+'|'−') term)*, term := factor (('×'|'÷') factor)*. */
export function evaluateTokens(
  tokens: readonly ExprToken[],
  numbers: readonly number[],
): number | null {
  let pos = 0;
  const peek = () => tokens[pos];

  const factor = (): number | null => {
    const tok = peek();
    if (!tok) return null;
    if (tok.kind === 'num') {
      pos++;
      return numbers[tok.index] ?? null;
    }
    if (tok.kind === 'paren' && tok.open) {
      pos++;
      const v = expr();
      const close = peek();
      if (v === null || !close || close.kind !== 'paren' || close.open) return null;
      pos++;
      return v;
    }
    return null;
  };

  const term = (): number | null => {
    let v = factor();
    while (v !== null) {
      const tok = peek();
      if (!tok || tok.kind !== 'op' || (tok.op !== '×' && tok.op !== '÷')) break;
      pos++;
      const rhs = factor();
      if (rhs === null) return null;
      if (tok.op === '÷' && Math.abs(rhs) < EPS) return null;
      v = tok.op === '×' ? v * rhs : v / rhs;
    }
    return v;
  };

  const expr = (): number | null => {
    let v = term();
    while (v !== null) {
      const tok = peek();
      if (!tok || tok.kind !== 'op' || (tok.op !== '+' && tok.op !== '−')) break;
      pos++;
      const rhs = term();
      if (rhs === null) return null;
      v = tok.op === '+' ? v + rhs : v - rhs;
    }
    return v;
  };

  const value = expr();
  return value !== null && pos === tokens.length ? value : null;
}

export function usedIndexes(tokens: readonly ExprToken[]): number[] {
  return tokens.flatMap((t) => (t.kind === 'num' ? [t.index] : []));
}

/** True once every number is used exactly once and the expression reaches the target. */
export function hitsTarget(
  tokens: readonly ExprToken[],
  numbers: readonly number[],
  target: number,
): boolean {
  if (usedIndexes(tokens).length !== numbers.length) return false;
  const v = evaluateTokens(tokens, numbers);
  return v !== null && Math.abs(v - target) < EPS;
}

export function tokenLabel(tok: ExprToken, numbers: readonly number[]): string {
  if (tok.kind === 'num') return String(numbers[tok.index]);
  if (tok.kind === 'op') return tok.op;
  return tok.open ? '(' : ')';
}

/** Rounds a value for display ("= 23", "= 7.5"). */
export function formatValue(v: number): string {
  return Number.isInteger(Math.round(v * 1e6) / 1e6)
    ? String(Math.round(v))
    : v.toFixed(2).replace(/0+$/, '');
}
