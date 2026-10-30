import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { PressableScale } from '@/design/components';
import { color, radius, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { Shape, useRoundLoop, Well } from '../../kit';
import {
  applySwaps,
  STAR_CARD,
  SWAP_CARDS,
  SWAP_ROUNDS,
  SWAP_SECONDS,
  SWAP_SHOW_MS,
  swapMs,
  swapPoints,
  swapRounds,
  swapStars,
} from './logic';

const POLL_MS = 40;
/** How far a card lifts (and its partner dips) on every swap, as in the prototype. */
const LIFT = 14;

function Card({
  x,
  y,
  w,
  h,
  lift,
  faceUp,
  star,
  label,
  onPress,
}: {
  x: SharedValue<number>;
  y: number;
  w: number;
  h: number;
  lift: SharedValue<number>;
  faceUp: boolean;
  star: boolean;
  label: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() - w / 2 },
      { translateY: y - lift.get() },
      { scale: 1 - Math.max(0, -lift.get()) / 120 },
    ],
  }));
  return (
    <Animated.View style={[styles.card, { width: w, height: h }, style]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.face, faceUp ? styles.front : styles.back]}>
        {faceUp ? (
          star ? (
            <Shape name="star" size={w * 0.42} fill={color.game.sun} />
          ) : null
        ) : (
          <View style={[styles.backMark, { width: w * 0.24, height: w * 0.24 }]} />
        )}
      </PressableScale>
    </Animated.View>
  );
}

export default function SwapItRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const cardW = Math.min((W - space.xl * 2) / 3.3, 120);
  const cardH = cardW * 1.3;
  const top = api.board.height * 0.42 - cardH / 2;
  const slotX = (slot: number) => W / 2 + (slot - 1) * cardW * 1.12;

  const x0 = useSharedValue(slotX(0));
  const x1 = useSharedValue(slotX(1));
  const x2 = useSharedValue(slotX(2));
  const l0 = useSharedValue(0);
  const l1 = useSharedValue(0);
  const l2 = useSharedValue(0);
  const xs = [x0, x1, x2];
  const lifts = [l0, l1, l2];

  const [up, setUp] = useState<readonly number[]>([]);
  const slots = useRef([0, 1, 2]);
  const picking = useRef(false);
  const picked = useRef<number | null>(null);

  useRoundLoop(api, async () => {
    const rounds = swapRounds(seed);
    const timer = api.timer(SWAP_SECONDS);
    let r = 0;
    let found = 0;
    let misses = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && r < SWAP_ROUNDS) {
      r++;
      api.setRound(t('games.common.roundOf', { n: r, total: SWAP_ROUNDS }));
      const dur = swapMs(r);
      setUp([STAR_CARD]);
      api.hint(t('games.swapIt.watch'));
      await api.wait(SWAP_SHOW_MS);
      setUp([]);
      await api.wait(450);
      api.quiet(true);
      api.hint(t('games.swapIt.follow'));
      for (const swap of rounds[r - 1]!) {
        const before = slots.current;
        const after = applySwaps(before, [swap]);
        const [ca, cb] = [before.indexOf(swap[0]), before.indexOf(swap[1])];
        slots.current = after;
        xs[ca]!.set(withTiming(slotX(after[ca]!), { duration: dur }));
        xs[cb]!.set(withTiming(slotX(after[cb]!), { duration: dur }));
        if (!api.reducedMotion) {
          const half = { duration: dur / 2 };
          lifts[ca]!.set(withSequence(withTiming(LIFT, half), withTiming(0, half)));
          lifts[cb]!.set(withSequence(withTiming(-LIFT, half), withTiming(0, half)));
        }
        api.sound('tick');
        await api.wait(dur + 70);
      }
      api.quiet(false);
      api.hint(t('games.swapIt.where'));
      picked.current = null;
      picking.current = true;
      while (picked.current === null && !timer.done()) await api.wait(POLL_MS);
      picking.current = false;
      const card = picked.current;
      if (card === null) break;
      const cx = slotX(slots.current[card]!);
      const cy = top + cardH / 2;
      setUp([card]);
      if (card === STAR_CARD) {
        found++;
        streak++;
        api.combo(streak);
        const pts = swapPoints(r);
        api.addScore(pts);
        api.fx.hit(cx, cy, color.game.sun, pts);
        api.hint(t('games.swapIt.found'), 'good');
      } else {
        misses++;
        streak = 0;
        api.combo(0);
        api.fx.oops();
        await api.wait(350);
        setUp([card, STAR_CARD]);
        api.hint(t('games.swapIt.wasHere'), 'bad');
      }
      await api.wait(900);
      setUp([]);
      await api.wait(450);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const n = Math.max(found + misses, 1);
    api.finish({
      title: t('games.swapIt.title'),
      stars: swapStars(found, misses),
      stats: [
        t('games.swapIt.statFound', { found, n }),
        t('games.common.misses', { count: misses }),
      ],
      best: { value: found, label: t('games.swapIt.statFound', { found, n }) },
    });
  });

  const onCard = (card: number) => {
    if (!picking.current || picked.current !== null) return;
    api.haptic('tap');
    api.sound('tap');
    picked.current = card;
  };

  return (
    <View style={styles.fill}>
      <Well
        style={[
          styles.track,
          { top: top + cardH * 0.55, height: cardH * 0.6, width: cardW * SWAP_CARDS * 1.2 },
        ]}
      />
      {xs.map((x, card) => (
        <Card
          key={card}
          x={x}
          y={top}
          w={cardW}
          h={cardH}
          lift={lifts[card]!}
          faceUp={up.includes(card)}
          star={card === STAR_CARD}
          label={
            up.includes(card) && card === STAR_CARD
              ? t('games.swapIt.cardStar', { n: (slots.current[card] ?? 0) + 1 })
              : t('games.swapIt.card', { n: (slots.current[card] ?? 0) + 1 })
          }
          onPress={() => onCard(card)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  track: { position: 'absolute', alignSelf: 'center' },
  card: { position: 'absolute', left: 0, top: 0 },
  face: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 3,
    borderColor: color.game.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { backgroundColor: color.game.indigo },
  front: { backgroundColor: color.text.primary },
  backMark: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: color.surface.glass,
  },
});
