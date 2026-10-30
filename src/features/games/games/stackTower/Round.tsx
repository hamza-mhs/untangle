import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { color, radius } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import { dropSlab, slabSpeed, slidePos, STACK_FLOORS, stackStars } from './logic';

const POLL_MS = 30;
const HUES = [
  color.game.pink,
  color.game.orange,
  color.game.sun,
  color.game.mint,
  color.game.sky,
  color.game.violet,
];

const SLAB_H = 24;
const START_W = 0.6;
const VISIBLE_FLOORS = 9;

type Slab = { left: number; width: number; hue: string };

export default function StackTowerRound({ api }: RoundProps) {
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
        api.sound('tap');
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  slab: { position: 'absolute', height: SLAB_H - 2, borderRadius: radius.sm },
});
