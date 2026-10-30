import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import {
  angleDiff,
  BLOCK_HALF,
  BUMP_COOL_MS,
  hitsBlock,
  lapLayout,
  LAP_POINTS,
  ORBIT,
  orbitStars,
  ORBIT_LIVES,
  ORBIT_SECONDS,
  ORBIT_SPEED,
  ORBIT_SPEED_UP,
  SPARK_POINTS,
  SPARK_REACH,
  START_ANGLE,
  START_RING,
  type Block,
  type Ring,
  type Spark,
} from './logic';

const POLL_MS = 50;
const MARBLE = 22;
/** How fast the marble eases between rings (prototype: × dt · 14). */
const EASE = 14;

function arcPath(r: number, a0: number, a1: number) {
  const p = (a: number) => [ORBIT.cx + r * Math.cos(a), ORBIT.cy + r * Math.sin(a)] as const;
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
}

export default function OrbitSwitchRound({ api, seed }: RoundProps) {
  const t = useT();
  const [field, setField] = useState({ w: 0, h: 0 });
  const [blocks, setBlocks] = useState<Block[]>(() => lapLayout(seed, 0).blocks);
  const [sparks, setSparks] = useState<(Spark & { got: boolean })[]>(() =>
    lapLayout(seed, 0).sparks.map((s) => ({ ...s, got: false })),
  );
  const [bumped, setBumped] = useState(false);
  const mx = useSharedValue(0);
  const my = useSharedValue(0);
  const marble = useAnimatedStyle(() => ({
    transform: [{ translateX: mx.get() - MARBLE / 2 }, { translateY: my.get() - MARBLE / 2 }],
  }));

  // Simulation state (the frame callback reads the game clock, so pause freezes it).
  const sim = useRef({
    running: false,
    ring: START_RING as Ring,
    ang: START_ANGLE,
    lapFrom: START_ANGLE,
    r: (START_RING ? ORBIT.outer : ORBIT.inner) as number,
    speed: ORBIT_SPEED,
    last: 0,
    cool: 0,
    laps: 0,
    sparks: 0,
    bumps: 0,
    left: ORBIT_LIVES,
    blocks: lapLayout(seed, 0).blocks,
    sparkList: lapLayout(seed, 0).sparks.map((s) => ({ ...s, got: false })),
  });
  const livesRef = useRef<{ lose: () => number } | null>(null);
  const scale = field.w > 0 ? Math.min(field.w / ORBIT.w, field.h / ORBIT.h) : 1;
  const ox = (field.w - ORBIT.w * scale) / 2;
  const oy = (field.h - ORBIT.h * scale) / 2;
  const geo = useRef({ scale, ox, oy });
  geo.current = { scale, ox, oy };

  useFrame(api, (now) => {
    const s = sim.current;
    const g = geo.current;
    const place = () => {
      const px = ORBIT.cx + s.r * Math.cos(s.ang);
      const py = ORBIT.cy + s.r * Math.sin(s.ang);
      mx.set(g.ox + px * g.scale);
      my.set(g.oy + py * g.scale);
      return [px, py] as const;
    };
    if (!s.running) {
      // Before the start (and after the end) the marble rests where the sim left it.
      s.last = now;
      place();
      return;
    }
    const dt = Math.min(50, now - s.last) / 1000;
    s.last = now;
    if (dt <= 0) return;
    s.ang += s.speed * dt;
    const target = s.ring ? ORBIT.outer : ORBIT.inner;
    s.r += (target - s.r) * Math.min(1, dt * EASE);
    const [px, py] = place();
    if (s.ang - s.lapFrom > Math.PI * 2) {
      s.lapFrom += Math.PI * 2;
      s.laps++;
      s.speed += ORBIT_SPEED_UP;
      api.addScore(LAP_POINTS);
      api.setRound(t('games.orbitSwitch.lap', { n: s.laps + 1 }));
      api.fx.float(
        g.ox + ORBIT.cx * g.scale,
        g.oy + ORBIT.cy * g.scale,
        t('games.orbitSwitch.lapDone', { n: s.laps }),
      );
      api.sound('go');
      const next = lapLayout(seed, s.laps);
      s.blocks = next.blocks;
      s.sparkList = next.sparks.map((x) => ({ ...x, got: false }));
      setBlocks(next.blocks);
      setSparks(s.sparkList);
    }
    const settled = Math.abs(s.r - target) < 6;
    if (settled && now > s.cool && hitsBlock(s.ang, s.ring, s.blocks)) {
      s.cool = now + BUMP_COOL_MS;
      s.bumps++;
      s.left = livesRef.current?.lose() ?? s.left - 1;
      api.fx.oops();
      api.hint(t('games.orbitSwitch.bumped'), 'bad');
      setBumped(true);
      setTimeout(() => setBumped(false), 400);
      if (s.left <= 0) s.running = false;
    }
    if (settled) {
      let got = false;
      s.sparkList.forEach((sp) => {
        if (!sp.got && sp.ring === s.ring && Math.abs(angleDiff(s.ang, sp.a)) < SPARK_REACH) {
          sp.got = true;
          got = true;
          s.sparks++;
          api.addScore(SPARK_POINTS);
          api.fx.burst(g.ox + px * g.scale, g.oy + py * g.scale, color.game.sky, 8);
          api.sound('good');
        }
      });
      if (got) setSparks([...s.sparkList]);
    }
  });

  useRoundLoop(api, async () => {
    const timer = api.timer(ORBIT_SECONDS);
    livesRef.current = api.lives(ORBIT_LIVES);
    api.setRound(t('games.orbitSwitch.lap', { n: 1 }));
    api.hint(t('games.orbitSwitch.tap'));
    sim.current.last = api.clock.now();
    sim.current.running = true;
    while (!timer.done() && sim.current.left > 0) await api.wait(POLL_MS);
    sim.current.running = false;
    const { laps, sparks: got, bumps, left } = sim.current;
    api.fx.toast(
      left > 0 ? t('games.hud.timeUp') : t('games.orbitSwitch.out'),
      color.signal.danger,
    );
    await api.wait(700);
    api.finish({
      title: t('games.orbitSwitch.title'),
      stars: orbitStars(bumps, left),
      stats: [
        t('games.orbitSwitch.statLaps', { count: laps }),
        t('games.orbitSwitch.statSparks', { sparks: got, count: bumps }),
      ],
      best: { value: laps, label: t('games.orbitSwitch.statLaps', { count: laps }) },
    });
  });

  const hop = () => {
    if (!sim.current.running) return;
    api.haptic('tap');
    api.sound('tap');
    sim.current.ring = (1 - sim.current.ring) as Ring;
  };
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setField({ w: width, h: height });
  };

  return (
    <Pressable
      style={styles.fill}
      onPress={hop}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={t('games.orbitSwitch.a11y')}>
      {field.w > 0 ? (
        <Svg
          width={ORBIT.w * scale}
          height={ORBIT.h * scale}
          viewBox={`0 0 ${ORBIT.w} ${ORBIT.h}`}
          style={[styles.svg, { left: ox, top: oy }]}>
          {[ORBIT.outer, ORBIT.inner].map((r) => (
            <Circle
              key={r}
              cx={ORBIT.cx}
              cy={ORBIT.cy}
              r={r}
              fill="none"
              stroke={color.surface.control}
              strokeWidth={ORBIT.track}
            />
          ))}
          {blocks.map((b, i) => (
            <Path
              key={`b${i}`}
              d={arcPath(b.ring ? ORBIT.outer : ORBIT.inner, b.a - BLOCK_HALF, b.a + BLOCK_HALF)}
              stroke={color.signal.danger}
              strokeWidth={18}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          {sparks.map((sp, i) =>
            sp.got ? null : (
              <Circle
                key={`s${i}`}
                cx={ORBIT.cx + (sp.ring ? ORBIT.outer : ORBIT.inner) * Math.cos(sp.a)}
                cy={ORBIT.cy + (sp.ring ? ORBIT.outer : ORBIT.inner) * Math.sin(sp.a)}
                r={5}
                fill={color.game.sky}
              />
            ),
          )}
        </Svg>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[styles.marble, bumped ? styles.bumped : null, marble]}
      />
      <View style={styles.tapLabel} pointerEvents="none">
        <Text variant="micro" tone="tertiary">
          {t('games.orbitSwitch.tapLabel')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  svg: { position: 'absolute' },
  marble: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MARBLE,
    height: MARBLE,
    borderRadius: radius.pill,
    backgroundColor: color.game.sky,
    borderWidth: 2,
    borderColor: color.text.primary,
  },
  bumped: { backgroundColor: color.signal.danger },
  tapLabel: { position: 'absolute', bottom: space.md, left: 0, right: 0, alignItems: 'center' },
});
