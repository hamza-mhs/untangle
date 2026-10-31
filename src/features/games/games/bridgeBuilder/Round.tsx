import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop, Well } from '../../kit';
import {
  beamDip,
  BRIDGE_COUNT,
  BRIDGE_SECONDS,
  bridgeLevel,
  bridgeStars,
  CROSS_POINTS,
  deckUnits,
  DECK_MAX_UNITS,
  FIT_POINTS,
  fits,
  hitRect,
  misfitKind,
  nearestGap,
  trayLayout,
  waveAngle,
  type BridgeLevel,
  type Rect,
} from './logic';
import { PipPlaceholder } from './PipPlaceholder';

const POLL_MS = 30;
/** Tap path: the beam flies from the tray to the gap (prototype 420 ms). */
const FLY_MS = 420;
/** Drag path: the dropped beam settles into the gap. */
const SNAP_MS = 120;
const SHAKE_MS = 400;
const BACK_MS = 300;
/** Pip's walk across (prototype 2400 ms) and wave (800 ms). */
const WALK_MS = 2400;
const WAVE_MS = 800;
/** Finger travel (dp) that turns a touch into a drag. */
const MOVE_DP = 8;
/** Extra reach around a tray beam for grabbing it. */
const GRAB_SLOP = space.sm;
/** Pip's feet sit at y = 31 of the 34 box. */
const PIP_FEET = 31 / 34;

type Attempt = { beam: number; gap: number; dragged: boolean };

/** Board layout for one bridge (prototype stage: cliffs, deck, water, tray below). */
function geometry(level: BridgeLevel, W: number, H: number) {
  const edge = space['3xl'];
  const unit = (W - edge * 2) / DECK_MAX_UNITS;
  const beamH = Math.round(unit * 0.72);
  const pip = Math.round(size.touch * 0.8);
  const deckW = deckUnits(level) * unit;
  const deckL = (W - deckW) / 2;
  const deckY = Math.max(pip + space['4xl'], Math.round(H * 0.28));
  let x = deckL;
  const slots: Rect[] = level.gaps.map((g) => {
    const r = { x, y: deckY, w: g * unit, h: beamH };
    x += g * unit;
    return r;
  });
  const waterTop = deckY + beamH;
  const waterBottom = waterTop + Math.round(H * 0.16);
  const trayTop = waterBottom + space['2xl'];
  const pad = space.lg;
  const rowH = beamH + space.lg;
  const tray = trayLayout(level.tray, unit, W - pad * 2, space.md, rowH);
  const homes: Rect[] = level.tray.map((len, i) => ({
    x: pad + tray.pos[i]!.x,
    y: trayTop + pad + tray.pos[i]!.y,
    w: len * unit,
    h: beamH,
  }));
  const trayH = pad * 2 + tray.rows * rowH - space.lg;
  const pipY = deckY - pip * PIP_FEET;
  return {
    unit,
    beamH,
    pip,
    deckL,
    deckR: deckL + deckW,
    deckY,
    slots,
    waterTop,
    waterBottom,
    trayTop,
    trayH,
    homes,
    pipY,
    pipStart: Math.max(0, deckL - pip - space.xs),
    pipEnd: Math.min(W - pip, deckL + deckW + space.xs),
  };
}

export default function BridgeBuilderRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const H = api.board.height;
  const rm = api.reducedMotion;
  const [level, setLevel] = useState<BridgeLevel | null>(null);
  const [placed, setPlaced] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [lifted, setLifted] = useState<number | null>(null);
  const placedRef = useRef<(number | null)[]>([]);
  const selectedRef = useRef<number | null>(null);
  const levelRef = useRef<BridgeLevel | null>(null);
  const pending = useRef<Attempt | null>(null);
  const open = useRef(false);
  const walk = useRef<number | null>(null);
  const waveFrom = useRef<number | null>(null);

  // Drag state, read on the UI thread: which beam follows the finger and by how much.
  const locked = useSharedValue(true);
  const homes = useSharedValue<Rect[]>([]);
  const used = useSharedValue<boolean[]>([]);
  const grab = useSharedValue(-1);
  const moved = useSharedValue(false);
  const downX = useSharedValue(0);
  const downY = useSharedValue(0);
  const dragId = useSharedValue(-1);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const shake = useSharedValue(0);
  const dips = useSharedValue<number[]>([]);
  const pipX = useSharedValue(0);
  const pipY = useSharedValue(0);
  const wave = useSharedValue(0);

  const geo = level ? geometry(level, W, H) : null;
  const pipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pipX.get() }, { translateY: pipY.get() }],
  }));

  const select = (i: number | null) => {
    selectedRef.current = i;
    setSelected(i);
  };
  const lock = () => {
    open.current = false;
    locked.set(true);
  };
  const takePending = () => {
    const a = pending.current;
    pending.current = null;
    return a;
  };

  /** Tap (or TalkBack) on a tray beam: pick it up, or put it back down. */
  const tapBeam = (i: number) => {
    if (!open.current || placedRef.current.includes(i)) return;
    api.haptic('tap');
    api.sound('tap');
    select(selectedRef.current === i ? null : i);
  };
  /** Tap on a gap: the selected beam goes there. */
  const tapGap = (g: number) => {
    if (!open.current || placedRef.current[g] !== null) return;
    const b = selectedRef.current;
    if (b === null) {
      api.hint(t('games.bridgeBuilder.pickBeam'));
      return;
    }
    api.haptic('tap');
    api.sound('tap');
    lock();
    pending.current = { beam: b, gap: g, dragged: false };
  };

  const handlers = useRef({
    pick: (_i: number) => {},
    drop: (_i: number, _x: number, _y: number) => {},
    tap: (_x: number, _y: number) => {},
  });
  useEffect(() => {
    handlers.current = {
      pick: (i) => {
        if (!open.current) return;
        api.haptic('tap');
        api.sound('tap');
        select(i);
        setLifted(i);
      },
      drop: (i, tx, ty) => {
        const L = levelRef.current;
        if (!L || !open.current) {
          // Time ran out mid-drag: put the beam back.
          if (dragId.get() === i) {
            dragId.set(-1);
            dx.set(0);
            dy.set(0);
          }
          return;
        }
        const g = geometry(L, W, H);
        const home = g.homes[i]!;
        const cx = home.x + home.w / 2 + tx;
        const cy = home.y + home.h / 2 + ty;
        const filled = placedRef.current.map((p) => p !== null);
        const gap = cy < g.trayTop ? nearestGap(g.slots, filled, cx, cy, g.unit * 4) : -1;
        if (gap >= 0) {
          lock();
          pending.current = { beam: i, gap, dragged: true };
          return;
        }
        // Not near a gap: back to the tray, no penalty.
        select(null);
        setLifted(null);
        const back = rm ? 0 : BACK_MS;
        dx.set(withTiming(0, { duration: back }));
        dy.set(
          withTiming(0, { duration: back }, (done) => {
            'worklet';
            if (done && dragId.get() === i) dragId.set(-1);
          }),
        );
      },
      tap: (x, y) => {
        const L = levelRef.current;
        if (!L || !open.current) return;
        const g = geometry(L, W, H);
        const b = hitRect(g.homes, x, y, GRAB_SLOP);
        if (b >= 0 && !placedRef.current.includes(b)) return tapBeam(b);
        const s = hitRect(g.slots, x, y, space.lg);
        if (s >= 0) return tapGap(s);
        if (selectedRef.current !== null) select(null);
      },
    };
  });
  const onPick = useCallback((i: number) => handlers.current.pick(i), []);
  const onDrop = useCallback(
    (i: number, x: number, y: number) => handlers.current.drop(i, x, y),
    [],
  );
  const onTap = useCallback((x: number, y: number) => handlers.current.tap(x, y), []);

  // One Pan over the board: a touch on a tray beam drags it; a touch that barely moves is a tap.
  const pan = usePanGesture({
    minDistance: 0,
    maxPointers: 1,
    onBegin: (e) => {
      'worklet';
      moved.set(false);
      downX.set(e.x);
      downY.set(e.y);
      grab.set(-1);
      if (locked.get()) return;
      const list = homes.get();
      const taken = used.get();
      for (let i = 0; i < list.length; i++) {
        const r = list[i]!;
        const s = GRAB_SLOP;
        if (
          !taken[i] &&
          e.x >= r.x - s &&
          e.x <= r.x + r.w + s &&
          e.y >= r.y - s &&
          e.y <= r.y + r.h + s
        )
          grab.set(i);
      }
    },
    onUpdate: (e) => {
      'worklet';
      if (!moved.get()) {
        if (Math.hypot(e.x - downX.get(), e.y - downY.get()) < MOVE_DP) return;
        moved.set(true);
        const g = grab.get();
        if (g >= 0 && !locked.get()) {
          dragId.set(g);
          scheduleOnRN(onPick, g);
        } else grab.set(-1);
      }
      if (grab.get() >= 0) {
        // Measured from touch-down: Pan translation starts at activation.
        dx.set(e.x - downX.get());
        dy.set(e.y - downY.get());
      }
    },
    onFinalize: () => {
      'worklet';
      const g = grab.get();
      if (!moved.get()) scheduleOnRN(onTap, downX.get(), downY.get());
      else if (g >= 0) scheduleOnRN(onDrop, g, dx.get(), dy.get());
      grab.set(-1);
      moved.set(false);
    },
  });

  // Pip's walk and wave run on the game clock, so pausing freezes them.
  useFrame(api, (now) => {
    const L = levelRef.current;
    const from = walk.current;
    if (L && from !== null) {
      const g = geometry(L, W, H);
      const p = Math.min(1, (now - from) / WALK_MS);
      const x = g.pipStart + (g.pipEnd - g.pipStart) * p;
      const c = x + g.pip / 2;
      const d = g.slots.map((s) => beamDip(c, s.x, s.w, space.xs));
      dips.set(d);
      const bob = Math.abs(Math.sin(p * 18)) * space.xs;
      pipX.set(x);
      pipY.set(g.pipY + Math.max(0, ...d) - bob);
    }
    const w = waveFrom.current;
    if (w !== null) {
      const q = (now - w) / WAVE_MS;
      wave.set(waveAngle(q));
      if (q >= 1) waveFrom.current = null;
    }
  });

  useRoundLoop(api, async () => {
    const timer = api.timer(BRIDGE_SECONDS);
    let built = 0;
    let misfit = 0;
    let streak = 0;
    api.combo(0);
    for (let li = 0; li < BRIDGE_COUNT && !timer.done(); li++) {
      api.setRound(t('games.bridgeBuilder.bridgeOf', { n: li + 1, total: BRIDGE_COUNT }));
      const L = bridgeLevel(seed, li);
      const g = geometry(L, W, H);
      levelRef.current = L;
      placedRef.current = L.gaps.map(() => null);
      pending.current = null;
      homes.set(g.homes);
      used.set(L.tray.map(() => false));
      dips.set(L.gaps.map(() => 0));
      dragId.set(-1);
      dx.set(0);
      dy.set(0);
      pipX.set(g.pipStart);
      pipY.set(g.pipY);
      wave.set(0);
      setLevel(L);
      setPlaced(placedRef.current);
      setLifted(null);
      select(null);
      api.hint(t('games.bridgeBuilder.hint'));
      await api.wait(li === 0 ? 300 : 700);
      open.current = true;
      locked.set(false);

      while (!timer.done() && placedRef.current.includes(null)) {
        // Read through a call: TS would otherwise keep the `null` narrowing from the reset above.
        const a = takePending();
        if (!a) {
          await api.wait(POLL_MS);
          continue;
        }
        setLifted(a.beam);
        const home = g.homes[a.beam]!;
        const slot = g.slots[a.gap]!;
        const ox = slot.x - home.x;
        const oy = slot.y - home.y;
        const fly = rm ? 0 : a.dragged ? SNAP_MS : FLY_MS;
        dragId.set(a.beam);
        dx.set(withTiming(ox, { duration: fly }));
        dy.set(withTiming(oy, { duration: fly }));
        await api.wait(fly);
        const len = L.tray[a.beam]!;
        const gap = L.gaps[a.gap]!;
        if (fits(len, gap)) {
          placedRef.current = placedRef.current.map((p, i) => (i === a.gap ? a.beam : p));
          used.set(L.tray.map((_, i) => placedRef.current.includes(i)));
          setPlaced(placedRef.current);
          dragId.set(-1);
          dx.set(0);
          dy.set(0);
          streak++;
          api.combo(streak);
          api.addScore(FIT_POINTS);
          api.fx.hit(slot.x + slot.w / 2, slot.y + slot.h / 2, color.game.sun, FIT_POINTS);
          api.hint(t('games.bridgeBuilder.fits'), 'good');
        } else {
          misfit++;
          streak = 0;
          api.combo(0);
          api.fx.oops();
          api.hint(
            t(
              misfitKind(len, gap) === 'short'
                ? 'games.bridgeBuilder.tooShort'
                : 'games.bridgeBuilder.tooLong',
            ),
            'bad',
          );
          if (!rm) {
            const s = space.xs;
            shake.set(
              withSequence(
                withTiming(-s, { duration: SHAKE_MS / 6 }),
                withTiming(s, { duration: SHAKE_MS / 3 }),
                withTiming(-s, { duration: SHAKE_MS / 3 }),
                withTiming(0, { duration: SHAKE_MS / 6 }),
              ),
            );
            await api.wait(SHAKE_MS);
          }
          const back = rm ? 0 : BACK_MS;
          dx.set(withTiming(0, { duration: back }));
          dy.set(withTiming(0, { duration: back }));
          await api.wait(back);
          dragId.set(-1);
        }
        setLifted(null);
        select(null);
        if (placedRef.current.includes(null)) {
          open.current = true;
          locked.set(false);
        }
      }
      lock();
      if (placedRef.current.includes(null)) break;

      // Every gap filled: Pip crosses, the deck dipping under it, then waves.
      api.hint(t('games.bridgeBuilder.here'));
      if (!rm) {
        await api.wait(300);
        walk.current = api.clock.now();
        await api.wait(WALK_MS);
        walk.current = null;
      }
      dips.set(L.gaps.map(() => 0));
      pipX.set(g.pipEnd);
      pipY.set(g.pipY);
      if (!rm) waveFrom.current = api.clock.now();
      built++;
      const px = g.pipEnd + g.pip / 2;
      const py = g.pipY + g.pip / 2;
      api.fx.burst(px, py, color.signal.successText, 14);
      api.fx.float(px, py - g.pip / 2, `+${CROSS_POINTS}`);
      api.addScore(CROSS_POINTS);
      api.hint(t('games.bridgeBuilder.madeIt'), 'good');
      await api.wait(1100);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const misfits = t('games.bridgeBuilder.statMisfits', { count: misfit });
    api.finish({
      title: built ? t('games.bridgeBuilder.title') : t('games.bridgeBuilder.titleNone'),
      stars: bridgeStars(built, misfit),
      stats: [t('games.bridgeBuilder.statBridges', { n: built, total: BRIDGE_COUNT }), misfits],
      // Misfits are "lower is better": only a finished round can set a record.
      ...(built === BRIDGE_COUNT ? { best: { value: misfit, label: misfits } } : {}),
    });
  });

  if (!level || !geo) return <View style={styles.fill} />;
  const posts = geo.slots.slice(1).map((s) => s.x);
  const activate = (fn: () => void) => (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') fn();
  };

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill}>
        <View
          style={[
            styles.cliff,
            styles.cliffL,
            { width: geo.deckL, top: geo.deckY, height: geo.waterBottom - geo.deckY + space.lg },
          ]}
        />
        <View
          style={[
            styles.cliff,
            styles.cliffR,
            {
              left: geo.deckR,
              top: geo.deckY,
              height: geo.waterBottom - geo.deckY + space.lg,
            },
          ]}
        />
        <View
          style={[
            styles.water,
            {
              left: geo.deckL,
              width: geo.deckR - geo.deckL,
              top: geo.waterTop,
              height: geo.waterBottom - geo.waterTop,
            },
          ]}
        />
        {posts.map((x, i) => (
          <View
            key={i}
            style={[
              styles.post,
              {
                left: x - space.xs,
                top: geo.waterTop,
                height: geo.waterBottom - geo.waterTop,
              },
            ]}
          />
        ))}
        {geo.slots.map((s, i) => {
          const done = placed[i] !== null && placed[i] !== undefined;
          const len = level.gaps[i]!;
          return (
            <View
              key={i}
              testID={`game.bridgeBuilder.gap${i}`}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t(
                done ? 'games.bridgeBuilder.gapFilled' : 'games.bridgeBuilder.gap',
                { n: i + 1, count: len },
              )}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={activate(() => tapGap(i))}
              style={[
                styles.slot,
                done ? styles.slotDone : null,
                { left: s.x, top: s.y, width: s.w, height: s.h, borderRadius: s.h * 0.3 },
              ]}>
              <Text
                variant="micro"
                tone="secondary"
                style={[styles.slotLabel, done ? styles.slotLabelDone : null]}>
                {len}
              </Text>
            </View>
          );
        })}
        <Well
          style={[styles.tray, { top: geo.trayTop, height: geo.trayH }]}
          accessibilityLabel={t('games.bridgeBuilder.tray')}
        />
        {level.tray.map((len, i) => {
          const at = placed.indexOf(i);
          const base = at >= 0 ? geo.slots[at]! : geo.homes[i]!;
          return (
            <Beam
              key={`${len}-${i}`}
              i={i}
              gap={at}
              rect={base}
              top={lifted === i}
              selected={selected === i}
              label={t('games.bridgeBuilder.beam', { count: len })}
              onActivate={activate(() => tapBeam(i))}
              dragId={dragId}
              dx={dx}
              dy={dy}
              shake={shake}
              dips={dips}
            />
          );
        })}
        <Animated.View
          style={[styles.pip, pipStyle]}
          accessible
          accessibilityLabel={t('games.bridgeBuilder.pip')}>
          <PipPlaceholder size={geo.pip} wave={wave} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/** A beam (prototype `.bbm`): enamel orange plank with a rivet at each end. */
function Beam({
  i,
  gap,
  rect,
  top,
  selected,
  label,
  onActivate,
  dragId,
  dx,
  dy,
  shake,
  dips,
}: {
  i: number;
  /** The gap it sits in, or -1 while in the tray. */
  gap: number;
  rect: Rect;
  top: boolean;
  selected: boolean;
  label: string;
  onActivate: (e: AccessibilityActionEvent) => void;
  dragId: SharedValue<number>;
  dx: SharedValue<number>;
  dy: SharedValue<number>;
  shake: SharedValue<number>;
  dips: SharedValue<number[]>;
}) {
  const style = useAnimatedStyle(() => {
    const me = dragId.get() === i;
    return {
      transform: [
        { translateX: me ? dx.get() + shake.get() : 0 },
        { translateY: me ? dy.get() : gap >= 0 ? (dips.get()[gap] ?? 0) : 0 },
      ],
    };
  });
  return (
    <Animated.View
      testID={`game.bridgeBuilder.beam${i}`}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: gap >= 0 }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onActivate}
      style={[
        styles.beam,
        top ? styles.beamTop : null,
        selected ? styles.beamSelected : null,
        {
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          borderRadius: rect.h * 0.3,
          paddingHorizontal: rect.h * 0.3,
        },
        style,
      ]}>
      <View style={styles.shine} />
      <View style={[styles.rivet, { width: rect.h * 0.25, height: rect.h * 0.25 }]} />
      <View style={[styles.rivet, { width: rect.h * 0.25, height: rect.h * 0.25 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cliff: {
    position: 'absolute',
    backgroundColor: color.surface.controlStrong,
    borderWidth: size.hairline,
    borderColor: color.surface.line,
  },
  cliffL: {
    left: 0,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.sm,
  },
  cliffR: {
    right: 0,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.sm,
  },
  water: {
    position: 'absolute',
    backgroundColor: color.game.sky,
    opacity: 0.18,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  post: {
    position: 'absolute',
    width: space.sm,
    borderRadius: radius.sm,
    backgroundColor: color.surface.ring,
  },
  slot: {
    position: 'absolute',
    borderWidth: size.hairline,
    borderColor: color.surface.track,
    alignItems: 'center',
  },
  slotDone: { borderWidth: 0 },
  slotLabel: { position: 'absolute', bottom: '100%', marginBottom: space.xs },
  slotLabelDone: { color: color.game.sun },
  tray: { position: 'absolute', left: 0, right: 0 },
  beam: {
    position: 'absolute',
    backgroundColor: color.game.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  beamTop: { zIndex: 2 },
  beamSelected: { borderWidth: size.ring.stroke / 2, borderColor: color.game.sun },
  shine: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '12%',
    height: '22%',
    borderRadius: radius.pill,
    backgroundColor: color.text.primary,
    opacity: 0.3,
  },
  rivet: { borderRadius: radius.pill, backgroundColor: color.overlay.scrim },
  pip: { position: 'absolute', left: 0, top: 0, zIndex: 3 },
});
