/** Types for the generated standing-ghost data (ghostData.ts). */

export type GhostStop = { offset: number; color: string; opacity: number };

/** Coordinates are fractions of the element's bounding box (SVG objectBoundingBox). */
export type GhostGradient =
  | { type: 'linear'; x1: number; y1: number; x2: number; y2: number; stops: GhostStop[] }
  | { type: 'radial'; cx: number; cy: number; r: number; stops: GhostStop[] };

export type GhostPaint = { color: string } | { gradient: string };

/**
 * One SMIL animation. `clock: 'mood'` = the 8 s mood loop (driven by `mood` or cycling);
 * `free` = an independent life loop (breathing, shimmer, eye wiggle).
 */
export type GhostAnim =
  | { attr: 'd'; values: string[]; keyTimes: number[]; splines?: number[][]; dur: number; clock: 'mood' | 'free' }
  | {
      attr: 'opacity' | 'rx' | 'dashOffset';
      values: number[];
      keyTimes: number[];
      splines?: number[][];
      dur: number;
      clock: 'mood' | 'free';
    }
  | {
      attr: 'translate';
      values: [number, number][];
      keyTimes: number[];
      splines?: number[][];
      dur: number;
      clock: 'mood' | 'free';
    };

export type GhostCss =
  | { kind: 'blink'; dur: number; minScale: number }
  | { kind: 'twinkle'; peak: number; halfPeriod: number; delay: number; min: number };

type Base = {
  opacity?: number;
  translate?: [number, number];
  anims?: GhostAnim[];
  css?: GhostCss;
};

type Paint = {
  fill?: GhostPaint;
  stroke?: GhostPaint;
  strokeWidth?: number;
  strokeCap?: string;
  dash?: number[];
  fillOpacity?: number;
  strokeOpacity?: number;
};

export type GhostNode =
  | (Base & { kind: 'g'; children: GhostNode[] })
  | (Base & Paint & { kind: 'path'; d: string })
  | (Base & Paint & { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number })
  | (Base & Paint & { kind: 'rect'; x: number; y: number; width: number; height: number; r: number });
