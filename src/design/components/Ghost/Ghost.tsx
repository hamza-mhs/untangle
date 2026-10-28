import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
  type SkPath,
  type SkRect,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { motion } from '../../tokens';
import { useDuration, useReducedMotion } from '../../useReducedMotion';
import { GHOST_VIEWBOX, ghostGradients, ghostNodes } from './ghostData';
import type { GhostAnim, GhostGradient, GhostNode, GhostPaint } from './ghostTypes';
import { cubicBezier, loopPosition, moodToTimeline, sampleNumber, sampleSegment } from './timeline';

/**
 * The standing ghost (OB07, OB12, OB13, E01 …), drawn in Skia from the designer's animated
 * SVG (scripts/build-standing-ghost.mjs). `mood` 0 = anxious, 0.5 = neutral, 1 = happy; the
 * pose morphs along the designer's own easing. Breathing, shimmer, blinking and twinkling
 * run on a UI-thread clock; Reduce Motion freezes all of it.
 */

type Clocks = {
  /** Seconds since mount (free loops). */
  time: SharedValue<number>;
  /** Position on the 8 s mood timeline (0..1). */
  moodT: SharedValue<number>;
  /** Reduce Motion: loops stopped, CSS loops at rest. */
  still: boolean;
};

type Anims = readonly GhostAnim[] | undefined;
type NumberAnim = Extract<GhostAnim, { values: number[] }>;

const findAnim = <A extends GhostAnim['attr']>(anims: Anims, attr: A) =>
  anims?.find((a): a is Extract<GhostAnim, { attr: A }> => a.attr === attr);

const clockOf = (anim: GhostAnim, c: Clocks) => {
  'worklet';
  return anim.clock === 'mood' ? c.moodT.value : loopPosition(c.time.value, anim.dur);
};

const numberAt = (anim: NumberAnim | undefined, fallback: number, c: Clocks) => {
  'worklet';
  return anim ? sampleNumber(anim.values, anim.keyTimes, anim.splines, clockOf(anim, c)) : fallback;
};

function rgba(hex: string, alpha: number): string {
  const h = hex.length === 4 ? hex.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : hex;
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const stopsOf = (g: GhostGradient) => ({
  colors: g.stops.map((s) => rgba(s.color, s.opacity)),
  positions: g.stops.map((s) => s.offset),
});

const colorOf = (paint: GhostPaint | undefined) =>
  paint && 'color' in paint ? paint.color : '#FFFFFF';

/** Union of the nodes' rest-pose bounds (CSS transform-box: fill-box). */
function restBounds(nodes: readonly GhostNode[]): SkRect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (r: SkRect, dx = 0, dy = 0) => {
    x0 = Math.min(x0, r.x + dx);
    y0 = Math.min(y0, r.y + dy);
    x1 = Math.max(x1, r.x + r.width + dx);
    y1 = Math.max(y1, r.y + r.height + dy);
  };
  const walk = (list: readonly GhostNode[], dx: number, dy: number) => {
    for (const n of list) {
      const [tx, ty] = n.translate ?? [0, 0];
      if (n.kind === 'g') walk(n.children, dx + tx, dy + ty);
      else if (n.kind === 'path') {
        const d = findAnim(n.anims, 'd')?.values[0] ?? n.d;
        const p = Skia.Path.MakeFromSVGString(d);
        if (p) add(p.computeTightBounds(), dx + tx, dy + ty);
      } else if (n.kind === 'ellipse') {
        add(Skia.XYWHRect(n.cx - n.rx, n.cy - n.ry, n.rx * 2, n.ry * 2), dx + tx, dy + ty);
      } else add(Skia.XYWHRect(n.x, n.y, n.width, n.height), dx + tx, dy + ty);
    }
  };
  walk(nodes, 0, 0);
  return Number.isFinite(x0) ? Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0) : Skia.XYWHRect(0, 0, 0, 0);
}

/** Element opacity: SMIL opacity, static opacity and the `.star` twinkle. */
function useOpacity(node: GhostNode, c: Clocks) {
  const anim = findAnim(node.anims, 'opacity');
  const base = node.opacity ?? 1;
  const css = node.css;
  return useDerivedValue(() => {
    let o = numberAt(anim, base, c);
    if (css?.kind === 'twinkle') {
      if (c.still) return o * css.peak;
      // `ease-in-out … infinite alternate`: 0 → 1 → 0 over two half periods.
      const phase = ((c.time.value + css.delay) / css.halfPeriod) % 2;
      const k = cubicBezier(0.42, 0, 0.58, 1, phase <= 1 ? phase : 2 - phase);
      o *= css.min + (css.peak - css.min) * k;
    }
    return o;
  });
}

/** SMIL translate (replaces the static transform, as animateTransform does) or the static one. */
function useTranslate(node: GhostNode, c: Clocks) {
  const anim = findAnim(node.anims, 'translate');
  const [sx, sy] = node.translate ?? [0, 0];
  return useDerivedValue(() => {
    if (!anim) return [{ translateX: sx }, { translateY: sy }];
    const { i, f } = sampleSegment(anim.keyTimes, anim.splines, clockOf(anim, c));
    const a = anim.values[i]!;
    const b = anim.values[i + 1] ?? a;
    return [{ translateX: a[0] + (b[0] - a[0]) * f }, { translateY: a[1] + (b[1] - a[1]) * f }];
  });
}

function BoxGradient({ id, bounds }: { id: string; bounds: { readonly value: SkRect } }) {
  const g = ghostGradients[id]!;
  const { colors, positions } = stopsOf(g);
  const start = useDerivedValue(() => {
    const b = bounds.value;
    return g.type === 'linear'
      ? vec(b.x + g.x1 * b.width, b.y + g.y1 * b.height)
      : vec(b.x + g.cx * b.width, b.y + g.cy * b.height);
  });
  const end = useDerivedValue(() => {
    const b = bounds.value;
    return g.type === 'linear' ? vec(b.x + g.x2 * b.width, b.y + g.y2 * b.height) : vec(0, 0);
  });
  // Radial gradients on non-square paths are elliptical in SVG; the mean radius is close
  // enough for the body highlight (the oval shadow uses the exact unit-circle approach).
  const radius = useDerivedValue(() => {
    const b = bounds.value;
    return g.type === 'radial' ? g.r * Math.sqrt((b.width ** 2 + b.height ** 2) / 2) : 0;
  });
  if (g.type === 'linear') {
    return <LinearGradient start={start} end={end} colors={colors} positions={positions} />;
  }
  return <RadialGradient c={start} r={radius} colors={colors} positions={positions} />;
}

type PaintNode = Exclude<GhostNode, { kind: 'g' }>;

function Paints({
  node,
  c,
  bounds,
  children,
}: {
  node: PaintNode;
  c: Clocks;
  bounds: { readonly value: SkRect };
  children: (style: 'fill' | 'stroke', paintChildren: React.ReactNode) => React.ReactNode;
}) {
  const dashAnim = findAnim(node.anims, 'dashOffset');
  const phase = useDerivedValue(() => numberAt(dashAnim, 0, c));
  const fill = node.fill;
  const stroke = node.stroke;
  return (
    <>
      {fill
        ? children(
            'fill',
            'gradient' in fill ? <BoxGradient id={fill.gradient} bounds={bounds} /> : null,
          )
        : null}
      {stroke
        ? children(
            'stroke',
            <>
              {node.dash ? <DashPathEffect intervals={node.dash} phase={phase} /> : null}
              {'gradient' in stroke ? <BoxGradient id={stroke.gradient} bounds={bounds} /> : null}
            </>,
          )
        : null}
    </>
  );
}

function PathView({ node, c }: { node: Extract<GhostNode, { kind: 'path' }>; c: Clocks }) {
  const dAnim = findAnim(node.anims, 'd');
  const paths = useMemo<SkPath[]>(
    () => (dAnim ? dAnim.values : [node.d]).map((d) => Skia.Path.MakeFromSVGString(d)!),
    [dAnim, node.d],
  );
  const path = useDerivedValue(() => {
    const first = paths[0]!;
    if (!dAnim) return first;
    const { i, f } = sampleSegment(dAnim.keyTimes, dAnim.splines, clockOf(dAnim, c));
    const a = paths[i]!;
    const b = paths[i + 1] ?? a;
    if (f <= 0) return a;
    if (f >= 1) return b;
    // SkPath.interpolate(end, w) returns `this` at w = 1; null if the pair ever stops matching.
    return b.interpolate(a, f) ?? a;
  });
  const bounds = useDerivedValue(() => path.value.computeTightBounds());
  const opacity = useOpacity(node, c);
  const transform = useTranslate(node, c);
  return (
    <Group transform={transform} opacity={opacity}>
      <Paints node={node} c={c} bounds={bounds}>
        {(style, paint) => (
          <Path
            path={path}
            style={style}
            color={colorOf(style === 'fill' ? node.fill : node.stroke)}
            opacity={style === 'fill' ? (node.fillOpacity ?? 1) : (node.strokeOpacity ?? 1)}
            strokeWidth={node.strokeWidth ?? 1}
            strokeCap={(node.strokeCap as 'butt' | 'round' | 'square' | undefined) ?? 'butt'}>
            {paint}
          </Path>
        )}
      </Paints>
    </Group>
  );
}

function EllipseView({ node, c }: { node: Extract<GhostNode, { kind: 'ellipse' }>; c: Clocks }) {
  const rxAnim = findAnim(node.anims, 'rx');
  const rx = useDerivedValue(() => numberAt(rxAnim, node.rx, c));
  const rect = useDerivedValue(() =>
    Skia.XYWHRect(node.cx - rx.value, node.cy - node.ry, rx.value * 2, node.ry * 2),
  );
  const opacity = useOpacity(node, c);
  const transform = useTranslate(node, c);
  // Exact elliptical radial gradient: a unit circle scaled to the oval.
  const unitTransform = useDerivedValue(() => [
    { translateX: node.cx },
    { translateY: node.cy },
    { scaleX: Math.max(rx.value, 0.0001) },
    { scaleY: Math.max(node.ry, 0.0001) },
  ]);
  const radial =
    node.fill && 'gradient' in node.fill && ghostGradients[node.fill.gradient]?.type === 'radial'
      ? (ghostGradients[node.fill.gradient] as Extract<GhostGradient, { type: 'radial' }>)
      : null;
  return (
    <Group transform={transform} opacity={opacity}>
      <Paints node={node} c={c} bounds={rect}>
        {(style, paint) =>
          style === 'fill' && radial ? (
            <Group transform={unitTransform} opacity={node.fillOpacity ?? 1}>
              <Circle cx={0} cy={0} r={1}>
                <RadialGradient
                  c={vec(radial.cx * 2 - 1, radial.cy * 2 - 1)}
                  r={radial.r * 2}
                  {...stopsOf(radial)}
                />
              </Circle>
            </Group>
          ) : (
            <Oval
              rect={rect}
              style={style}
              color={colorOf(style === 'fill' ? node.fill : node.stroke)}
              opacity={style === 'fill' ? (node.fillOpacity ?? 1) : (node.strokeOpacity ?? 1)}
              strokeWidth={node.strokeWidth ?? 1}>
              {paint}
            </Oval>
          )
        }
      </Paints>
    </Group>
  );
}

function RectView({ node, c }: { node: Extract<GhostNode, { kind: 'rect' }>; c: Clocks }) {
  const opacity = useOpacity(node, c);
  const transform = useTranslate(node, c);
  const rect = useDerivedValue(() => Skia.XYWHRect(node.x, node.y, node.width, node.height));
  return (
    <Group transform={transform} opacity={opacity}>
      <Paints node={node} c={c} bounds={rect}>
        {(style, paint) => (
          <RoundedRect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            r={node.r}
            style={style}
            color={colorOf(style === 'fill' ? node.fill : node.stroke)}
            strokeWidth={node.strokeWidth ?? 1}>
            {paint}
          </RoundedRect>
        )}
      </Paints>
    </Group>
  );
}

function GroupView({ node, c }: { node: Extract<GhostNode, { kind: 'g' }>; c: Clocks }) {
  const opacity = useOpacity(node, c);
  const translate = useTranslate(node, c);
  const blink = node.css?.kind === 'blink' ? node.css : null;
  const origin = useMemo(() => {
    if (!blink) return vec(0, 0);
    const b = restBounds(node.children);
    return vec(b.x + b.width / 2, b.y + b.height / 2);
  }, [blink, node.children]);
  // `@keyframes blink { 0%,92%,100% { scaleY(1) } 95% { scaleY(min) } }`, default `ease`.
  const blinkTransform = useDerivedValue(() => {
    if (!blink || c.still) return [{ scaleY: 1 }];
    const p = loopPosition(c.time.value, blink.dur);
    if (p < 0.92) return [{ scaleY: 1 }];
    const down = p < 0.95;
    const k = cubicBezier(0.25, 0.1, 0.25, 1, down ? (p - 0.92) / 0.03 : (p - 0.95) / 0.05);
    const s = down ? 1 + (blink.minScale - 1) * k : blink.minScale + (1 - blink.minScale) * k;
    return [{ scaleY: s }];
  });
  return (
    <Group transform={translate} opacity={opacity}>
      <Group origin={origin} transform={blinkTransform}>
        <Nodes nodes={node.children} c={c} />
      </Group>
    </Group>
  );
}

function Nodes({ nodes, c }: { nodes: readonly GhostNode[]; c: Clocks }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.kind) {
          case 'g':
            return <GroupView key={i} node={n} c={c} />;
          case 'path':
            return <PathView key={i} node={n} c={c} />;
          case 'ellipse':
            return <EllipseView key={i} node={n} c={c} />;
          case 'rect':
            return <RectView key={i} node={n} c={c} />;
        }
      })}
    </>
  );
}

const [VB_X, VB_Y, VB_W, VB_H] = GHOST_VIEWBOX;

export type GhostProps = {
  /** 0 = anxious, 0.5 = neutral, 1 = happy. Changes morph over `motion.poseFade`. */
  mood?: number;
  /** Rendered width in pt; height follows the 200×270 artwork. */
  width: number;
  /** Cycle through every mood on the designer's 8 s loop (ignores `mood`). */
  animated?: boolean;
  /** Read out by screen readers; omit for a purely decorative ghost. */
  accessibilityLabel?: string;
  testID?: string;
};

export function Ghost({ mood = 0.5, width, animated = false, accessibilityLabel, testID }: GhostProps) {
  const still = useReducedMotion();
  const duration = useDuration(motion.poseFade);
  const time = useSharedValue(0);
  const target = useSharedValue(moodToTimeline(mood));
  const loopSeconds = motion.ghostLoop / 1000;

  const frame = useFrameCallback((info) => {
    time.set(time.value + (info.timeSincePreviousFrame ?? 0) / 1000);
  }, false);
  useEffect(() => {
    frame.setActive(!still);
  }, [frame, still]);

  useEffect(() => {
    target.set(withTiming(moodToTimeline(mood), { duration }));
  }, [mood, duration, target]);

  const cycling = animated && !still;
  const moodT = useDerivedValue(() =>
    cycling ? loopPosition(time.value, loopSeconds) : target.value,
  );
  const clocks = useMemo<Clocks>(() => ({ time, moodT, still }), [time, moodT, still]);

  const scale = width / VB_W;
  const size = useMemo(() => ({ width, height: VB_H * scale }), [width, scale]);
  const decorative = accessibilityLabel === undefined;
  return (
    <View
      testID={testID}
      style={size}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}>
      <Canvas style={styles.fill} pointerEvents="none">
        <Group transform={[{ scale }, { translateX: -VB_X }, { translateY: -VB_Y }]}>
          <Nodes nodes={ghostNodes} c={clocks} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
