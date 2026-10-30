// Build-time only (tools/content): never imported by the app.
import { randInt, rng } from '@/lib/rng';

import { countFlowSolutions, type Cell, type FlowBoard } from './logic';

/** A random Hamiltonian path over the n×n grid (serpentine start, then backbite moves). */
function randomHamiltonian(n: number, rand: () => number): Cell[] {
  const path: Cell[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push([r, r % 2 ? n - 1 - c : c]);
  const idx = (p: Cell[]) => {
    const m = new Map<number, number>();
    p.forEach(([r, c], i) => m.set(r * n + c, i));
    return m;
  };
  for (let step = 0; step < n * n * 40; step++) {
    if (rand() < 0.5) path.reverse();
    const [hr, hc] = path[0]!;
    const opts: Cell[] = (
      [
        [hr - 1, hc],
        [hr + 1, hc],
        [hr, hc - 1],
        [hr, hc + 1],
      ] as Cell[]
    ).filter(([r, c]) => r >= 0 && c >= 0 && r < n && c < n);
    const [nr, nc] = opts[randInt(rand, opts.length)]!;
    const j = idx(path).get(nr * n + nc)!;
    if (j <= 1) continue;
    // Backbite: head links to cell j; reverse path[0..j-1].
    const head = path.slice(0, j).reverse();
    path.splice(0, j, ...head);
  }
  return path;
}

/** Cut a path into `k` tubes, each at least 3 cells. */
function cut(path: Cell[], k: number, rand: () => number): Cell[][] | null {
  const len = path.length;
  if (k * 3 > len) return null;
  const cuts = new Set<number>();
  let guard = 0;
  while (cuts.size < k - 1 && guard++ < 500) {
    const at = 3 + randInt(rand, len - 5);
    const sorted = [...cuts, at].sort((a, b) => a - b);
    const ok = [0, ...sorted, len].every((v, i, a) => i === 0 || v - a[i - 1]! >= 3);
    if (ok) cuts.add(at);
  }
  if (cuts.size < k - 1) return null;
  const pts = [0, ...[...cuts].sort((a, b) => a - b), len];
  return pts.slice(1).map((end, i) => path.slice(pts[i], end));
}

/** `count` unique-solution boards of size n with k colours (k drawn from `colours`). */
export function generateFlowBoards(
  n: number,
  colours: readonly number[],
  count: number,
  seed: number,
  idPrefix: string,
): FlowBoard[] {
  const rand = rng(seed);
  const out: FlowBoard[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < count && tries++ < count * 400) {
    const k = colours[randInt(rand, colours.length)]!;
    const tubes = cut(randomHamiltonian(n, rand), k, rand);
    if (!tubes) continue;
    const flows = tubes.map((p) => ({ a: p[0]!, b: p.at(-1)!, path: p }));
    const sig = flows
      .map((f) =>
        [f.a, f.b]
          .map(([r, c]) => r * n + c)
          .sort((x, y) => x - y)
          .join('-'),
      )
      .sort()
      .join('|');
    if (seen.has(sig)) continue;
    if (countFlowSolutions(n, flows, 2) !== 1) continue;
    seen.add(sig);
    out.push({ id: `${idPrefix}-${String(out.length + 1).padStart(4, '0')}`, size: n, flows });
  }
  return out;
}
