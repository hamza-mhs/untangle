import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Text } from '@/design/components';
import { color, fontFamily, motion, radius, space } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

/** Counts 0 → `to` over `ms` with an ease-out (JS state, for SVG/grid fills). */
function useCountUp(to: number, ms: number): number {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, reduced]);
  return reduced ? to : n;
}

const YEAR_COLS = 21;
const YEAR_DAYS = 365;
const YEAR_FILL_MS = 900;

/** §2.7: 365 squares, the first `filled` turn red row by row (0.9 s). */
export function YearDotGrid({ filled, label }: { filled: number; label: string }) {
  const shown = useCountUp(Math.min(filled, YEAR_DAYS), YEAR_FILL_MS);
  const rows = Math.ceil(YEAR_DAYS / YEAR_COLS);
  const cell = 10;
  const gap = 3;
  const w = YEAR_COLS * (cell + gap) - gap;
  const h = rows * (cell + gap) - gap;
  return (
    <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMin meet">
        {Array.from({ length: YEAR_DAYS }, (_, i) => (
          <Rect
            key={i}
            x={(i % YEAR_COLS) * (cell + gap)}
            y={Math.floor(i / YEAR_COLS) * (cell + gap)}
            width={cell}
            height={cell}
            rx={2.5}
            fill={i < shown ? color.signal.danger : color.surface.controlStrong}
          />
        ))}
      </Svg>
    </View>
  );
}

const GROW_MS = motion.duration.slow;
const STAGGER_MS = 120;

function GrowBar({
  ratio,
  delay,
  tint,
  height,
}: {
  ratio: number;
  delay: number;
  tint: string;
  height: number;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced)
      p.set(
        withDelay(
          delay,
          withTiming(1, { duration: GROW_MS, easing: Easing.bezier(...motion.easing.standard) }),
        ),
      );
  }, [delay, p, reduced]);
  const style = useAnimatedStyle(() => ({ height: height * ratio * p.get() }));
  return <Animated.View style={[styles.bar, { backgroundColor: tint }, style]} />;
}

/** §2.8: 2½ min (2004) vs 47 s (2016–20), with the −69 % arrow. */
export function ShrinkChart({
  before,
  after,
  beforeYear,
  afterYear,
  drop,
  label,
}: {
  before: string;
  after: string;
  beforeYear: string;
  afterYear: string;
  drop: string;
  label: string;
}) {
  const [h, setH] = useState(0);
  const ratioAfter = 47 / 150;
  return (
    <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View
        style={styles.shrinkRow}
        onLayout={(e) => setH(Math.max(0, e.nativeEvent.layout.height - 64))}>
        <View style={styles.shrinkCol}>
          <Text variant="statLg" tone="success">
            {before}
          </Text>
          {h > 0 ? <GrowBar ratio={1} delay={0} tint={color.signal.success} height={h} /> : null}
          <Text variant="caption" tone="secondary" align="center">
            {beforeYear}
          </Text>
        </View>
        <View style={styles.arrow}>
          <Svg width={40} height={44} viewBox="0 0 40 44">
            <Path
              d="M4 4 C 26 6, 34 18, 26 36 M18 30 l8 7 l6 -9"
              fill="none"
              stroke={color.signal.danger}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text variant="caption" tone="danger" style={styles.bold}>
            {drop}
          </Text>
        </View>
        <View style={styles.shrinkCol}>
          <Text variant="statLg" tone="danger">
            {after}
          </Text>
          {h > 0 ? (
            <GrowBar ratio={ratioAfter} delay={STAGGER_MS} tint={color.signal.danger} height={h} />
          ) : null}
          <Text variant="caption" tone="secondary" align="center">
            {afterYear}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** §2.14: example weekly bars, the last one highlighted. */
export function WeekBars({
  values,
  labels,
  top,
  label,
}: {
  values: number[];
  labels: string[];
  top: string;
  label: string;
}) {
  const [h, setH] = useState(0);
  const max = Math.max(...values);
  return (
    <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Text variant="statMd" tone="success" align="right" numberOfLines={1}>
        {top}
      </Text>
      <View
        style={styles.weekRow}
        onLayout={(e) => setH(Math.max(0, e.nativeEvent.layout.height - space['3xl']))}>
        {values.map((v, i) => {
          const last = i === values.length - 1;
          return (
            <View key={labels[i]} style={styles.weekCol}>
              {h > 0 ? (
                <GrowBar
                  ratio={v / max}
                  delay={i * STAGGER_MS}
                  tint={last ? color.signal.success : color.surface.ring}
                  height={h}
                />
              ) : null}
              <Text variant="caption" tone="tertiary" align="center">
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** §2.11: cumulative hours over a year, today's pace (red) vs with the cut (green). */
export function YearLinesChart({
  now,
  goal,
  ticks,
  nowLabel,
  goalLabel,
  label,
}: {
  now: number[];
  goal: number[];
  ticks: string[];
  nowLabel: string;
  goalLabel: string;
  label: string;
}) {
  const W = 300;
  const H = 210;
  const max = Math.max(...now) || 1;
  const x = (i: number) => 8 + (i / (now.length - 1)) * (W - 16);
  // A little wobble makes the lines read as real weeks, not a ruler.
  const y = (v: number, i: number) =>
    H - 8 - (v / max) * (H - 40) + (i % 2 ? 4 : -2) * (i > 0 && i < now.length - 1 ? 1 : 0);
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v, i).toFixed(1)}`).join(' ');
  const last = now.length - 1;
  const area = `${path(now)} L${x(last)} ${y(goal[last] ?? 0, last)} ${[...goal]
    .map((v, i) => [v, i] as const)
    .reverse()
    .map(([v, i]) => `L${x(i).toFixed(1)} ${y(v, i).toFixed(1)}`)
    .join(' ')} Z`;
  return (
    <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={styles.linesWrap}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="ylArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color.signal.success} stopOpacity={0.22} />
              <Stop offset="1" stopColor={color.signal.success} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <Rect key={f} x={0} y={H * f - 26} width={W} height={1} fill={color.surface.line} />
          ))}
          <Path d={area} fill="url(#ylArea)" />
          <Path
            d={path(now)}
            fill="none"
            stroke={color.signal.danger}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Path
            d={path(goal)}
            fill="none"
            stroke={color.signal.success}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle cx={x(last)} cy={y(now[last] ?? 0, last)} r={5} fill={color.signal.danger} />
          <Circle cx={x(last)} cy={y(goal[last] ?? 0, last)} r={5} fill={color.signal.success} />
        </Svg>
        <View style={[styles.tag, styles.tagNow]}>
          <Text variant="caption" tone="onLight" style={styles.bold}>
            {nowLabel}
          </Text>
        </View>
        <View style={[styles.tag, styles.tagGoal]}>
          <Text variant="caption" tone="onLight" style={styles.bold}>
            {goalLabel}
          </Text>
        </View>
      </View>
      <View style={styles.ticks}>
        {ticks.map((tk) => (
          <Text key={tk} variant="caption" tone="tertiary">
            {tk}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** §2.10: "{k} of 5 focus signs" pills. */
export function SignPills({
  filled,
  total,
  label,
}: {
  filled: number;
  total: number;
  label: string;
}) {
  return (
    <View style={styles.pillsWrap}>
      <View
        style={styles.pills}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.pill, i < filled ? styles.pillOn : null]} />
        ))}
      </View>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch' },
  bold: { fontFamily: fontFamily.bold },
  bar: { alignSelf: 'stretch', borderRadius: radius.lg },
  shrinkRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  shrinkCol: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-end', gap: space.sm },
  arrow: { alignItems: 'center', marginBottom: 120, gap: space.xs },
  weekRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  weekCol: { flex: 1, justifyContent: 'flex-end', gap: space.sm },
  linesWrap: { flex: 1 },
  tag: {
    position: 'absolute',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  tagNow: { right: space['3xl'], top: '8%', backgroundColor: color.signal.dangerText },
  tagGoal: {
    right: space['3xl'] + space['2xl'],
    top: '36%',
    backgroundColor: color.signal.success,
  },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  pillsWrap: { gap: space.sm },
  pills: { flexDirection: 'row', gap: space.xs },
  pill: {
    width: 34,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
  },
  pillOn: { backgroundColor: color.signal.danger },
});
