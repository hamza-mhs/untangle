// Build-time only (tools/content): never imported by the app.
import { randInt, rng, shuffle } from '@/lib/rng';

import { eulerTrail, isTraceable, type Drawing } from './logic';

type Icon = { name: string; nodes: [number, number][]; edges: [number, number][] };

/** Hand-drawn icons (lattice 0–4). Lines may cross where the picture needs it. */
const ICONS: Icon[] = [
  {
    name: 'House',
    nodes: [
      [0, 4],
      [4, 4],
      [4, 2],
      [0, 2],
      [2, 0],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 2],
      [1, 3],
      [3, 4],
      [2, 4],
    ],
  },
  {
    name: 'Envelope',
    nodes: [
      [0, 1],
      [4, 1],
      [4, 4],
      [0, 4],
      [2, 3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [4, 1],
    ],
  },
  {
    name: 'Star',
    nodes: [
      [2, 0],
      [4, 1.5],
      [3.2, 4],
      [0.8, 4],
      [0, 1.5],
    ],
    edges: [
      [0, 2],
      [2, 4],
      [4, 1],
      [1, 3],
      [3, 0],
    ],
  },
  {
    name: 'Bow tie',
    nodes: [
      [0, 0],
      [0, 4],
      [4, 0],
      [4, 4],
      [2, 2],
    ],
    edges: [
      [0, 1],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [2, 3],
    ],
  },
  {
    name: 'Kite',
    nodes: [
      [2, 0],
      [0, 2],
      [4, 2],
      [2, 4],
      [2, 2],
    ],
    edges: [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0],
      [0, 4],
      [4, 3],
    ],
  },
  {
    name: 'Hourglass',
    nodes: [
      [0, 0],
      [4, 0],
      [2, 2],
      [0, 4],
      [4, 4],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 4],
    ],
  },
  {
    name: 'Fish',
    nodes: [
      [2, 1],
      [3.5, 2],
      [2, 3],
      [0.5, 2],
      [4.5, 1],
      [4.5, 3],
    ],
    edges: [
      [0, 3],
      [3, 2],
      [2, 1],
      [1, 0],
      [1, 4],
      [4, 5],
      [5, 1],
    ],
  },
  {
    name: 'Tent',
    nodes: [
      [0, 4],
      [4, 4],
      [2, 0],
      [2, 4],
    ],
    edges: [
      [0, 2],
      [2, 1],
      [2, 3],
      [0, 3],
      [3, 1],
    ],
  },
  {
    name: 'Boat',
    nodes: [
      [0, 3],
      [4, 3],
      [3, 4],
      [1, 4],
      [2, 3],
      [2, 0],
      [3.5, 2.5],
    ],
    edges: [
      [0, 4],
      [4, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 4],
    ],
  },
  {
    name: 'Arrow',
    nodes: [
      [0, 2],
      [4, 2],
      [3, 1],
      [3, 3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  },
  {
    name: 'Gem',
    nodes: [
      [2, 0],
      [0, 1.5],
      [4, 1.5],
      [2, 4],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  },
  {
    name: 'Heart',
    nodes: [
      [0, 1],
      [1, 0],
      [2, 1],
      [3, 0],
      [4, 1],
      [2, 4],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
];

/**
 * Random drawings on an m×m lattice: lines join neighbouring points (including diagonals),
 * never both diagonals of one square (no crossings), 8–14 lines, connected, 0 or 2 odd points.
 */
function randomDrawing(m: number, rand: () => number): Omit<Drawing, 'id' | 'path'> | null {
  const id = (x: number, y: number) => y * m + x;
  const all: [number, number][] = [];
  for (let y = 0; y < m; y++)
    for (let x = 0; x < m; x++) {
      if (x + 1 < m) all.push([id(x, y), id(x + 1, y)]);
      if (y + 1 < m) all.push([id(x, y), id(x, y + 1)]);
      if (x + 1 < m && y + 1 < m) {
        // One diagonal per square at most.
        const r = rand();
        if (r < 0.3) all.push([id(x, y), id(x + 1, y + 1)]);
        else if (r < 0.6) all.push([id(x + 1, y), id(x, y + 1)]);
      }
    }
  const want = 8 + randInt(rand, 7);
  const edges = shuffle(all, rand).slice(0, want);
  if (!isTraceable(m * m, edges)) return null;
  // Drop unused points and re-index; spread the lattice over 0–4.
  const used = [...new Set(edges.flat())].sort((a, b) => a - b);
  const remap = new Map(used.map((v, i) => [v, i]));
  const step = 4 / (m - 1);
  return {
    nodes: used.map((v) => [(v % m) * step, Math.floor(v / m) * step]),
    edges: edges.map(([a, b]) => [remap.get(a)!, remap.get(b)!]),
  };
}

export function generateDrawings(count: number, seed: number): Drawing[] {
  const rand = rng(seed);
  const out: Drawing[] = [];
  const seen = new Set<string>();
  const push = (d: Omit<Drawing, 'id' | 'path'>) => {
    const sig = JSON.stringify(
      d.edges.map(([a, b]) => [d.nodes[a], d.nodes[b]].sort().join('/')).sort(),
    );
    if (seen.has(sig)) return;
    seen.add(sig);
    out.push({
      id: `ol-${String(out.length + 1).padStart(4, '0')}`,
      ...d,
      path: eulerTrail(d.nodes.length, d.edges),
    });
  };
  for (const icon of ICONS) {
    if (!isTraceable(icon.nodes.length, icon.edges))
      throw new Error(`${icon.name} isn't traceable`);
    push(icon);
  }
  let tries = 0;
  while (out.length < count && tries++ < count * 2000) {
    const d = randomDrawing(rand() < 0.5 ? 3 : 4, rand);
    // At least one point where three or more lines meet, so the start matters.
    if (d && d.edges.length >= 8 && d.nodes.length >= 6) push(d);
  }
  return out;
}
