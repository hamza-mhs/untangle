import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/design/components';
import { color, motion, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import {
  canMerge,
  FLOWER,
  GARDEN_COLS,
  GARDEN_GOAL,
  GARDEN_SECONDS,
  gardenPoints,
  gardenStars,
  mergeAt,
  SEED,
  spawnSeeds,
  SPROUT,
  startGarden,
  type Level,
} from './logic';

const POLL_MS = 30;
/** Prototype timings: the plant glides onto its match, pops, and a flower flies to the goal. */
const FLY_MS = 320;
const SETTLE_MS = 140;
const SNAP_MS = 180;
const POP_MS = 380;
const FLOWER_HOLD_MS = 380;
const GOAL_FLY_MS = 450;
const NEXT_MS = 250;
/** A press that moves less than this is a tap (select / merge by taps). */
const LIFT_DP = 10;
/** Prototype sizes: 56 dp wells with 44 dp plants and 38 dp goal slots. */
const PLANT = 44 / 56;
const SLOT = 38 / 56;
const SLOT_PLANT = 30 / 38;
const MAX_CELL = size.touch * 1.75;
const POP = Easing.bezier(...motion.easing.pop);
const FLY = Easing.bezier(...motion.easing.standard);
const PLANT_KEYS = ['empty', 'seed', 'sprout', 'flower'] as const;

type Anim = 'none' | 'drop' | 'grow';
type WellState = { lv: Level; id: number; anim: Anim; shake: number };
type Move = { from: number; to: number; drag: boolean };

/** Seed, sprout and flower (prototype `GSVG`, 40 × 40 viewBox), in game colours. */
function Plant({ level, px }: { level: Level; px: number }) {
  if (level === 0) return null;
  return (
    <Svg width={px} height={px} viewBox="0 0 40 40">
      {level === SEED ? (
        <>
          <Ellipse cx={20} cy={23} rx={10} ry={12.5} fill={color.game.orange} />
          <Ellipse cx={20} cy={23} rx={10} ry={12.5} fill={color.bg.ink} opacity={0.32} />
          <Ellipse cx={16} cy={18} rx={3} ry={5} fill={color.game.sun} opacity={0.6} />
          <Path
            d="M20 10.5 q3 -5 8 -4"
            stroke={color.game.orange}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            strokeOpacity={0.55}
          />
        </>
      ) : null}
      {level === SPROUT ? (
        <>
          <Ellipse cx={20} cy={33} rx={12} ry={4} fill={color.game.orange} opacity={0.35} />
          <Path d="M20 33 V18" stroke={color.game.mint} strokeWidth={3} strokeLinecap="round" />
          <Path d="M20 22 C 10 22, 7 13, 9 9 C 16 9, 20 14, 20 22Z" fill={color.signal.success} />
          <Path d="M20 19 C 29 19, 33 11, 31 7 C 24 7, 20 11, 20 19Z" fill={color.game.mint} />
        </>
      ) : null}
      {level === FLOWER ? (
        <>
          <Path d="M20 36 V22" stroke={color.game.mint} strokeWidth={3} strokeLinecap="round" />
          <Path
            d="M20 30 C 13 30, 11 25, 12 23 C 17 23, 20 26, 20 30Z"
            fill={color.signal.success}
          />
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx={20}
              cy={9}
              rx={5.2}
              ry={7}
              fill={color.game.pink}
              transform={`rotate(${a} 20 16)`}
            />
          ))}
          <Circle cx={20} cy={16} r={4.6} fill={color.game.sun} />
        </>
      ) : null}
    </Svg>
  );
}

/** A plant in its well: drops in, pops when it grows, shakes on a bad drop. */
function WellPlant({
  w,
  px,
  hidden,
  selected,
  reduced,
}: {
  w: WellState;
  px: number;
  hidden: boolean;
  selected: boolean;
  reduced: boolean;
}) {
  const still = reduced || w.anim === 'none';
  const drop = useSharedValue(still || w.anim !== 'drop' ? 1 : 0);
  const scale = useSharedValue(still || w.anim !== 'grow' ? 1 : 0.6);
  const dx = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    if (w.anim === 'drop') drop.set(withTiming(1, { duration: POP_MS, easing: POP }));
    else
      scale.set(
        withSequence(
          withTiming(1.15, { duration: POP_MS * 0.45 }),
          withTiming(1, { duration: POP_MS * 0.55 }),
        ),
      );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!w.shake || reduced) return;
    const step = { duration: 50 };
    dx.set(
      withSequence(
        withTiming(-space.sm, step),
        withTiming(space.sm, step),
        withTiming(-space.xs, step),
        withTiming(0, step),
      ),
    );
  }, [w.shake]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: drop.get(),
    transform: [
      { translateX: dx.get() },
      { translateY: (1 - drop.get()) * -space['2xl'] },
      { scale: scale.get() * (0.6 + 0.4 * drop.get()) },
    ],
  }));
  return (
    <Animated.View style={[style, hidden ? styles.hidden : null]}>
      <View style={selected ? styles.lifted : null}>
        <Plant level={w.lv} px={px} />
      </View>
    </Animated.View>
  );
}

/** One ghost layer per plant kind, so the UI thread can show the right one without React. */
function GhostLayer({ level, kind, px }: { level: SharedValue<number>; kind: Level; px: number }) {
  const style = useAnimatedStyle(() => ({ opacity: level.get() === kind ? 1 : 0 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.centre, style]}>
      <Plant level={kind} px={px} />
    </Animated.View>
  );
}

export default function MergeGardenRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const gap = space.sm;
  const pillRow = size.button.md;
  const goalTop = pillRow + space.md;
  // Four wells across, or whatever fits under the goal row.
  const cell = Math.min(
    (W - gap * (GARDEN_COLS - 1)) / GARDEN_COLS,
    (H - goalTop - space.xl - gap * (GARDEN_COLS - 1)) / (GARDEN_COLS + SLOT),
    MAX_CELL,
  );
  const step = cell + gap;
  const gridW = cell * GARDEN_COLS + gap * (GARDEN_COLS - 1);
  const slot = cell * SLOT;
  const gridLeft = (W - gridW) / 2;
  const below = goalTop + slot + space.xl;
  const gridTop = below + Math.max(0, (H - below - gridW) / 3);
  const slotsW = slot * GARDEN_GOAL + space.md * (GARDEN_GOAL - 1);
  const slotsLeft = (W - slotsW) / 2;

  const garden = useMemo(() => startGarden(seed), [seed]);
  const board = useRef<Level[]>(garden.cells);
  const nextId = useRef(garden.cells.length);
  const [wells, setWells] = useState<WellState[]>(() =>
    garden.cells.map((lv, i) => ({ lv, id: i, anim: 'drop', shake: 0 })),
  );
  const [held, setHeld] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [goals, setGoals] = useState(0);
  const sel = useRef<number | null>(null);
  const input = useRef<Move | null>(null);
  const open = useRef(false);

  // UI-thread state for the drag ghost and the flower flying to the goal row.
  const levels = useSharedValue<number[]>([...garden.cells]);
  const live = useSharedValue(false);
  const geo = useSharedValue({ step, gap, cols: GARDEN_COLS });
  useEffect(() => {
    geo.set({ step, gap, cols: GARDEN_COLS });
  }, [geo, step, gap]);
  const from = useSharedValue(-1);
  const lifted = useSharedValue(false);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  const gOn = useSharedValue(0);
  const gScale = useSharedValue(1);
  const gLevel = useSharedValue(0);
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  const fOn = useSharedValue(0);
  const fScale = useSharedValue(1);
  const ghostStyle = useAnimatedStyle(() => ({
    opacity: gOn.get(),
    transform: [
      { translateX: gx.get() - cell / 2 },
      { translateY: gy.get() - cell / 2 },
      { scale: gScale.get() },
    ],
  }));
  const flyStyle = useAnimatedStyle(() => ({
    opacity: fOn.get(),
    transform: [
      { translateX: fx.get() - cell / 2 },
      { translateY: fy.get() - cell / 2 },
      { scale: fScale.get() },
    ],
  }));

  const d = (ms: number) => (api.reducedMotion ? 0 : ms);
  /** Well centre in grid coordinates. */
  const centre = (i: number) => ({
    x: (i % GARDEN_COLS) * step + cell / 2,
    y: Math.floor(i / GARDEN_COLS) * step + cell / 2,
  });
  const setWell = (i: number, lv: Level, anim: Anim = 'none') => {
    const id = nextId.current++;
    setWells((p) => p.map((w, k) => (k === i ? { lv, id, anim, shake: 0 } : w)));
  };
  const shakeWell = (i: number) =>
    setWells((p) => p.map((w, k) => (k === i ? { ...w, shake: w.shake + 1 } : w)));
  const select = (i: number | null) => {
    sel.current = i;
    setSelected(i);
  };

  // Gesture callbacks (JS thread); stable functions that read the latest render's handlers.
  const handlers = useRef({
    lift: (_i: number) => {},
    drop: (_i: number, _to: number) => {},
    tap: (_i: number) => {},
  });
  const onTap = (i: number) => {
    if (!open.current || input.current) return;
    api.haptic('tap');
    api.sound('tap');
    const s = sel.current;
    if (s === null) {
      if (board.current[i]! > 0) {
        select(i);
        api.hint(t('games.mergeGarden.pickMatch'));
      }
    } else if (s === i) {
      select(null);
      api.hint(t('games.mergeGarden.hint'));
    } else {
      select(null);
      input.current = { from: s, to: i, drag: false };
    }
  };
  handlers.current = {
    tap: onTap,
    lift: (i) => {
      select(null);
      setHeld(i);
      api.haptic('tap');
      api.sound('tap');
      api.hint(t('games.mergeGarden.hint'));
    },
    drop: (i, to) => {
      if (open.current && !input.current) input.current = { from: i, to, drag: true };
      else {
        gOn.set(0);
        setHeld(null);
      }
    },
  };
  const lift = useCallback((i: number) => handlers.current.lift(i), []);
  const drop = useCallback((i: number, to: number) => handlers.current.drop(i, to), []);
  const tap = useCallback((i: number) => handlers.current.tap(i), []);

  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      const g = geo.get();
      const c = Math.floor((e.x + g.gap / 2) / g.step);
      const r = Math.floor((e.y + g.gap / 2) / g.step);
      from.set(c >= 0 && r >= 0 && c < g.cols && r < g.cols ? r * g.cols + c : -1);
      lifted.set(false);
      sx.set(e.x);
      sy.set(e.y);
    },
    onUpdate: (e) => {
      'worklet';
      const i = from.get();
      if (i < 0) return;
      if (!lifted.get()) {
        const dx = e.x - sx.get();
        const dy = e.y - sy.get();
        if (dx * dx + dy * dy < LIFT_DP * LIFT_DP) return;
        const lv = levels.get()[i] ?? 0;
        if (!live.get() || lv === 0) {
          from.set(-1);
          return;
        }
        lifted.set(true);
        gLevel.set(lv);
        gScale.set(1.12);
        gOn.set(1);
        scheduleOnRN(lift, i);
      }
      gx.set(e.x);
      gy.set(e.y);
    },
    onFinalize: () => {
      'worklet';
      const i = from.get();
      from.set(-1);
      if (i < 0) return;
      if (!lifted.get()) {
        scheduleOnRN(tap, i);
        return;
      }
      const g = geo.get();
      const c = Math.floor((gx.get() + g.gap / 2) / g.step);
      const r = Math.floor((gy.get() + g.gap / 2) / g.step);
      const to = c >= 0 && r >= 0 && c < g.cols && r < g.cols ? r * g.cols + c : -1;
      scheduleOnRN(drop, i, to);
    },
  });

  useRoundLoop(api, async () => {
    const { rand } = garden;
    const timer = api.timer(GARDEN_SECONDS);
    api.setRound(t('games.mergeGarden.round'));
    api.hint(t('games.mergeGarden.hint'));
    let moveCount = 0;
    let flowers = 0;
    while (!timer.done() && flowers < GARDEN_GOAL) {
      input.current = null;
      open.current = true;
      live.set(true);
      while (input.current === null && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      live.set(false);
      // Set by the gesture or a tap while we waited (TS narrows the ref to null above).
      const mv = input.current as Move | null;
      if (!mv) break;
      const a = centre(mv.from);
      const back = async () => {
        gx.set(withTiming(a.x, { duration: d(SNAP_MS), easing: FLY }));
        gy.set(withTiming(a.y, { duration: d(SNAP_MS), easing: FLY }));
        await api.wait(d(SNAP_MS));
        gOn.set(0);
        setHeld(null);
      };
      if (mv.drag && mv.to === mv.from) {
        // Put back where it was: not a mistake.
        await back();
        continue;
      }
      if (!canMerge(board.current, mv.from, mv.to)) {
        // Not a match: the plant snaps back to its well; no move is counted.
        if (mv.drag) await back();
        shakeWell(mv.from);
        api.haptic('bad');
        api.sound('bad');
        api.hint(t('games.mergeGarden.noMatch'), 'bad');
        // Tapping a different plant picks that one up instead.
        if (!mv.drag && board.current[mv.to]! > 0) select(mv.to);
        continue;
      }
      api.haptic('tap');
      const b = centre(mv.to);
      const ms = d(mv.drag ? SETTLE_MS : FLY_MS);
      if (!mv.drag) {
        gLevel.set(board.current[mv.from]!);
        gx.set(a.x);
        gy.set(a.y);
        gOn.set(1);
        setHeld(mv.from);
        gScale.set(
          withSequence(withTiming(1.15, { duration: ms / 2 }), withTiming(1, { duration: ms / 2 })),
        );
      } else gScale.set(withTiming(1, { duration: ms }));
      gx.set(withTiming(b.x, { duration: ms, easing: FLY }));
      gy.set(withTiming(b.y, { duration: ms, easing: FLY }));
      await api.wait(ms);

      const m = mergeAt(board.current, mv.from, mv.to);
      moveCount++;
      setMoves(moveCount);
      gOn.set(0);
      setHeld(null);
      setWell(mv.from, 0);
      setWell(mv.to, m.level, 'grow');
      const pts = gardenPoints(m.level);
      const px = gridLeft + b.x;
      const py = gridTop + b.y;
      api.addScore(pts);
      if (m.flower) {
        api.fx.hit(px, py, color.game.pink, pts);
        api.hint(t('games.mergeGarden.flower'), 'good');
        await api.wait(d(FLOWER_HOLD_MS));
        // The flower leaves its well and flies up to the next goal slot.
        setWell(mv.to, 0);
        fx.set(px);
        fy.set(py);
        fScale.set(1);
        fOn.set(1);
        const gxGoal = slotsLeft + flowers * (slot + space.md) + slot / 2;
        const gyGoal = goalTop + slot / 2;
        const fly = { duration: d(GOAL_FLY_MS), easing: FLY };
        fx.set(withTiming(gxGoal, fly));
        fy.set(withTiming(gyGoal, fly));
        fScale.set(withTiming(0.5, fly));
        fOn.set(withTiming(0.2, fly));
        await api.wait(d(GOAL_FLY_MS));
        fOn.set(0);
        flowers++;
        setGoals(flowers);
      } else {
        api.fx.hit(px, py, color.signal.success, pts);
        api.hint(t('games.mergeGarden.sprouted'), 'good');
      }
      board.current = m.cells;
      if (flowers < GARDEN_GOAL) {
        const s = spawnSeeds(board.current, rand);
        board.current = s.cells;
        for (const i of s.spawned) setWell(i, SEED, 'drop');
      }
      levels.set([...board.current]);
      await api.wait(NEXT_MS);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const grown = flowers >= GARDEN_GOAL;
    const movesLabel = t('games.mergeGarden.statMoves', { count: moveCount });
    api.finish({
      title: t(grown ? 'games.mergeGarden.titleGrown' : 'games.mergeGarden.titleNearly'),
      stars: gardenStars(flowers, moveCount),
      stats: [t('games.mergeGarden.statFlowers', { n: flowers, total: GARDEN_GOAL }), movesLabel],
      // Fewer moves is better, so only a grown garden can set a record.
      ...(grown ? { best: { value: moveCount, label: movesLabel } } : {}),
    });
  });

  const plantPx = cell * PLANT;
  return (
    <View style={styles.fill}>
      <View style={[styles.pillRow, { height: pillRow }]}>
        <View style={styles.pill} testID="game.mergeGarden.moves" accessibilityLiveRegion="polite">
          <Text variant="bodyStrong">{t('games.mergeGarden.moves', { n: moves })}</Text>
        </View>
      </View>
      <View
        style={[styles.goalRow, { top: goalTop, left: slotsLeft, width: slotsW, gap: space.md }]}
        accessible
        accessibilityLabel={t('games.mergeGarden.goalRow', { n: goals, total: GARDEN_GOAL })}>
        <View style={[styles.goalLabel, { right: slotsW + space.md, height: slot }]}>
          <Text variant="micro" tone="tertiary">
            {t('games.mergeGarden.goal')}
          </Text>
        </View>
        {Array.from({ length: GARDEN_GOAL }, (_, k) => (
          <View
            key={k}
            testID={`game.mergeGarden.goal${k}`}
            style={[styles.slot, k < goals ? styles.slotOn : null, { width: slot, height: slot }]}>
            {k < goals ? <View style={[StyleSheet.absoluteFill, styles.slotTint]} /> : null}
            {k < goals ? <Plant level={FLOWER} px={slot * SLOT_PLANT} /> : null}
          </View>
        ))}
      </View>
      <GestureDetector gesture={pan}>
        <View
          testID="game.mergeGarden.plot"
          style={[styles.grid, { left: gridLeft, top: gridTop, width: gridW, height: gridW, gap }]}>
          {wells.map((w, i) => {
            const row = Math.floor(i / GARDEN_COLS) + 1;
            const col = (i % GARDEN_COLS) + 1;
            return (
              <View
                key={i}
                testID={`game.mergeGarden.well${i}`}
                accessible
                accessibilityRole="button"
                accessibilityLabel={t('games.mergeGarden.well', {
                  row,
                  col,
                  plant: t(`games.mergeGarden.plants.${PLANT_KEYS[w.lv]}`),
                })}
                accessibilityState={{ selected: selected === i }}
                accessibilityActions={[{ name: 'activate' }]}
                onAccessibilityAction={() => onTap(i)}
                style={[styles.well, { width: cell, height: cell }]}>
                <View style={[StyleSheet.absoluteFill, styles.soil]}>
                  <View style={[StyleSheet.absoluteFill, styles.soilTint]} />
                  <View style={styles.soilShade} />
                </View>
                {selected === i ? (
                  <View style={[StyleSheet.absoluteFill, styles.wellPicked]} />
                ) : null}
                {w.lv > 0 ? (
                  <WellPlant
                    key={w.id}
                    w={w}
                    px={plantPx}
                    hidden={held === i}
                    selected={selected === i}
                    reduced={api.reducedMotion}
                  />
                ) : null}
              </View>
            );
          })}
          <Animated.View
            pointerEvents="none"
            style={[styles.ghost, { width: cell, height: cell }, ghostStyle]}>
            {([SEED, SPROUT] as const).map((k) => (
              <GhostLayer key={k} level={gLevel} kind={k} px={plantPx} />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
      <Animated.View
        pointerEvents="none"
        style={[styles.ghost, styles.centre, { width: cell, height: cell }, flyStyle]}>
        <Plant level={FLOWER} px={plantPx} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pillRow: { alignItems: 'flex-end', justifyContent: 'center' },
  pill: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.controlStrong,
  },
  goalRow: { position: 'absolute', flexDirection: 'row' },
  goalLabel: { position: 'absolute', justifyContent: 'center' },
  slot: {
    borderRadius: radius.md,
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotOn: { borderWidth: 1.5, borderColor: color.game.pink },
  slotTint: { backgroundColor: color.game.pink, opacity: 0.14 },
  grid: { position: 'absolute', flexDirection: 'row', flexWrap: 'wrap' },
  well: { alignItems: 'center', justifyContent: 'center' },
  soil: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
  },
  // Soil brown from the game palette over the dark card; the top shade reads as a recess.
  soilTint: { backgroundColor: color.game.orange, opacity: 0.14 },
  soilShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '22%',
    backgroundColor: color.overlay.scrim,
    opacity: 0.5,
  },
  wellPicked: { borderRadius: radius.lg, borderWidth: 2, borderColor: color.game.mint },
  lifted: { transform: [{ scale: 1.08 }] },
  hidden: { opacity: 0 },
  ghost: { position: 'absolute', left: 0, top: 0 },
  centre: { alignItems: 'center', justifyContent: 'center' },
});
