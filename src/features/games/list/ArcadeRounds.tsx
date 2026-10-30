import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PressableScale, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import { rng } from '@/lib/rng';

import type { RoundProps } from '../engine/types';
import { useFrame, useRoundLoop } from './kit';
import {
  canPlace,
  dropSlab,
  emptyBoard,
  fallMs,
  FIT_SIZE,
  fitsAnywhere,
  fitStars,
  FLIGHT_MS,
  HOP_GOAL,
  HOP_LIVES,
  hopPoints,
  hopStars,
  LAND_TOLERANCE,
  LANES,
  laneSchedule,
  laneStars,
  makeTray,
  place,
  planetX,
  slabSpeed,
  slidePos,
  STACK_FLOORS,
  stackStars,
  type Board,
  type LaneItem,
  type Piece,
} from './logic';

const POLL_MS = 30;
const HUES = [
  color.game.pink,
  color.game.orange,
  color.game.sun,
  color.game.mint,
  color.game.sky,
  color.game.violet,
];

// ───────────────────────── Stack tower ─────────────────────────

const SLAB_H = 24;
const START_W = 0.6;
const VISIBLE_FLOORS = 9;

type Slab = { left: number; width: number; hue: string };

export function StackTowerRound({ api }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const [tower, setTower] = useState<Slab[]>(() => [
    { left: (W * (1 - START_W)) / 2, width: W * START_W, hue: HUES[0]! },
  ]);
  const moving = useSharedValue(0);
  const movingW = useSharedValue(W * START_W);
  const [movingHue, setMovingHue] = useState(HUES[1]!);
  const slide = useRef({ start: 0, speed: 0.2, range: W * (1 - START_W), active: false });
  const tapped = useRef(false);

  useFrame(api, (now) => {
    const s = slide.current;
    if (s.active) moving.set(slidePos(now - s.start, s.speed, s.range));
  });

  useRoundLoop(api, async () => {
    const timer = api.timer(40);
    let base = { left: (W * (1 - START_W)) / 2, width: W * START_W };
    let floors = 0;
    let perfect = 0;
    api.combo(0);
    api.hint(t('games.stackTower.hint'));
    while (!timer.done() && floors < STACK_FLOORS && base.width > 0) {
      const n = floors + 1;
      api.setRound(t('games.stackTower.floor', { n }));
      setMovingHue(HUES[n % HUES.length]!);
      movingW.set(base.width);
      slide.current = {
        start: api.clock.now(),
        speed: slabSpeed(n),
        range: W - base.width,
        active: true,
      };
      tapped.current = false;
      while (!tapped.current && !timer.done()) await api.wait(POLL_MS / 2);
      slide.current.active = false;
      if (!tapped.current) break;
      const d = dropSlab(base.left, base.width, moving.get());
      const y = api.board.height - Math.min(n, VISIBLE_FLOORS) * SLAB_H - SLAB_H / 2;
      if (d.width <= 0) {
        api.fx.oops();
        api.hint(t('games.stackTower.miss'), 'bad');
        break;
      }
      floors = n;
      if (d.perfect) {
        perfect++;
        const pts = 20 + perfect * 5;
        api.addScore(pts);
        api.combo(perfect);
        api.fx.hit(d.left + d.width / 2, y, color.text.primary, pts);
        api.hint(t('games.stackTower.perfect'), 'good');
        if (perfect > 1)
          api.fx.toast(t('games.stackTower.perfectX', { n: perfect }), color.game.sun);
      } else {
        perfect = 0;
        api.combo(0);
        api.addScore(10);
        api.fx.hit(d.left + d.width / 2, y, HUES[n % HUES.length]!, 10);
        api.hint(
          d.cut > 14 ? t('games.stackTower.trimmed') : t('games.stackTower.close'),
          d.cut > 14 ? 'bad' : 'good',
        );
      }
      base = { left: d.left, width: d.width };
      setTower((tw) => [...tw, { left: d.left, width: d.width, hue: HUES[n % HUES.length]! }]);
      await api.wait(250);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(700);
    api.finish({
      title: t('games.stackTower.title'),
      stars: stackStars(floors),
      score: floors * 15,
      stats: [
        t('games.stackTower.statFloors', { count: floors }),
        t('games.stackTower.statWidth', { px: Math.round(base.width) }),
      ],
      best: { value: floors, label: t('games.stackTower.statFloors', { count: floors }) },
    });
  });

  const shown = tower.slice(-VISIBLE_FLOORS + 1);
  const movingStyle = useAnimatedStyle(() => ({ left: moving.get(), width: movingW.get() }));
  return (
    <Pressable
      testID="game.stackTower.tap"
      accessibilityRole="button"
      accessibilityLabel={t('games.stackTower.drop')}
      onPress={() => {
        api.haptic('tap');
        tapped.current = true;
      }}
      style={styles.fill}>
      {shown.map((s, i) => (
        <View
          key={tower.length - shown.length + i}
          style={[
            styles.slab,
            { left: s.left, width: s.width, bottom: i * SLAB_H, backgroundColor: s.hue },
          ]}
        />
      ))}
      <Animated.View
        style={[
          styles.slab,
          { bottom: shown.length * SLAB_H, backgroundColor: movingHue },
          movingStyle,
        ]}
      />
    </Pressable>
  );
}

// ───────────────────────── Rocket hop ─────────────────────────

const PLANET = 68;
const ROCKET = 36;

export function RocketHopRound({ api }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const cx = W / 2;
  const amp = Math.min(W * 0.33, 120);
  const lowY = H - PLANET * 1.4;
  const highY = PLANET * 0.6;
  const planetXv = useSharedValue(cx);
  const rocketY = useSharedValue(lowY - ROCKET);
  const rocketX = useSharedValue(cx);
  const swing = useRef({ phase: 0, t0: 0, on: true });
  const tapped = useRef(false);
  const [hue, setHue] = useState(HUES[1]!);

  useFrame(api, (now) => {
    const s = swing.current;
    if (s.on) planetXv.set(planetX(now - s.t0, cx, amp, s.phase));
  });

  useRoundLoop(api, async () => {
    const timer = api.timer(40);
    const lives = api.lives(HOP_LIVES);
    let left = HOP_LIVES;
    let hops = 0;
    const rand = rng(Math.floor(Math.random() * 1e9));
    api.hint(t('games.rocketHop.hint'));
    while (!timer.done() && hops < HOP_GOAL && left > 0) {
      api.setRound(t('games.rocketHop.hop', { n: hops + 1 }));
      tapped.current = false;
      while (!tapped.current && !timer.done()) await api.wait(POLL_MS / 2);
      if (!tapped.current) break;
      // Flight: the planet keeps swinging while the rocket rises.
      const from = rocketY.get();
      const t0 = api.clock.now();
      while (api.clock.now() - t0 < FLIGHT_MS) {
        const p = (api.clock.now() - t0) / FLIGHT_MS;
        rocketY.set(from + (highY + PLANET / 2 - ROCKET - from) * p);
        await api.wait(16);
      }
      const offset = planetXv.get() - rocketX.get();
      if (Math.abs(offset) < LAND_TOLERANCE) {
        hops++;
        const pts = hopPoints(offset);
        api.addScore(pts);
        api.fx.hit(planetXv.get(), highY + PLANET / 2, hue, pts);
        api.hint(
          Math.abs(offset) < 10 ? t('games.rocketHop.bullseye') : t('games.rocketHop.landed'),
          'good',
        );
        // The world scrolls down: the planet becomes the new launch pad.
        swing.current.on = false;
        await api.wait(300);
        rocketX.set(cx);
        rocketY.set(lowY - ROCKET);
        setHue(HUES[(hops + 1) % HUES.length]!);
        swing.current = { phase: rand() * Math.PI * 2, t0: api.clock.now(), on: true };
      } else {
        left = lives.lose();
        api.fx.oops();
        api.hint(t('games.rocketHop.missed'), 'bad');
        await api.wait(400);
        rocketY.set(lowY - ROCKET);
      }
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(700);
    api.finish({
      title: hops ? t('games.rocketHop.titleSmooth') : t('games.rocketHop.titleLift'),
      stars: hopStars(hops, left),
      score: hops * 40,
      stats: [
        t('games.rocketHop.statHops', { count: hops }),
        t('games.rocketHop.statLives', { left, total: HOP_LIVES }),
      ],
      best: { value: hops, label: t('games.rocketHop.statHops', { count: hops }) },
    });
  });

  const planetStyle = useAnimatedStyle(() => ({ left: planetXv.get() - PLANET / 2 }));
  const rocketStyle = useAnimatedStyle(() => ({
    left: rocketX.get() - ROCKET / 2,
    top: rocketY.get(),
  }));
  return (
    <Pressable
      testID="game.rocketHop.tap"
      accessibilityRole="button"
      accessibilityLabel={t('games.rocketHop.launch')}
      onPress={() => {
        api.haptic('tap');
        tapped.current = true;
      }}
      style={styles.fill}>
      <Animated.View style={[styles.planet, { top: highY, backgroundColor: hue }, planetStyle]} />
      <View
        style={[
          styles.planet,
          { top: lowY, left: cx - PLANET / 2, backgroundColor: color.game.violet },
        ]}
      />
      <Animated.View style={[styles.rocket, rocketStyle]}>
        <Text variant="statMd">🚀</Text>
      </Animated.View>
    </Pressable>
  );
}

// ───────────────────────── Lane dash ─────────────────────────

const RUNNER = 44;
const THING = 40;

export function LaneDashRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const laneW = W / LANES;
  const runnerY = H - RUNNER - space.lg;
  const [items] = useState(() => laneSchedule(seed));
  const [visible, setVisible] = useState<(LaneItem & { key: number; y: number })[]>([]);
  const lane = useRef(1);
  const runnerX = useSharedValue(laneW * 1.5 - RUNNER / 2);
  const resolved = useRef(new Set<number>());
  const stats = useRef({ gems: 0, hits: 0 });

  const move = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(LANES - 1, lane.current + dir));
    if (next === lane.current) return;
    api.haptic('tap');
    lane.current = next;
    runnerX.set(laneW * (next + 0.5) - RUNNER / 2);
  };

  useRoundLoop(api, async () => {
    const timer = api.timer(30);
    api.combo(0);
    api.hint(t('games.laneDash.hint'));
    while (!timer.done()) {
      const now = api.clock.now();
      const vis: (LaneItem & { key: number; y: number })[] = [];
      items.forEach((it, key) => {
        if (resolved.current.has(key)) return;
        const fall = fallMs(it.at);
        const p = (now - it.at) / fall;
        if (p < 0) return;
        const y = -THING + p * (runnerY + THING);
        if (y > runnerY - THING / 2 && y < runnerY + RUNNER / 2) {
          if (it.lane === lane.current) {
            resolved.current.add(key);
            const x = laneW * (it.lane + 0.5);
            if (it.kind === 'gem') {
              stats.current.gems++;
              api.addScore(10);
              api.combo(stats.current.gems);
              api.fx.hit(x, runnerY, color.text.primary, 10);
            } else {
              stats.current.hits++;
              api.fx.oops();
              api.hint(t('games.laneDash.hit'), 'bad');
            }
            return;
          }
        }
        if (y > H) {
          resolved.current.add(key);
          return;
        }
        vis.push({ ...it, key, y });
      });
      setVisible(vis);
      await api.wait(16);
    }
    setVisible([]);
    api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(700);
    const { gems, hits } = stats.current;
    api.finish({
      title: t('games.laneDash.title'),
      stars: laneStars(hits),
      score: gems * 10,
      stats: [
        t('games.laneDash.statGems', { count: gems }),
        t('games.laneDash.statHits', { count: hits }),
      ],
      best: { value: gems, label: t('games.laneDash.statGems', { count: gems }) },
    });
  });

  const runnerStyle = useAnimatedStyle(() => ({ left: runnerX.get() }));
  return (
    <View style={styles.fill}>
      {[1, 2].map((i) => (
        <View key={i} style={[styles.laneLine, { left: laneW * i }]} />
      ))}
      {visible.map((it) => (
        <View
          key={it.key}
          style={[
            it.kind === 'gem' ? styles.gem : styles.block,
            { left: laneW * (it.lane + 0.5) - THING / 2, top: it.y },
          ]}
        />
      ))}
      <Animated.View style={[styles.runner, { top: runnerY }, runnerStyle]} />
      <View style={styles.laneButtons}>
        <Pressable
          testID="game.laneDash.left"
          accessibilityRole="button"
          accessibilityLabel={t('games.laneDash.left')}
          onPress={() => move(-1)}
          style={styles.half}
        />
        <Pressable
          testID="game.laneDash.right"
          accessibilityRole="button"
          accessibilityLabel={t('games.laneDash.right')}
          onPress={() => move(1)}
          style={styles.half}
        />
      </View>
    </View>
  );
}

// ───────────────────────── Block fit ─────────────────────────

export function BlockFitRound({ api, seed }: RoundProps) {
  const t = useT();
  const rand = useRef(rng(seed));
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [tray, setTray] = useState<(Piece | null)[]>(() => makeTray(rand.current, emptyBoard()));
  const [sel, setSel] = useState<number | null>(null);
  const stats = useRef({ lines: 0, misfits: 0, stuck: false });
  const cell = Math.floor(Math.min(api.board.width, api.board.height * 0.62) / FIT_SIZE);
  const boardPx = cell * FIT_SIZE;

  useRoundLoop(api, async () => {
    const timer = api.timer(45);
    api.combo(0);
    api.hint(t('games.blockFit.hint'));
    while (!timer.done() && !stats.current.stuck) await api.wait(POLL_MS * 3);
    if (stats.current.stuck) api.fx.toast(t('games.blockFit.noRoom'), color.signal.warning);
    else api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(800);
    const { lines, misfits } = stats.current;
    api.finish({
      title: lines ? t('games.blockFit.titleClean') : t('games.blockFit.titleTry'),
      stars: fitStars(lines, misfits),
      score: lines * 25,
      stats: [
        t('games.blockFit.statLines', { count: lines }),
        t('games.blockFit.statMisfits', { count: misfits }),
      ],
      best: { value: lines, label: t('games.blockFit.statLines', { count: lines }) },
    });
  });

  const tapCell = (r: number, c: number) => {
    if (sel === null) return;
    const p = tray[sel];
    if (!p) return;
    if (!canPlace(board, p, r, c)) {
      stats.current.misfits++;
      api.fx.oops();
      api.hint(t('games.blockFit.misfit'), 'bad');
      return;
    }
    api.haptic('tap');
    const res = place(board, p, r, c);
    let nextTray = tray.map((x, i) => (i === sel ? null : x));
    if (nextTray.every((x) => x === null)) nextTray = makeTray(rand.current, res.board);
    setBoard(res.board);
    setTray(nextTray);
    setSel(null);
    if (res.lines) {
      stats.current.lines += res.lines;
      api.addScore(res.lines * 25);
      api.combo(stats.current.lines);
      api.fx.hit(
        (c + 0.5) * cell + (api.board.width - boardPx) / 2,
        (r + 0.5) * cell,
        color.game.sky,
        res.lines * 25,
      );
      api.hint(t('games.blockFit.cleared', { count: res.lines }), 'good');
    } else {
      api.addScore(p.cells.length);
    }
    if (!nextTray.some((x) => x && fitsAnywhere(res.board, x))) stats.current.stuck = true;
  };

  const preview = sel !== null ? tray[sel] : null;
  return (
    <View style={[styles.fill, styles.fitRoot]}>
      <View style={[styles.fitBoard, { width: boardPx, height: boardPx }]}>
        {board.map((row, r) =>
          row.map((on, c) => (
            <Pressable
              key={`${r}-${c}`}
              testID={`game.blockFit.cell.${r}.${c}`}
              accessibilityLabel={t('games.blockFit.cell', { r: r + 1, c: c + 1 })}
              onPress={() => tapCell(r, c)}
              style={[
                styles.fitCell,
                { width: cell, height: cell, left: c * cell, top: r * cell },
                on ? styles.fitOn : null,
              ]}
            />
          )),
        )}
      </View>
      <View style={styles.tray}>
        {tray.map((p, i) => (
          <PressableScale
            key={i}
            testID={`game.blockFit.piece.${i}`}
            accessibilityRole="button"
            accessibilityState={{ selected: sel === i, disabled: !p }}
            accessibilityLabel={
              p ? t('games.blockFit.piece', { n: p.cells.length }) : t('games.blockFit.used')
            }
            disabled={!p}
            onPress={() => {
              api.haptic('tap');
              setSel(sel === i ? null : i);
            }}
            style={[styles.trayBox, sel === i ? styles.traySel : null]}>
            {p ? (
              <PieceView
                piece={p}
                cell={TRAY_CELL}
                tint={sel === i ? color.game.sun : color.game.sky}
              />
            ) : null}
          </PressableScale>
        ))}
      </View>
      <Text variant="caption" tone="secondary" align="center">
        {preview ? t('games.blockFit.placeHint') : t('games.blockFit.pickHint')}
      </Text>
    </View>
  );
}

const TRAY_CELL = 16;

function PieceView({ piece, cell, tint }: { piece: Piece; cell: number; tint: string }) {
  const rows = Math.max(...piece.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) + 1;
  return (
    <View style={{ width: cols * cell, height: rows * cell }}>
      {piece.cells.map(([r, c]) => (
        <View
          key={`${r}${c}`}
          style={[
            styles.pieceCell,
            {
              width: cell - 2,
              height: cell - 2,
              left: c * cell,
              top: r * cell,
              backgroundColor: tint,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  slab: { position: 'absolute', height: SLAB_H - 2, borderRadius: radius.sm },
  planet: { position: 'absolute', width: PLANET, height: PLANET, borderRadius: radius.pill },
  rocket: {
    position: 'absolute',
    width: ROCKET,
    height: ROCKET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: color.surface.line,
  },
  block: {
    position: 'absolute',
    width: THING,
    height: THING,
    borderRadius: radius.md,
    backgroundColor: color.game.coral,
  },
  gem: {
    position: 'absolute',
    width: THING * 0.7,
    height: THING * 0.7,
    marginLeft: THING * 0.15,
    borderRadius: radius.sm,
    backgroundColor: color.text.primary,
    transform: [{ rotate: '45deg' }],
  },
  runner: {
    position: 'absolute',
    width: RUNNER,
    height: RUNNER,
    borderRadius: radius.lg,
    backgroundColor: color.game.pink,
  },
  laneButtons: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  half: { flex: 1 },
  fitRoot: { alignItems: 'center', gap: space.lg },
  fitBoard: { borderRadius: radius.md, backgroundColor: color.surface.card },
  fitCell: { position: 'absolute', borderWidth: size.hairline, borderColor: color.surface.line },
  fitOn: { backgroundColor: color.game.sky, borderColor: color.bg.ink },
  tray: { flexDirection: 'row', gap: space.md },
  trayBox: {
    width: size.touch * 2,
    height: size.touch * 2,
    borderRadius: radius.lg,
    backgroundColor: color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traySel: { borderWidth: 2, borderColor: color.game.sun },
  pieceCell: { position: 'absolute', borderRadius: 3 },
});
