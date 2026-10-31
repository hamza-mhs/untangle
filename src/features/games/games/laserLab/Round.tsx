import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { color, motion, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop, Well } from '../../kit';
import {
  extraTurns,
  flip,
  laserLevel,
  laserStars,
  LASER_LABS,
  LASER_POINTS,
  LASER_SECONDS,
  LASER_SIZE,
  traceBeam,
  type Dir,
  type LaserLevel,
  type Tilt,
} from './logic';

const POLL_MS = 40;
/** Prototype cell is 50 px; pieces are sized as fractions of it. */
const PIECE = 40 / 50;
const BASE = 34 / 50;
const BAR_W = 36 / 50;
const BAR_H = 5 / 50;
const NUB = 10 / 50;
/** Prototype beam dash: 6 on, 6 off, one period every 500 ms. */
const DASH = 6 / 50;
const DASH_MS = 500;
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

const tiltDeg = (t: Tilt) => (t === '/' ? -45 : 45);

/** Mirror bar (prototype `.lmb .mb`): drawn above the beam, springs to its new angle. */
function MirrorBar({ tilt, cell, reduced }: { tilt: Tilt; cell: number; reduced: boolean }) {
  const deg = useSharedValue(tiltDeg(tilt));
  useEffect(() => {
    const to = tiltDeg(tilt);
    deg.set(
      reduced
        ? to
        : withTiming(to, {
            duration: motion.duration.base,
            easing: Easing.bezier(0.3, 1.5, 0.5, 1),
          }),
    );
  }, [tilt, reduced, deg]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${deg.get()}deg` }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bar, { width: cell * BAR_W, height: Math.max(3, cell * BAR_H) }, style]}
    />
  );
}

/** Mirror base (Enamel piece, prototype `.lmr`): the tap target, under the beam. */
function MirrorBase({
  index,
  cell,
  pulse,
  label,
  onPress,
}: {
  index: number;
  cell: number;
  pulse: SharedValue<number>;
  label: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));
  const d = cell * BASE;
  return (
    <Pressable
      testID={`game.laserLab.mirror${index}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.cellBox, { width: cell, height: cell }]}>
      <Animated.View style={[styles.base, { width: d, height: d }, style]}>
        <View style={styles.baseLip} />
        <View style={styles.baseShine} />
      </Animated.View>
    </Pressable>
  );
}

/** Where the emitter's nub sits (prototype `.lem i`, on the firing side). */
function nubStyle(dir: Dir, piece: number, nub: number) {
  const mid = (piece - nub) / 2;
  const out = -nub * 0.4;
  if (dir === 'R') return { right: out, top: mid };
  if (dir === 'L') return { left: out, top: mid };
  if (dir === 'U') return { top: out, left: mid };
  return { bottom: out, left: mid };
}

export default function LaserLabRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const side = Math.min(W, H * 0.9);
  const cell = side / LASER_SIZE;
  const ox = (W - side) / 2;
  const oy = (H - side) / 2;

  const levels = useMemo(
    () => Array.from({ length: LASER_LABS }, (_, i) => laserLevel(seed, i)),
    [seed],
  );
  const [lab, setLab] = useState(0);
  const [tilts, setTilts] = useState<Tilt[]>(() => levels[0]!.mirrors.map((m) => m.start));
  const [lit, setLit] = useState(false);
  const tiltsRef = useRef(tilts);
  const open = useRef(false);
  const taps = useRef(0);

  const level: LaserLevel = levels[lab]!;
  const trace = useMemo(() => traceBeam(level, tilts), [level, tilts]);
  const pts = trace.points.map(([x, y]) => `${x * cell},${y * cell}`).join(' ');

  // One press pulse per mirror slot (labs have at most 5 mirrors).
  const p0 = useSharedValue(1);
  const p1 = useSharedValue(1);
  const p2 = useSharedValue(1);
  const p3 = useSharedValue(1);
  const p4 = useSharedValue(1);
  const pulses = [p0, p1, p2, p3, p4];

  // Marching beam dashes, driven by the game clock so pause freezes them.
  const dash = useSharedValue(0);
  useFrame(api, (now) => {
    if (!api.reducedMotion) dash.set(-((now % DASH_MS) / DASH_MS) * DASH * 2 * cell);
  });
  const dashProps = useAnimatedProps(() => ({ strokeDashoffset: dash.get() }));

  const glowR = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowR.get() * 0.35,
    transform: [{ scale: 1 + glowR.get() * 0.4 }],
  }));

  const centre = (r: number, c: number) => ({
    x: ox + (c + 0.5) * cell,
    y: oy + (r + 0.5) * cell,
  });

  useRoundLoop(api, async () => {
    const timer = api.timer(LASER_SECONDS);
    api.combo(0);
    let labs = 0;
    let allTaps = 0;
    let extra = 0;
    for (let i = 0; i < LASER_LABS && !timer.done(); i++) {
      const L = levels[i]!;
      const start = L.mirrors.map((m) => m.start);
      tiltsRef.current = start;
      setTilts(start);
      setLab(i);
      setLit(false);
      glowR.set(0);
      taps.current = 0;
      api.setRound(t('games.laserLab.lab', { n: i + 1, total: LASER_LABS }));
      api.hint(t('games.laserLab.hint'));
      await api.wait(i === 0 ? 300 : 500);
      open.current = true;
      while (!timer.done() && !traceBeam(L, tiltsRef.current).hit) await api.wait(POLL_MS);
      open.current = false;
      allTaps += taps.current;
      const over = extraTurns(taps.current, L.minTurns);
      extra += over;
      if (!traceBeam(L, tiltsRef.current).hit) break;
      labs++;
      api.combo(labs);
      setLit(true);
      glowR.set(api.reducedMotion ? 1 : withTiming(1, { duration: 400 }));
      const { x, y } = centre(L.reactor[0], L.reactor[1]);
      api.fx.ring(x, y, color.game.pink, cell * 1.8);
      api.fx.burst(x, y, color.text.primary, 16);
      api.fx.float(x, y - cell * 0.5, `+${LASER_POINTS}`);
      api.addScore(LASER_POINTS);
      api.sound('good');
      api.haptic('good');
      api.fx.toast(t('games.laserLab.ignited'), color.game.pink);
      if (over) api.hint(t('games.laserLab.extra', { count: over }));
      else api.hint(t('games.laserLab.clean'), 'good');
      await api.wait(1300);
    }
    if (timer.done()) {
      api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
      await api.wait(700);
    }
    api.finish({
      title: labs ? t('games.laserLab.title') : t('games.laserLab.titleNone'),
      stars: laserStars(labs, extra),
      stats: [
        t('games.laserLab.statLabs', { n: labs, total: LASER_LABS }),
        t('games.laserLab.statTurns', { count: allTaps, extra }),
      ],
      // Lower is better: only a round with every reactor lit can set a record.
      ...(labs === LASER_LABS
        ? { best: { value: extra, label: t('games.laserLab.statExtra', { count: extra }) } }
        : {}),
      items: levels.map((l) => l.id),
    });
  });

  const onMirror = (k: number) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    taps.current++;
    const next = tiltsRef.current.map((x, i) => (i === k ? flip(x) : x));
    tiltsRef.current = next;
    setTilts(next);
    const p = pulses[k];
    if (p && !api.reducedMotion) {
      p.set(withSequence(withTiming(0.9, { duration: 0 }), withTiming(1, { duration: 200 })));
    }
  };

  const at = (r: number, c: number, size: number) => ({
    left: (c + 0.5) * cell - size / 2,
    top: (r + 0.5) * cell - size / 2,
  });
  const piece = cell * PIECE;
  const nub = cell * NUB;
  const dirWord = t(`games.laserLab.dir${level.dir}`);

  return (
    <View style={styles.fill}>
      <Well
        style={[styles.board, { left: ox, top: oy, width: side, height: side }]}
        accessibilityLabel={t(lit ? 'games.laserLab.a11yLit' : 'games.laserLab.a11yBoard')}>
        {/* Recessed grid: a faint dot in every cell (prototype `.llc::after`). */}
        <Svg width={side} height={side} style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: LASER_SIZE * LASER_SIZE }, (_, i) => (
            <Circle
              key={i}
              cx={((i % LASER_SIZE) + 0.5) * cell}
              cy={(Math.floor(i / LASER_SIZE) + 0.5) * cell}
              r={2}
              fill={color.surface.track}
            />
          ))}
        </Svg>
      </Well>
      <View
        style={[styles.layer, { left: ox, top: oy, width: side, height: side }]}
        pointerEvents="box-none">
        {/* 1 · Mirror bases (tap targets), under the beam. */}
        {level.mirrors.map((m, k) => (
          <View
            key={`b${lab}-${k}`}
            style={[styles.abs, at(m.cell[0], m.cell[1], cell)]}
            pointerEvents="box-none">
            <MirrorBase
              index={k}
              cell={cell}
              pulse={pulses[k]!}
              label={t('games.laserLab.mirror', {
                n: k + 1,
                tilt: t(tilts[k] === '/' ? 'games.laserLab.tiltUp' : 'games.laserLab.tiltDown'),
              })}
              onPress={() => onMirror(k)}
            />
          </View>
        ))}
        {/* 2 · The beam: soft pink glow plus a bright marching core. */}
        <Svg
          width={side}
          height={side}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Polyline
            points={pts}
            fill="none"
            stroke={color.game.pink}
            strokeOpacity={0.25}
            strokeWidth={cell * 0.24}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points={pts}
            fill="none"
            stroke={color.game.pink}
            strokeOpacity={0.55}
            strokeWidth={cell * 0.16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedPolyline
            points={pts}
            fill="none"
            stroke={color.text.primary}
            strokeWidth={Math.max(2, cell * 0.052)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={[DASH * cell, DASH * cell]}
            animatedProps={dashProps}
          />
        </Svg>
        {/* 3 · Emitter, walls, reactor. */}
        <View
          style={[
            styles.abs,
            styles.emitter,
            at(level.emitter[0], level.emitter[1], piece),
            { width: piece, height: piece },
          ]}
          accessible
          accessibilityLabel={t('games.laserLab.emitter', { dir: dirWord })}>
          <View style={styles.pieceLip} />
          <View style={styles.pieceShine} />
          <View
            style={[styles.nub, { width: nub, height: nub }, nubStyle(level.dir, piece, nub)]}
          />
        </View>
        {level.walls.map((w, i) => (
          <View
            key={`w${lab}-${i}`}
            style={[
              styles.abs,
              styles.wall,
              at(w[0], w[1], piece),
              { width: piece, height: piece },
            ]}
            accessible
            accessibilityLabel={t('games.laserLab.wall')}>
            <View style={styles.pieceLip} />
            <View style={styles.pieceShine} />
          </View>
        ))}
        <View
          style={[
            styles.abs,
            at(level.reactor[0], level.reactor[1], piece),
            { width: piece, height: piece },
          ]}
          testID="game.laserLab.reactor"
          accessible
          accessibilityLabel={t(lit ? 'games.laserLab.reactorLit' : 'games.laserLab.reactor')}>
          <Animated.View pointerEvents="none" style={[styles.reactorGlow, glowStyle]} />
          <View style={styles.reactor}>
            <View style={[styles.reactorTint, lit ? styles.reactorTintOn : null]} />
            <View style={[styles.reactorRing, lit ? styles.on : null]} />
            <View
              style={[
                styles.core,
                { width: piece * 0.4, height: piece * 0.4 },
                lit ? styles.coreOn : null,
              ]}
            />
          </View>
        </View>
        {/* 4 · Mirror bars, above the beam (3.3b layering note). */}
        {level.mirrors.map((m, k) => (
          <View
            key={`m${lab}-${k}`}
            pointerEvents="none"
            style={[
              styles.abs,
              styles.cellBox,
              at(m.cell[0], m.cell[1], cell),
              { width: cell, height: cell },
            ]}>
            <MirrorBar tilt={tilts[k]!} cell={cell} reduced={api.reducedMotion} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  board: { position: 'absolute', borderRadius: radius.card },
  layer: { position: 'absolute' },
  abs: { position: 'absolute' },
  cellBox: { alignItems: 'center', justifyContent: 'center' },
  base: {
    borderRadius: radius.pill,
    backgroundColor: color.brand.violet,
    opacity: 0.9,
    overflow: 'hidden',
  },
  baseLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
    backgroundColor: color.brand.violetDeep,
    opacity: 0.8,
  },
  baseShine: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    top: '10%',
    height: '18%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.3,
  },
  bar: {
    borderRadius: radius.sm,
    backgroundColor: color.text.primary,
    borderWidth: 1,
    borderColor: color.brand.violetDeep,
  },
  emitter: {
    borderRadius: radius.md,
    backgroundColor: color.game.cobalt,
    overflow: 'visible',
  },
  wall: {
    borderRadius: radius.md,
    backgroundColor: color.surface.ring,
    overflow: 'hidden',
  },
  pieceLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    backgroundColor: color.overlay.scrim,
    opacity: 0.45,
  },
  pieceShine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '8%',
    height: '14%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.22,
  },
  nub: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    borderWidth: 2,
    borderColor: color.game.pink,
  },
  reactorGlow: {
    ...StyleSheet.absoluteFill,
    margin: -space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.game.pink,
    opacity: 0,
  },
  reactor: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: color.bg.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Prototype `.lre`: a dark pink well with a dim ring and core until it ignites. */
  reactorTint: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: color.game.pink,
    opacity: 0.14,
  },
  reactorTintOn: { opacity: 0.3 },
  reactorRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.game.pink,
    opacity: 0.35,
  },
  on: { opacity: 1 },
  core: { borderRadius: radius.pill, backgroundColor: color.game.pink, opacity: 0.35 },
  coreOn: {
    opacity: 1,
    backgroundColor: color.text.primary,
    borderWidth: 2,
    borderColor: color.game.pink,
    transform: [{ scale: 1.4 }],
  },
});
