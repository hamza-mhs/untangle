// Build-time only (tools/content): never imported by the app.
import { rng } from '@/lib/rng';

import { isLineSolvable, NONO_SIZE, type NonoBoard } from './logic';

/** Hand-drawn 5×5 pictures. Any that aren't line-solvable are dropped by the build (and listed). */
export const PICTURES: { name: string; rows: string[] }[] = [
  { name: 'Heart', rows: ['01010', '11111', '11111', '01110', '00100'] },
  { name: 'House', rows: ['00100', '01110', '11111', '11011', '11011'] },
  { name: 'Tree', rows: ['00100', '01110', '11111', '00100', '00100'] },
  { name: 'Arrow', rows: ['00100', '01110', '10101', '00100', '00100'] },
  { name: 'Plus', rows: ['00100', '00100', '11111', '00100', '00100'] },
  { name: 'Diamond', rows: ['00100', '01110', '11111', '01110', '00100'] },
  { name: 'Boat', rows: ['00100', '00110', '00100', '11111', '01110'] },
  { name: 'Mushroom', rows: ['01110', '11111', '11111', '00100', '01110'] },
  { name: 'Cat', rows: ['10001', '11111', '10101', '11111', '01110'] },
  { name: 'Bell', rows: ['00100', '01110', '01110', '11111', '00100'] },
  { name: 'Sun', rows: ['10101', '01110', '11111', '01110', '10101'] },
  { name: 'Moon', rows: ['01110', '11000', '11000', '11000', '01110'] },
  { name: 'Umbrella', rows: ['01110', '11111', '00100', '00100', '01100'] },
  { name: 'Apple', rows: ['00010', '01110', '11111', '11111', '01110'] },
  { name: 'Ghost', rows: ['01110', '11111', '10101', '11111', '10101'] },
  { name: 'Chair', rows: ['10000', '10000', '11111', '10001', '10001'] },
  { name: 'Door', rows: ['11111', '10001', '10011', '10001', '11111'] },
  { name: 'Anchor', rows: ['00100', '01110', '00100', '10101', '01110'] },
  { name: 'Crown', rows: ['10101', '11111', '11111', '01110', '00000'] },
  { name: 'Cup', rows: ['00000', '11110', '11111', '11110', '01100'] },
  { name: 'Key', rows: ['11100', '10111', '11101', '00000', '00000'] },
  { name: 'Note', rows: ['00110', '00101', '00100', '11100', '11100'] },
  { name: 'Rocket', rows: ['00100', '01110', '01110', '11111', '10101'] },
  { name: 'Flag', rows: ['11110', '11111', '11110', '10000', '10000'] },
  { name: 'Glasses', rows: ['00000', '11011', '11111', '11011', '00000'] },
  { name: 'Hourglass', rows: ['11111', '01110', '00100', '01110', '11111'] },
];

/** Hand pictures first, then mirror-symmetric random pictures, all line-solvable. */
export function generateNonograms(count: number, seed: number): NonoBoard[] {
  const rand = rng(seed);
  const out: NonoBoard[] = [];
  const seen = new Set<string>();
  const push = (rows: string[], name?: string) => {
    const k = rows.join('');
    if (seen.has(k) || !isLineSolvable({ rows })) return;
    seen.add(k);
    out.push({
      id: `nn-${String(out.length + 1).padStart(4, '0')}`,
      ...(name ? { name } : {}),
      rows,
    });
  };
  for (const p of PICTURES) push(p.rows, p.name);
  const n = NONO_SIZE;
  let tries = 0;
  while (out.length < count && tries++ < count * 500) {
    const rows: string[] = [];
    for (let r = 0; r < n; r++) {
      const half = Array.from({ length: Math.ceil(n / 2) }, () => (rand() < 0.58 ? 1 : 0));
      rows.push([...half, ...half.slice(0, Math.floor(n / 2)).reverse()].join(''));
    }
    const filled = rows.join('').split('1').length - 1;
    if (filled < 10 || filled > 19) continue;
    push(rows);
  }
  return out;
}
