export const LINE_SECONDS = 60;
export const LINE_DRAWINGS = 2;

/** Node positions in lattice units (0–4 on each axis); edges are node index pairs. */
export type Drawing = {
  id: string;
  /** Named icons say what they are; generated ones are just "drawings". */
  name?: string;
  nodes: [number, number][];
  edges: [number, number][];
  /** One way to trace it (node indices). */
  path: number[];
};

export function degrees(nodes: number, edges: readonly [number, number][]): number[] {
  const d = new Array<number>(nodes).fill(0);
  for (const [a, b] of edges) {
    d[a]!++;
    d[b]!++;
  }
  return d;
}

export function oddNodes(nodes: number, edges: readonly [number, number][]): number[] {
  return degrees(nodes, edges).flatMap((d, i) => (d % 2 ? [i] : []));
}

function connected(nodes: number, edges: readonly [number, number][]): boolean {
  const used = degrees(nodes, edges).map((d) => d > 0);
  const start = used.indexOf(true);
  if (start < 0) return false;
  const adj: number[][] = Array.from({ length: nodes }, () => []);
  for (const [a, b] of edges) {
    adj[a]!.push(b);
    adj[b]!.push(a);
  }
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length)
    for (const j of adj[stack.pop()!]!)
      if (!seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
  return used.every((u, i) => !u || seen.has(i));
}

/** Traceable in one stroke: connected, and 0 or 2 nodes with an odd number of lines. */
export function isTraceable(nodes: number, edges: readonly [number, number][]): boolean {
  return connected(nodes, edges) && oddNodes(nodes, edges).length <= 2;
}

/** An Euler trail (Hierholzer), starting at an odd node when there is one. */
export function eulerTrail(nodes: number, edges: readonly [number, number][]): number[] {
  const adj: { to: number; e: number }[][] = Array.from({ length: nodes }, () => []);
  edges.forEach(([a, b], e) => {
    adj[a]!.push({ to: b, e });
    adj[b]!.push({ to: a, e });
  });
  const used = new Uint8Array(edges.length);
  const odd = oddNodes(nodes, edges);
  const start = odd[0] ?? edges[0]![0];
  const stack = [start];
  const out: number[] = [];
  while (stack.length) {
    const v = stack.at(-1)!;
    const nxt = adj[v]!.find((x) => !used[x.e]);
    if (nxt) {
      used[nxt.e] = 1;
      stack.push(nxt.to);
    } else out.push(stack.pop()!);
  }
  return out.reverse();
}

export const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** True when `path` uses every edge exactly once, moving only along edges. */
export function isTrace(d: Pick<Drawing, 'edges' | 'path'>): boolean {
  const want = new Set(d.edges.map(([a, b]) => edgeKey(a, b)));
  const used = new Set<string>();
  for (let i = 1; i < d.path.length; i++) {
    const k = edgeKey(d.path[i - 1]!, d.path[i]!);
    if (!want.has(k) || used.has(k)) return false;
    used.add(k);
  }
  return used.size === want.size;
}

export function lineStars(resets: number, drawn: number): 1 | 2 | 3 {
  return drawn >= LINE_DRAWINGS ? (resets ? 2 : 3) : drawn > 0 ? 2 : 1;
}

/** Points per line drawn and per finished drawing (prototype). */
export const LINE_POINTS = 5;
export const DRAWING_POINTS = 40;

/**
 * The round's drawings from a pick list (best first, see `pickRoundItems`): the first `n`,
 * but with one named icon in the set whenever the list has one.
 */
export function chooseDrawings<T extends { name?: string }>(
  ordered: readonly T[],
  n = LINE_DRAWINGS,
): T[] {
  const first = ordered.slice(0, n);
  if (first.some((d) => d.name)) return first;
  const named = ordered.find((d) => d.name);
  return named ? [named, ...first.slice(0, n - 1)] : first;
}

/** A stroke in progress: the node under the finger and the edges drawn so far. */
export type Trace = { at: number; used: string[] };

/**
 * What reaching `node` does:
 * - `start`: first node of a stroke;
 * - `same` / `none`: the current node, or one with no line from it: nothing happens;
 * - `line`: drew an unused line; `done`: that was the last line;
 * - `repeat`: that line is already drawn (stuck); `deadEnd`: drew a line into a node with no
 *   unused lines left while others are still undrawn (stuck).
 */
export type TraceMove = 'start' | 'same' | 'none' | 'line' | 'done' | 'repeat' | 'deadEnd';

export function traceMove(
  d: Pick<Drawing, 'edges'>,
  trace: Trace | null,
  node: number,
): { move: TraceMove; trace: Trace | null } {
  if (!trace) return { move: 'start', trace: { at: node, used: [] } };
  if (node === trace.at) return { move: 'same', trace };
  const k = edgeKey(trace.at, node);
  if (!d.edges.some(([a, b]) => edgeKey(a, b) === k)) return { move: 'none', trace };
  if (trace.used.includes(k)) return { move: 'repeat', trace };
  const next = { at: node, used: [...trace.used, k] };
  if (next.used.length === d.edges.length) return { move: 'done', trace: next };
  const open = d.edges.some(
    ([a, b]) => (a === node || b === node) && !next.used.includes(edgeKey(a, b)),
  );
  return { move: open ? 'line' : 'deadEnd', trace: next };
}

/**
 * Fits a drawing into a `width` × `height` box with `pad` on every side: the 0–4 lattice
 * (grown to any node outside it) is scaled uniformly and centred. Returns board points and
 * the size of one lattice unit.
 */
export function fitDrawing(
  nodes: readonly (readonly [number, number])[],
  width: number,
  height: number,
  pad: number,
): { points: { x: number; y: number }[]; unit: number } {
  const xs = nodes.map((n) => n[0]);
  const ys = nodes.map((n) => n[1]);
  const x0 = Math.min(0, ...xs);
  const x1 = Math.max(4, ...xs);
  const y0 = Math.min(0, ...ys);
  const y1 = Math.max(4, ...ys);
  const unit = Math.max(0, Math.min((width - 2 * pad) / (x1 - x0), (height - 2 * pad) / (y1 - y0)));
  const ox = (width - (x1 - x0) * unit) / 2 - x0 * unit;
  const oy = (height - (y1 - y0) * unit) / 2 - y0 * unit;
  return { points: nodes.map(([x, y]) => ({ x: ox + x * unit, y: oy + y * unit })), unit };
}

/** Shortest distance between two nodes, in lattice units (sizes the touch radius). */
export function closestPair(nodes: readonly (readonly [number, number])[]): number {
  let best = Infinity;
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      best = Math.min(best, Math.hypot(nodes[i]![0] - nodes[j]![0], nodes[i]![1] - nodes[j]![1]));
  return best;
}
