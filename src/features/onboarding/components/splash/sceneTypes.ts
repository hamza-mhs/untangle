/** Types for the generated splash scene (sceneData.ts). `[a, b]` = [tangled, untangled]. */

export type Pair = [number, number];

export type GradientStop = { offset: number; color: string; opacity: number };

/** Coordinates are fractions of the element's bounding box (SVG objectBoundingBox). */
export type SceneGradient =
  | { type: 'linear'; x1: number; y1: number; x2: number; y2: number; stops: GradientStop[] }
  | { type: 'radial'; cx: number; cy: number; r: number; stops: GradientStop[] };

export type ScenePaint = { color: string } | { gradient: string };

type PaintProps = {
  fill?: ScenePaint;
  stroke?: ScenePaint;
  strokeWidth?: number;
  strokeCap?: 'round' | 'butt' | 'square';
  dash?: number[];
  fillOpacity?: number;
  strokeOpacity?: number;
  opacity?: Pair;
  translate?: [number, number];
};

export type SceneNode =
  | ({ kind: 'path'; d: [string, string] } & PaintProps)
  | ({ kind: 'oval'; cx: Pair; cy: Pair; rx: Pair; ry: Pair } & PaintProps)
  | ({ kind: 'text'; text: string; x: number; y: number; size: number } & PaintProps)
  | { kind: 'group'; opacity: Pair; children: SceneNode[] };

export type StarSpec = { x: number; y: number; r: number; a: number; d: number };
export type StarLine = [number, number, number, number];
