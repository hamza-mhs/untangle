import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Skia,
  Text as SkiaText,
  useFont,
  usePathInterpolation,
  vec,
  type SkRect,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { gradients, scene, SCENE_HEIGHT, SCENE_WIDTH } from './sceneData';
import type { Pair, SceneGradient, SceneNode, ScenePaint } from './sceneTypes';

/**
 * The splash ghost + three wires, drawn in Skia from the two design SVGs (see
 * scripts/build-ghost-scene.mjs). Everything is driven by one shared value:
 * progress 0 = tangled, 1 = untangled. No React state changes per frame.
 */

type P = SharedValue<number>;

const lerp = (p: Pair, t: number) => {
  'worklet';
  return p[0] + (p[1] - p[0]) * t;
};

/** '#RRGGBB' + alpha → 'rgba(...)' (Skia parses CSS colour strings). */
function rgba(hex: string, alpha: number): string {
  const h = hex.length === 4 ? hex.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : hex;
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const stopsOf = (g: SceneGradient) => ({
  colors: g.stops.map((s) => rgba(s.color, s.opacity)),
  positions: g.stops.map((s) => s.offset),
});

/** SVG objectBoundingBox gradient mapped onto a (changing) bounding box. */
function BoxGradient({ id, bounds }: { id: string; bounds: { readonly value: SkRect } }) {
  const g = gradients[id]!;
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
  // enough for the soft body highlight (ovals use the exact unit-circle approach below).
  const radius = useDerivedValue(() => {
    const b = bounds.value;
    return g.type === 'radial' ? g.r * Math.sqrt((b.width ** 2 + b.height ** 2) / 2) : 0;
  });
  if (g.type === 'linear') {
    return <LinearGradient start={start} end={end} colors={colors} positions={positions} />;
  }
  return <RadialGradient c={start} r={radius} colors={colors} positions={positions} />;
}

function PaintChildren({
  paint,
  bounds,
  dash,
}: {
  paint: ScenePaint;
  bounds: { readonly value: SkRect };
  dash?: number[] | undefined;
}) {
  return (
    <>
      {dash ? <DashPathEffect intervals={dash} /> : null}
      {'gradient' in paint ? <BoxGradient id={paint.gradient} bounds={bounds} /> : null}
    </>
  );
}

const colorOf = (paint: ScenePaint | undefined) =>
  paint && 'color' in paint ? paint.color : '#FFFFFF';

function PathNode({ node, progress }: { node: Extract<SceneNode, { kind: 'path' }>; progress: P }) {
  const [from, to] = useMemo(
    () => [Skia.Path.MakeFromSVGString(node.d[0])!, Skia.Path.MakeFromSVGString(node.d[1])!],
    [node.d],
  );
  const path = usePathInterpolation(progress, [0, 1], [from, to]);
  // interpolate() returns null if a pair ever stops matching; fall back to the tangled bounds.
  const fallbackBounds = useMemo(() => from.computeTightBounds(), [from]);
  const bounds = useDerivedValue(() => path.value?.computeTightBounds?.() ?? fallbackBounds);
  const opacity = useDerivedValue(() => lerp(node.opacity ?? [1, 1], progress.value));
  const strokeOpacity = useDerivedValue(() => opacity.value * (node.strokeOpacity ?? 1));
  const fillOpacity = useDerivedValue(() => opacity.value * (node.fillOpacity ?? 1));

  const body = (
    <>
      {node.fill ? (
        <Path path={path} style="fill" color={colorOf(node.fill)} opacity={fillOpacity}>
          <PaintChildren paint={node.fill} bounds={bounds} />
        </Path>
      ) : null}
      {node.stroke ? (
        <Path
          path={path}
          style="stroke"
          strokeWidth={node.strokeWidth ?? 1}
          strokeCap={node.strokeCap ?? 'butt'}
          strokeJoin="round"
          color={colorOf(node.stroke)}
          opacity={strokeOpacity}>
          <PaintChildren paint={node.stroke} bounds={bounds} dash={node.dash} />
        </Path>
      ) : null}
    </>
  );
  if (!node.translate) return body;
  const [tx, ty] = node.translate;
  return <Group transform={[{ translateX: tx }, { translateY: ty }]}>{body}</Group>;
}

function OvalNode({ node, progress }: { node: Extract<SceneNode, { kind: 'oval' }>; progress: P }) {
  const rect = useDerivedValue(() => {
    const rx = lerp(node.rx, progress.value);
    const ry = lerp(node.ry, progress.value);
    return Skia.XYWHRect(
      lerp(node.cx, progress.value) - rx,
      lerp(node.cy, progress.value) - ry,
      rx * 2,
      ry * 2,
    );
  });
  const opacity = useDerivedValue(() => lerp(node.opacity ?? [1, 1], progress.value));
  const fillOpacity = useDerivedValue(() => opacity.value * (node.fillOpacity ?? 1));
  const strokeOpacity = useDerivedValue(() => opacity.value * (node.strokeOpacity ?? 1));
  // Exact elliptical radial gradient: draw a unit circle scaled to the oval.
  const unitTransform = useDerivedValue(() => [
    { translateX: lerp(node.cx, progress.value) },
    { translateY: lerp(node.cy, progress.value) },
    { scaleX: Math.max(lerp(node.rx, progress.value), 0.0001) },
    { scaleY: Math.max(lerp(node.ry, progress.value), 0.0001) },
  ]);

  const radialFill =
    node.fill && 'gradient' in node.fill && gradients[node.fill.gradient]?.type === 'radial'
      ? (gradients[node.fill.gradient] as Extract<SceneGradient, { type: 'radial' }>)
      : null;

  return (
    <>
      {radialFill ? (
        <Group transform={unitTransform} opacity={fillOpacity}>
          <Circle cx={0} cy={0} r={1}>
            <RadialGradient
              c={vec(radialFill.cx * 2 - 1, radialFill.cy * 2 - 1)}
              r={radialFill.r * 2}
              {...stopsOf(radialFill)}
            />
          </Circle>
        </Group>
      ) : node.fill ? (
        <Oval rect={rect} style="fill" color={colorOf(node.fill)} opacity={fillOpacity}>
          <PaintChildren paint={node.fill} bounds={rect} />
        </Oval>
      ) : null}
      {node.stroke ? (
        <Oval
          rect={rect}
          style="stroke"
          strokeWidth={node.strokeWidth ?? 1}
          color={colorOf(node.stroke)}
          opacity={strokeOpacity}>
          <PaintChildren paint={node.stroke} bounds={rect} dash={node.dash} />
        </Oval>
      ) : null}
    </>
  );
}

function TextNode({ node }: { node: Extract<SceneNode, { kind: 'text' }> }) {
  const font = useFont(require('../../../../../assets/fonts/InterTight-Bold.ttf'), node.size);
  if (!font) return null;
  return <SkiaText x={node.x} y={node.y} text={node.text} font={font} color={colorOf(node.fill)} />;
}

function GroupNode({
  node,
  progress,
}: {
  node: Extract<SceneNode, { kind: 'group' }>;
  progress: P;
}) {
  const opacity = useDerivedValue(() => lerp(node.opacity, progress.value));
  return (
    <Group opacity={opacity}>
      <Nodes nodes={node.children} progress={progress} />
    </Group>
  );
}

function Nodes({ nodes, progress }: { nodes: SceneNode[]; progress: P }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.kind) {
          case 'path':
            return <PathNode key={i} node={n} progress={progress} />;
          case 'oval':
            return <OvalNode key={i} node={n} progress={progress} />;
          case 'text':
            return <TextNode key={i} node={n} />;
          case 'group':
            return <GroupNode key={i} node={n} progress={progress} />;
        }
      })}
    </>
  );
}

export type GhostSceneProps = {
  progress: P;
  /** Rendered width in pt; the 390×560 scene scales uniformly to fit it. */
  width: number;
};

export function GhostScene({ progress, width }: GhostSceneProps) {
  const scale = width / SCENE_WIDTH;
  return (
    <Canvas style={{ width, height: SCENE_HEIGHT * scale }} pointerEvents="none">
      <Group transform={[{ scale }]}>
        <Nodes nodes={scene} progress={progress} />
      </Group>
    </Canvas>
  );
}
