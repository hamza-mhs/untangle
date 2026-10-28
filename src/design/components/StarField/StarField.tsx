import { Canvas, Circle, Group, Line, LinearGradient, Mask, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { color } from '../../tokens';
import { useReducedMotion } from '../../useReducedMotion';

export type Star = {
  x: number;
  y: number;
  r: number;
  /** Peak opacity of the twinkle. */
  a: number;
  /** Twinkle half-period in seconds (dim → bright). */
  d: number;
};

export type StarLine = readonly [number, number, number, number];

export type StarFieldProps = {
  stars: readonly Star[];
  /** Constellation segments [x1, y1, x2, y2], drawn at 8 % white. */
  lines?: readonly StarLine[];
  /** Width of one seamless tile in design units. Stars should cover [0, 2 × tileWidth). */
  tileWidth: number;
  height: number;
  /** Rendered width in pt; content scales uniformly by width / tileWidth. */
  width: number;
  /** Seconds to drift one tile width, left → right. */
  driftSeconds?: number;
  /** Fraction of the height (from the bottom) that fades to transparent. */
  fade?: number;
  /** Overall layer opacity (Home and OB12 reuse it faint). */
  opacity?: number;
  testID?: string;
};

const MIN_OPACITY = 0.06;

function TwinkleStar({ star, time }: { star: Star; time: SharedValue<number> | null }) {
  const opacity = useDerivedValue(() => {
    if (!time) return star.a;
    // CSS `ease-in-out infinite alternate` ≈ raised cosine over a 2·d period.
    const k = 0.5 - 0.5 * Math.cos((time.value / star.d) * Math.PI);
    return MIN_OPACITY + (star.a - MIN_OPACITY) * k;
  });
  return <Circle cx={star.x} cy={star.y} r={star.r} color={color.effect.star} opacity={opacity} />;
}

/**
 * Drifting, twinkling star layer (Skia), one clock for everything. Reduce Motion: stars at
 * their peak opacity, still.
 */
export function StarField({
  stars,
  lines = [],
  tileWidth,
  height,
  width,
  driftSeconds = 120,
  fade = 0.45,
  opacity = 1,
  testID,
}: StarFieldProps) {
  const reduceMotion = useReducedMotion();
  const scale = width / tileWidth;
  const seconds = useSharedValue(0);

  useFrameCallback((frame) => {
    seconds.value = (frame.timeSinceFirstFrame ?? 0) / 1000;
  }, !reduceMotion);

  const transform = useDerivedValue(() => [
    { scale },
    // Content spans two tiles; slide from −tile → 0 and wrap, so it moves left → right.
    { translateX: reduceMotion ? 0 : ((seconds.value / driftSeconds) % 1) * tileWidth - tileWidth },
  ]);

  const h = height * scale;
  const allLines = [
    ...lines,
    ...lines.map(([x1, y1, x2, y2]) => [x1 + tileWidth, y1, x2 + tileWidth, y2] as const),
  ];

  return (
    <Canvas testID={testID} style={{ width, height: h }} pointerEvents="none">
      <Group opacity={opacity}>
        <Mask
          mask={
            <Rect x={0} y={0} width={width} height={h}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, h)}
                colors={[color.effect.maskOpaque, color.effect.maskOpaque, color.effect.maskClear]}
                positions={[0, 1 - fade, 1]}
              />
            </Rect>
          }>
          <Group transform={transform}>
            {allLines.map(([x1, y1, x2, y2], i) => (
              <Line
                key={`l${i}`}
                p1={vec(x1, y1)}
                p2={vec(x2, y2)}
                color={color.effect.starLine}
                strokeWidth={0.8}
              />
            ))}
            {stars.map((s, i) => (
              <TwinkleStar key={i} star={s} time={reduceMotion ? null : seconds} />
            ))}
          </Group>
        </Mask>
      </Group>
    </Canvas>
  );
}
