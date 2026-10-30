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
