import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { Text } from '@/design/components';
import { color, motion, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop, Well } from '../../kit';
import type { ContentPack } from '../../kit/content';
import { pickRoundItems } from '../../kit/roundContent';
import pack from './content.json';
import {
  allRanges,
  dragSnap,
  ESCAPE_POINTS,
  gemExit,
  isEscaped,
  moved,
  occupied,
  pickBoardPair,
  pieces,
  slideStars,
  tapSlide,
  SLIDE_BOARDS,
  SLIDE_SECONDS,
  SLIDE_SIZE,
  type Block,
  type SlideBoard,
} from './logic';

const PACK = pack as unknown as ContentPack<SlideBoard>;
const N = SLIDE_SIZE;
const POLL_MS = 40;
/** Prototype proportions, as fractions of a cell (46 px there): board lip 6, piece gap 3. */
const INSET = 0.13;
const GAP = 0.065;
const EXIT_GAP = 0.1;
const EXIT_W = 0.22;
/** Finger travel (in cells) under which a touch is a tap, not a drag. */
const TAP_SLOP = 0.22;
/** How far a blocked piece nudges before it settles back (in cells). */
const BUMP = 0.12;
const SNAP_MS = motion.duration.instant;
/** Prototype: the gem slides out over 500 ms, then the burst. */
const ESCAPE_MS = 500;

/** What the drag worklet needs to know about the board; JS pushes it after every move. */
type Geo = { occ: number[]; lo: number[]; hi: number[]; across: boolean[]; open: boolean };
const CLOSED: Geo = { occ: [], lo: [], hi: [], across: [], open: false };

function geoOf(ps: readonly Block[], open: boolean): Geo {
  const r = allRanges(ps);
  return {
    occ: occupied(ps),
    lo: r.map((x) => x[0]),
    hi: r.map((x) => x[1]),
    across: ps.map((p) => p.d === 'h'),
    open,
  };
}

export default function SlideEscapeRound({ api, seed }: RoundProps) {
  const t = useT();
  const reduced = api.reducedMotion;
  const W = api.board.width;
  const H = api.board.height;
  // Board plus the exit slot on both sides (kept symmetric so the board sits centred).
  const cell = Math.floor(
    Math.min(W / (N + 2 * INSET + 2 * (EXIT_GAP + EXIT_W) + 0.2), (H * 0.74) / (N + 2 * INSET)),
  );
  const inset = Math.round(cell * INSET);
  const gap = Math.round(cell * GAP);
  const side = N * cell + inset * 2;
  const bx = (W - side) / 2;
  const by = Math.max(0, (H - side) / 2 - space.xl);
  const exitW = Math.max(space.xs, Math.round(cell * EXIT_W));
  const exitX = side + Math.round(cell * EXIT_GAP);

  const [board, setBoard] = useState<SlideBoard | null>(null);
  const [ps, setPs] = useState<Block[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const psRef = useRef<Block[]>([]);
  const selRef = useRef<number | null>(null);
  const open = useRef(false);
  const escaped = useRef(false);
  const moves = useRef(0);

  // UI-thread state: each piece's position along its axis (cells), the piece being dragged
  // (or settling) and its pixel offset, and the gem's exit run.
  const geo = useSharedValue<Geo>(CLOSED);
  const pos = useSharedValue<number[]>([]);
  const di = useSharedValue(-1);
  const dpx = useSharedValue(0);
  const gemOut = useSharedValue(0);
  const grab = useSharedValue(-1);
  const grabBase = useSharedValue(0);
  const raw = useSharedValue(0);
  const startCell = useSharedValue(-1);
  // Where the finger landed: Pan translation starts at activation, not at touch-down.
  const downX = useSharedValue(0);
  const downY = useSharedValue(0);
  const travel = useSharedValue(0);

  const select = (i: number | null) => {
    selRef.current = i;
    setSel(i);
  };
  const baseHint = () => {
    api.hint(t('games.slideEscape.hint'));
  };

  /** A slide happened (the drag worklet or `slideTo` already moved it on screen). */
  const commit = (i: number, by: number) => {
    const next = moved(psRef.current, i, by);
    psRef.current = next;
    setPs(next);
    select(null);
    moves.current++;
    api.haptic('tap');
    api.sound('tap');
    baseHint();
    const out = isEscaped(next);
    if (out) {
      open.current = false;
      escaped.current = true;
    }
    geo.set(geoOf(next, !out));
  };

  /** "A block that can't move bumps and stays": the attempt counts as a move. */
  const bump = (i: number, dir: 1 | -1) => {
    moves.current++;
    api.fx.oops();
    api.hint(t('games.slideEscape.blocked'), 'bad');
    if (reduced) return;
    const nudge = dir * cell * BUMP;
    scheduleOnUI(() => {
      'worklet';
      di.set(i);
      cancelAnimation(dpx);
      dpx.set(
        withSequence(
          withTiming(nudge, { duration: motion.duration.instant / 2 }),
          withTiming(0, { duration: motion.duration.instant }),
        ),
      );
    });
  };

  /** Tap path: animate piece i by `by` cells, then commit. */
  const slideTo = (i: number, by: number) => {
    const from = -by * cell;
    scheduleOnUI(() => {
      'worklet';
      const next = pos.get().slice();
      next[i] = (next[i] ?? 0) + by;
      pos.set(next);
      di.set(i);
      cancelAnimation(dpx);
      dpx.set(reduced ? 0 : from);
      if (!reduced) dpx.set(withTiming(0, { duration: motion.duration.fast }));
    });
    commit(i, by);
  };

  const onTap = (cellIdx: number) => {
    if (!open.current) return;
    const cur = psRef.current;
    const r = Math.floor(cellIdx / N);
    const c = cellIdx % N;
    const p = occupied(cur)[cellIdx] ?? -1;
    if (p >= 0) {
      // The gem goes straight out when its path is clear.
      const ex = p === 0 ? gemExit(cur) : null;
      if (ex !== null) return slideTo(0, ex);
      api.haptic('tap');
      if (selRef.current === p) {
        select(null);
        return baseHint();
      }
      api.sound('tap');
      select(p);
      return api.hint(t('games.slideEscape.pickSpot'));
    }
    const s = selRef.current;
    if (s === null) return;
    const res = tapSlide(cur, s, r, c);
    if (res.kind === 'off') return api.hint(t('games.slideEscape.inLine'));
    select(null);
    if (res.kind === 'blocked') return bump(s, res.dir);
    slideTo(s, res.by);
  };

  const onDragged = (i: number, by: number, push: 0 | 1 | -1) => {
    if (!open.current) return;
    select(null);
    if (by) commit(i, by);
    else if (push) bump(i, push);
  };

  // Stable entry points for the worklet (it captures them once).
  const tapRef = useRef(onTap);
  const dragRef = useRef(onDragged);
  useEffect(() => {
    tapRef.current = onTap;
    dragRef.current = onDragged;
  });
  const tapJS = useCallback((i: number) => tapRef.current(i), []);
  const dragJS = useCallback((i: number, b: number, p: 0 | 1 | -1) => dragRef.current(i, b, p), []);

  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      travel.set(0);
      grab.set(-1);
      startCell.set(-1);
      downX.set(e.x);
      downY.set(e.y);
      const g = geo.get();
      if (!g.open) return;
      const c = Math.floor((e.x - inset) / cell);
      const r = Math.floor((e.y - inset) / cell);
      if (c < 0 || r < 0 || c >= N || r >= N) return;
      startCell.set(r * N + c);
      const p = g.occ[r * N + c] ?? -1;
      if (p < 0) return;
      // Picking up a piece that is still settling keeps its current offset.
      grabBase.set(di.get() === p ? dpx.get() : 0);
      cancelAnimation(dpx);
      di.set(p);
      dpx.set(grabBase.get());
      raw.set(grabBase.get());
      grab.set(p);
    },
    onUpdate: (e) => {
      'worklet';
      const tx = e.x - downX.get();
      const ty = e.y - downY.get();
      travel.set(Math.max(travel.get(), Math.abs(tx) + Math.abs(ty)));
      const p = grab.get();
      if (p < 0) return;
      const g = geo.get();
      const v = grabBase.get() + (g.across[p] ? tx : ty);
      raw.set(v);
      dpx.set(Math.max((g.lo[p] ?? 0) * cell, Math.min((g.hi[p] ?? 0) * cell, v)));
    },
    onFinalize: () => {
      'worklet';
      const p = grab.get();
      const sc = startCell.get();
      grab.set(-1);
      startCell.set(-1);
      if (sc < 0) return;
      const settle = () => {
        dpx.set(reduced ? 0 : withTiming(0, { duration: SNAP_MS }));
      };
      if (travel.get() < cell * TAP_SLOP) {
        if (p >= 0) settle();
        scheduleOnRN(tapJS, sc);
        return;
      }
      if (p < 0) return;
      const g = geo.get();
      const snap = dragSnap(raw.get() / cell, g.lo[p] ?? 0, g.hi[p] ?? 0);
      if (snap.by !== 0) {
        const next = pos.get().slice();
        next[p] = (next[p] ?? 0) + snap.by;
        pos.set(next);
        dpx.set(dpx.get() - snap.by * cell);
        // Closed until JS has the new board.
        geo.set({ ...g, open: false });
      }
      settle();
      scheduleOnRN(dragJS, p, snap.by, snap.bump);
    },
  });

  useRoundLoop(api, async () => {
    const boards = pickBoardPair(pickRoundItems('slideEscape', PACK, seed, PACK.items.length));
    const timer = api.timer(SLIDE_SECONDS);
    let esc = 0;
    for (const [bi, b] of boards.entries()) {
      if (timer.done()) break;
      api.setRound(t('games.slideEscape.board', { n: bi + 1, total: SLIDE_BOARDS }));
      const start = pieces(b.gem, b.blocks);
      const at = start.map((p) => (p.d === 'h' ? p.c : p.r));
      scheduleOnUI(() => {
        'worklet';
        cancelAnimation(dpx);
        cancelAnimation(gemOut);
        pos.set(at);
        di.set(-1);
        dpx.set(0);
        gemOut.set(0);
      });
      psRef.current = start;
      escaped.current = false;
      select(null);
      setPs(start);
      setBoard(b);
      geo.set(geoOf(start, true));
      open.current = true;
      baseHint();
      while (!escaped.current && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      geo.set(CLOSED);
      if (!escaped.current) break;
      // The gem slides out through the slot and springs off the board.
      const run = side - inset + exitW + cell * 2;
      gemOut.set(
        reduced
          ? run
          : withTiming(run, { duration: ESCAPE_MS, easing: Easing.bezier(...motion.easing.pop) }),
      );
      await api.wait(reduced ? 0 : ESCAPE_MS);
      esc++;
      api.combo(esc);
      const x = bx + exitX + exitW / 2;
      const y = by + inset + b.gem[0] * cell + cell / 2;
      api.fx.burst(x, y, color.game.mint, 16);
      api.fx.ring(x, y, color.signal.successText, 100);
      api.addScore(ESCAPE_POINTS);
      api.fx.toast(t('games.slideEscape.escaped'), color.signal.successText);
      await api.wait(1100);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    const mv = moves.current;
    const statMoves = t('games.slideEscape.statMoves', { count: mv });
    api.finish({
      title: esc ? t('games.slideEscape.title') : t('games.slideEscape.titleStuck'),
      stars: slideStars(esc),
      stats: [t('games.slideEscape.statBoards', { n: esc, total: SLIDE_BOARDS }), statMoves],
      // Fewer is better, so only a round that got both gems out can set a record.
      ...(esc === SLIDE_BOARDS ? { best: { value: mv, label: statMoves } } : {}),
      items: boards.map((x) => x.id),
    });
  });

  const occ = occupied(ps);
  const label = (p: Block, i: number) =>
    i === 0
      ? t('games.slideEscape.a11yGem', { row: p.r + 1 })
      : p.d === 'h'
        ? t('games.slideEscape.a11yAcross', { row: p.r + 1, from: p.c + 1, to: p.c + p.len })
        : t('games.slideEscape.a11yDown', { col: p.c + 1, from: p.r + 1, to: p.r + p.len });

  return (
    <View style={styles.fill}>
      <GestureDetector gesture={pan}>
        <View style={[styles.abs, { left: bx, top: by, width: side, height: side }]}>
          <Well style={{ width: side, height: side }}>
            <View style={styles.tint} />
            {occ.map((p, k) => (
              <View
                key={k}
                testID={`game.slideEscape.cell${k}`}
                accessible={p < 0}
                accessibilityRole="button"
                accessibilityLabel={t('games.slideEscape.a11yCell', {
                  row: Math.floor(k / N) + 1,
                  col: (k % N) + 1,
                })}
                accessibilityActions={[{ name: 'activate' }]}
                onAccessibilityAction={() => onTap(k)}
                style={[
                  styles.rail,
                  {
                    left: inset + (k % N) * cell + gap,
                    top: inset + Math.floor(k / N) * cell + gap,
                    width: cell - gap * 2,
                    height: cell - gap * 2,
                  },
                ]}
              />
            ))}
          </Well>
          {board ? (
            <View
              pointerEvents="none"
              accessible
              accessibilityLabel={t('games.slideEscape.a11yExit', { row: board.gem[0] + 1 })}
              style={[
                styles.exit,
                { left: exitX, top: inset + board.gem[0] * cell, width: exitW, height: cell },
              ]}>
              <View style={styles.exitGlow} />
            </View>
          ) : null}
          {board
            ? ps.map((p, i) => (
                <Piece
                  key={`${board.id}-${i}`}
                  i={i}
                  piece={p}
                  cell={cell}
                  inset={inset}
                  gap={gap}
                  run={side}
                  pos={pos}
                  di={di}
                  dpx={dpx}
                  gemOut={gemOut}
                  selected={sel === i}
                  label={label(p, i)}
                  onPress={() => onTap(p.r * N + p.c)}
                />
              ))
            : null}
        </View>
      </GestureDetector>
      {board ? (
        <View style={[styles.caption, { top: by + side + space.md }]} pointerEvents="none">
          <Text variant="micro" tone="tertiary">
            {t('games.slideEscape.fewest', { count: board.minMoves })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** One block or the gem: graphite (or mint Candy) face, darker lip, top highlight, grip. */
function Piece({
  i,
  piece,
  cell,
  inset,
  gap,
  run,
  pos,
  di,
  dpx,
  gemOut,
  selected,
  label,
  onPress,
}: {
  i: number;
  piece: Block;
  cell: number;
  inset: number;
  gap: number;
  run: number;
  pos: SharedValue<number[]>;
  di: SharedValue<number>;
  dpx: SharedValue<number>;
  gemOut: SharedValue<number>;
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const gem = i === 0;
  const across = piece.d === 'h';
  const start = across ? piece.c : piece.r;
  const style = useAnimatedStyle(() => {
    const a = (pos.get()[i] ?? start) * cell + (di.get() === i ? dpx.get() : 0);
    const out = gem ? gemOut.get() : 0;
    return {
      opacity: gem ? interpolate(out, [0, run * 0.6, run], [1, 1, 0], 'clamp') : 1,
      transform: [{ translateX: across ? a + out : 0 }, { translateY: across ? 0 : a }],
    };
  });
  const w = (across ? piece.len : 1) * cell - gap * 2;
  const h = (across ? 1 : piece.len) * cell - gap * 2;
  return (
    <Animated.View
      testID={gem ? 'game.slideEscape.gem' : `game.slideEscape.block${i}`}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onPress}
      style={[
        styles.abs,
        {
          left: inset + gap + (across ? 0 : piece.c * cell),
          top: inset + gap + (across ? piece.r * cell : 0),
          width: w,
          height: h,
        },
        gem ? styles.above : null,
        style,
      ]}>
      {gem ? <View style={styles.gemGlow} /> : null}
      <View
        style={[
          styles.face,
          gem ? styles.gemFace : styles.blockFace,
          selected ? styles.selected : null,
        ]}>
        <View style={styles.lip} />
        <View style={[styles.shine, gem ? styles.gemShine : null]} />
        {gem ? null : <View style={[styles.grip, { width: Math.min(w, h) * 0.4 }]} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  abs: { position: 'absolute' },
  above: { zIndex: 2 },
  tint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: color.game.mint,
    opacity: 0.06,
  },
  rail: {
    position: 'absolute',
    borderRadius: radius.md,
    backgroundColor: color.bg.ink,
    opacity: 0.6,
  },
  exit: { position: 'absolute', borderRadius: radius.pill, backgroundColor: color.game.mint },
  exitGlow: {
    position: 'absolute',
    left: -space.xs,
    right: -space.xs,
    top: -space.xs,
    bottom: -space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.game.mint,
    opacity: 0.25,
  },
  face: { flex: 1, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center' },
  blockFace: {
    backgroundColor: color.surface.controlStrong,
    borderWidth: 1,
    borderColor: color.surface.ring,
  },
  gemFace: { backgroundColor: color.game.mint, borderRadius: radius.lg },
  selected: { borderWidth: 2, borderColor: color.text.primary },
  gemGlow: {
    position: 'absolute',
    left: -space.sm,
    right: -space.sm,
    top: -space.sm,
    bottom: -space.sm,
    borderRadius: radius['3xl'],
    backgroundColor: color.game.mint,
    opacity: 0.22,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '16%',
    backgroundColor: color.overlay.scrim,
    opacity: 0.45,
  },
  shine: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '6%',
    height: '14%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.08,
  },
  gemShine: { opacity: 0.3 },
  grip: {
    marginTop: space.sm,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: color.text.quiet,
  },
  caption: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
