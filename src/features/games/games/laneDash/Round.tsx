import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import { fallMs, LANES, laneSchedule, laneStars, type LaneItem } from './logic';

const RUNNER = 44;
const THING = 40;

export default function LaneDashRound({ api, seed }: RoundProps) {
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
    api.sound('tap');
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
});
