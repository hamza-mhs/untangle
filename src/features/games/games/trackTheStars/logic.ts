import { randInt, rng } from '@/lib/rng';

export const TRACK_ROUNDS = 4;
export const TRACK_SECONDS = 45;
export const TRACK_BEADS = 8;
export const TRACK_SHOW_MS = 1300;
export const TRACK_DRIFT_MS = 3600;
export const TRACK_POINTS = 15;
/** Drift samples per second; the board interpolates between them on the UI thread. */
export const TRACK_FPS = 30;
/** The prototype field (px). Paths are made in this frame and scaled to the real field. */
export const FIELD = { w: 264, h: 330, edge: 22, bead: 30 } as const;
/** Prototype speed: 1.6 px per 60 fps frame. */
const SPEED = 1.6 * 60;

/** Glowing beads in round r (0-based): 2, 3, 4, 4. */
export function trackTargets(round: number): number {
  return 2 + Math.min(2, round);
}

type Bead = { x: number; y: number; vx: number; vy: number };

/**
 * One round's drift: `frames[f][bead] = [x, y]` as fractions of the field. Beads wander (the
 * prototype's random steer at constant speed), bounce off the edges and push apart when they
 * get closer than about one bead, so they rarely sit on top of each other.
 */
export function trackPaths(seed: number, round: number): [number, number][][] {
  const rand = rng(seed * 31 + round);
  const { w, h, edge, bead } = FIELD;
  const x0 = edge;
  const x1 = w - edge;
  const y0 = edge;
  const y1 = h - edge;
  const b: Bead[] = [];
  for (let tries = 0; b.length < TRACK_BEADS && tries < 5000; tries++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    if (b.every((q) => Math.hypot(q.x - x, q.y - y) > bead * 1.6)) {
      const a = rand() * Math.PI * 2;
      b.push({ x, y, vx: Math.cos(a), vy: Math.sin(a) });
    }
  }
  const steps = Math.round((TRACK_DRIFT_MS / 1000) * TRACK_FPS);
  const dt = 1 / TRACK_FPS;
  const frames: [number, number][][] = [];
  const snap = () => frames.push(b.map((p): [number, number] => [p.x / w, p.y / h]));
  snap();
  for (let s = 0; s < steps; s++) {
    for (const p of b) {
      p.vx += (rand() - 0.5) * 0.3;
      p.vy += (rand() - 0.5) * 0.3;
    }
    for (let i = 0; i < b.length; i++)
      for (let j = i + 1; j < b.length; j++) {
        const p = b[i]!;
        const q = b[j]!;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < bead * 1.4) {
          const k = 0.6 / d;
          p.vx += dx * k;
          p.vy += dy * k;
          q.vx -= dx * k;
          q.vy -= dy * k;
        }
      }
    for (const p of b) {
      const sp = Math.hypot(p.vx, p.vy) || 1;
      p.vx /= sp;
      p.vy /= sp;
      p.x += p.vx * SPEED * dt;
      p.y += p.vy * SPEED * dt;
      if (p.x < x0 || p.x > x1) p.vx *= -1;
      if (p.y < y0 || p.y > y1) p.vy *= -1;
      p.x = Math.max(x0, Math.min(x1, p.x));
      p.y = Math.max(y0, Math.min(y1, p.y));
    }
    snap();
  }
  return frames;
}

/** Which beads glow this round (the first k of a seeded shuffle). */
export function trackPick(seed: number, round: number): number[] {
  const rand = rng(seed * 17 + round);
  const ids = Array.from({ length: TRACK_BEADS }, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randInt(rand, i + 1);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids.slice(0, trackTargets(round));
}

export function trackStars(picked: number, lost: number, total: number): 1 | 2 | 3 {
  return lost === 0 ? 3 : picked * 2 >= total ? 2 : 1;
}
