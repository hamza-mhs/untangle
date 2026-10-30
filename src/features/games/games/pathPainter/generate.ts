// Build-time only (tools/content): never imported by the app.
import { randInt, rng } from '@/lib/rng';

import { findPaintPath, type Cell, type PaintBoard } from './logic';

/**
 * Boards with 1–3 rocks that have a one-stroke solution. To keep them interesting, only
 * boards where at most `maxStarts` cells work as a starting point are kept.
 */
export function generatePaintBoards(
  count: number,
  seed: number,
  n = 5,
  maxStarts = 8,
): PaintBoard[] {
  const rand = rng(seed);
  const out: PaintBoard[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < count && tries++ < count * 500) {
    const k = 1 + randInt(rand, 3);
    const rocks: Cell[] = [];
    while (rocks.length < k) {
      const cell: Cell = [randInt(rand, n), randInt(rand, n)];
      if (!rocks.some(([r, c]) => r === cell[0] && c === cell[1])) rocks.push(cell);
    }
    const key = rocks
      .map(([r, c]) => r * n + c)
      .sort((a, b) => a - b)
      .join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    let starts = 0;
    let path: Cell[] | null = null;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (rocks.some(([y, x]) => y === r && x === c)) continue;
        const p = findPaintPath(n, rocks, [r, c]);
        if (p) {
          starts++;
          path ??= p;
        }
      }
    if (!path || starts > maxStarts) continue;
    out.push({ id: `pp-${String(out.length + 1).padStart(4, '0')}`, size: n, rocks, path });
  }
  return out;
}
