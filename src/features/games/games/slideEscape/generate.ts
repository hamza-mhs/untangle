// Build-time only (tools/content): never imported by the app.
import { randInt, rng } from '@/lib/rng';

import { cellsOf, GEM_LEN, minSlideMoves, SLIDE_SIZE, type Block, type SlideBoard } from './logic';

/** Solvable boards whose minimum moves fall in [minMoves, maxMoves]; the gem starts blocked. */
export function generateSlideBoards(
  count: number,
  seed: number,
  minMoves = 4,
  maxMoves = 11,
  n = SLIDE_SIZE,
): SlideBoard[] {
  const rand = rng(seed);
  const out: SlideBoard[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < count && tries++ < count * 3000) {
    const gr = 1 + randInt(rand, n - 2);
    const gem: [number, number] = [gr, randInt(rand, 2)];
    const used = new Set<number>();
    for (let i = 0; i < GEM_LEN; i++) used.add(gr * n + gem[1] + i);
    const blocks: Block[] = [];
    const want = 4 + randInt(rand, 4);
    for (let guard = 0; blocks.length < want && guard < 200; guard++) {
      const d = rand() < 0.6 ? 'v' : 'h';
      const len = rand() < 0.75 ? 2 : 3;
      const r = randInt(rand, d === 'v' ? n - len + 1 : n);
      const c = randInt(rand, d === 'h' ? n - len + 1 : n);
      // No horizontal block in the gem's row: it could never clear the exit.
      if (d === 'h' && r === gr) continue;
      const b: Block = { d, r, c, len };
      const cells = cellsOf(b).map(([y, x]) => y * n + x);
      if (cells.some((k) => used.has(k))) continue;
      cells.forEach((k) => used.add(k));
      blocks.push(b);
    }
    // Something must stand between the gem and the exit.
    const blocked = blocks.some((b) =>
      cellsOf(b).some(([y, x]) => y === gr && x >= gem[1] + GEM_LEN),
    );
    if (!blocked) continue;
    const key = JSON.stringify([gem, blocks.map((b) => [b.d, b.r, b.c, b.len]).sort()]);
    if (seen.has(key)) continue;
    const m = minSlideMoves(gem, blocks, n);
    if (m < minMoves || m > maxMoves) continue;
    seen.add(key);
    out.push({ id: `se-${String(out.length + 1).padStart(4, '0')}`, gem, blocks, minMoves: m });
  }
  return out;
}
