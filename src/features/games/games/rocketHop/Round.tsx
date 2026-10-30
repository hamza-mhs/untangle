import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Text } from '@/design/components';
import { color, radius } from '@/design/tokens';
import { useT } from '@/i18n';
import { rng } from '@/lib/rng';
import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import {
  FLIGHT_MS,
  HOP_GOAL,
  HOP_LIVES,
  hopPoints,
  hopStars,
  LAND_TOLERANCE,
  planetX,
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

const PLANET = 68;
const ROCKET = 36;

export default function RocketHopRound({ api }: RoundProps) {
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
        api.sound('tap');
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  planet: { position: 'absolute', width: PLANET, height: PLANET, borderRadius: radius.pill },
  rocket: {
    position: 'absolute',
    width: ROCKET,
    height: ROCKET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
