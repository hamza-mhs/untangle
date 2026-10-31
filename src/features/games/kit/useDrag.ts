import { useCallback, useEffect, useRef } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Drag-to-draw gestures (BATCH-3.3: Gesture Handler Pan, snapping to cells, JS thread never
 * busy while drawing). Hit-testing runs on the UI thread; JS only hears about changes.
 * Wrap the board in `<GestureDetector gesture={…}>` and lay out with the same numbers.
 */
export type DragHandlers = {
  onStart?: (i: number) => void;
  onEnter?: (i: number) => void;
  /** Finger lifted (or the gesture was cancelled). */
  onEnd?: () => void;
};

/** A grid whose top-left cell starts at (x, y) in the detector's coordinates. */
export type GridSpec = { x: number; y: number; cell: number; cols: number; rows: number };

function useStableHandlers(h: DragHandlers) {
  const ref = useRef(h);
  useEffect(() => {
    ref.current = h;
  });
  const start = useCallback((i: number) => ref.current.onStart?.(i), []);
  const enter = useCallback((i: number) => ref.current.onEnter?.(i), []);
  const end = useCallback(() => ref.current.onEnd?.(), []);
  return { start, enter, end };
}

/**
 * Drag across a grid: `onStart(cell)` where the finger lands, `onEnter(cell)` for every new
 * cell after that, always one orthogonal step at a time (fast drags are filled in), so a game
 * can treat each call as a single move. Cell index = row * cols + col.
 */
export function useGridDrag(spec: GridSpec, h: DragHandlers) {
  const g = useSharedValue(spec);
  useEffect(() => {
    g.set(spec);
  }, [g, spec.x, spec.y, spec.cell, spec.cols, spec.rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = useSharedValue(-1);
  const { start, enter, end } = useStableHandlers(h);

  return usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      const s = g.get();
      const c = Math.floor((e.x - s.x) / s.cell);
      const r = Math.floor((e.y - s.y) / s.cell);
      if (c < 0 || r < 0 || c >= s.cols || r >= s.rows) {
        last.set(-1);
        return;
      }
      last.set(r * s.cols + c);
      scheduleOnRN(start, r * s.cols + c);
    },
    onUpdate: (e) => {
      'worklet';
      const s = g.get();
      const prev = last.get();
      if (prev < 0) return;
      // Snap only once the finger is well inside a cell, so brushing a corner doesn't count.
      const fx = (e.x - s.x) / s.cell;
      const fy = (e.y - s.y) / s.cell;
      const c = Math.floor(fx);
      const r = Math.floor(fy);
      if (c < 0 || r < 0 || c >= s.cols || r >= s.rows) return;
      const inX = fx - c;
      const inY = fy - r;
      if (inX < 0.15 || inX > 0.85 || inY < 0.15 || inY > 0.85) return;
      let pr = Math.floor(prev / s.cols);
      let pc = prev % s.cols;
      if (pr === r && pc === c) return;
      // Walk one orthogonal step at a time towards the finger.
      while (pr !== r || pc !== c) {
        if (Math.abs(r - pr) >= Math.abs(c - pc)) pr += r > pr ? 1 : -1;
        else pc += c > pc ? 1 : -1;
        scheduleOnRN(enter, pr * s.cols + pc);
      }
      last.set(r * s.cols + c);
    },
    onFinalize: () => {
      'worklet';
      if (last.get() >= 0) scheduleOnRN(end);
      last.set(-1);
    },
  });
}

/**
 * Drag between points (nodes, beads): `onStart(i)` / `onEnter(i)` when the finger comes
 * within `radius` of point i. Points are in the detector's coordinates.
 */
export function usePointDrag(
  points: readonly { x: number; y: number }[],
  radius: number,
  h: DragHandlers,
) {
  const pts = useSharedValue<{ x: number; y: number }[]>([...points]);
  const rad = useSharedValue(radius);
  const sig = points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(';');
  useEffect(() => {
    pts.set([...points]);
    rad.set(radius);
  }, [sig, radius]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = useSharedValue(-1);
  const down = useSharedValue(false);
  const { start, enter, end } = useStableHandlers(h);

  const hit = (x: number, y: number) => {
    'worklet';
    const list = pts.get();
    const r2 = rad.get() * rad.get();
    for (let i = 0; i < list.length; i++) {
      const dx = list[i]!.x - x;
      const dy = list[i]!.y - y;
      if (dx * dx + dy * dy <= r2) return i;
    }
    return -1;
  };

  return usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      const i = hit(e.x, e.y);
      last.set(i);
      down.set(i >= 0);
      if (i >= 0) scheduleOnRN(start, i);
    },
    onUpdate: (e) => {
      'worklet';
      const i = hit(e.x, e.y);
      if (i < 0 || i === last.get()) return;
      last.set(i);
      if (down.get()) scheduleOnRN(enter, i);
      else {
        // Started between points: the first point reached is the start.
        down.set(true);
        scheduleOnRN(start, i);
      }
    },
    onFinalize: () => {
      'worklet';
      if (down.get()) scheduleOnRN(end);
      last.set(-1);
      down.set(false);
    },
  });
}
