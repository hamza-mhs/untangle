import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, {
  FlipInXUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import { binKind, SortPiece } from '../../kit/SortPiece';
import { ruleAt, sortSide, type SortPiece as Piece, type SortRule } from '../../kit/sortRules';
import {
  streamCards,
  streamPoints,
  streamStars,
  STREAM_CARDS,
  STREAM_PAUSE_MS,
  STREAM_SECONDS,
  STREAM_SWITCH,
} from './logic';

const POLL_MS = 30;
/** A swipe counts past this many dp sideways. */
const SWIPE_DP = 40;
const FLY_MS = 260;

export default function SortTheStreamRound({ api, seed }: RoundProps) {
  const t = useT();
  const W = api.board.width;
  const cardSize = Math.min(W * 0.38, size.touch * 3.4);
  const [rule, setRule] = useState<SortRule>('colour');
  const [card, setCard] = useState<{ p: Piece; n: number } | null>(null);
  const answer = useRef<0 | 1 | null>(null);
  const open = useRef(false);
  const dx = useSharedValue(0);
  const op = useSharedValue(1);
  const enter = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: op.get() * enter.get(),
    transform: [
      { translateX: dx.get() },
      { translateY: (1 - enter.get()) * -40 },
      { rotate: `${dx.get() / 8}deg` },
      { scale: 0.7 + 0.3 * enter.get() },
    ],
  }));

  const choose = (side: 0 | 1) => {
    if (!open.current || answer.current !== null) return;
    api.haptic('tap');
    api.sound('tap');
    answer.current = side;
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
        onPanResponderMove: (_, g) => {
          if (open.current) dx.set(g.dx);
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > SWIPE_DP) choose(g.dx < 0 ? 0 : 1);
          else dx.set(withTiming(0, { duration: 120 }));
        },
      }),
    // `choose` only reads refs and the stable api.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dx],
  );

  useRoundLoop(api, async () => {
    const cards = streamCards(seed);
    const timer = api.timer(STREAM_SECONDS);
    let n = 0;
    let right = 0;
    let wrong = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && n < STREAM_CARDS) {
      const r = ruleAt(n, STREAM_SWITCH);
      api.setRound(t('games.ruleFlip.ruleRound', { rule: t(`games.ruleFlip.rules.${r}`) }));
      if ((STREAM_SWITCH as readonly number[]).includes(n)) {
        setRule(r);
        setCard(null);
        api.quiet(true);
        api.fx.toast(t('games.sortTheStream.switch'), color.text.primary);
        api.sound('go');
        await api.wait(STREAM_PAUSE_MS);
        api.quiet(false);
      }
      const p = cards[n]!;
      n++;
      dx.set(0);
      op.set(1);
      enter.set(0);
      enter.set(withTiming(1, { duration: api.reducedMotion ? 0 : 220 }));
      setCard({ p, n });
      answer.current = null;
      open.current = true;
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      const side = answer.current;
      if (side === null) break;
      const s = side === 0 ? -1 : 1;
      dx.set(withTiming(s * W * 0.6, { duration: FLY_MS }));
      op.set(withTiming(0, { duration: FLY_MS }));
      if (side === sortSide(p, r)) {
        right++;
        streak++;
        api.addScore(streamPoints(streak));
        api.sound('good');
        api.hint(
          streak > 4
            ? t('games.sortTheStream.inARow', { n: streak })
            : t('games.sortTheStream.sorted'),
          'good',
        );
      } else {
        wrong++;
        streak = 0;
        api.fx.oops();
        api.hint(
          (STREAM_SWITCH as readonly number[]).includes(n - 1)
            ? t('games.ruleFlip.newRule', { rule: t(`games.ruleFlip.rules.${r}`) })
            : t('games.ruleFlip.wrong'),
          'bad',
        );
      }
      api.combo(streak);
      await api.wait(FLY_MS + 150);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = Math.max(right + wrong, 1);
    api.finish({
      title: t('games.sortTheStream.title'),
      stars: streamStars(right),
      stats: [
        t('games.ruleFlip.statSorted', { right, n: total }),
        t('games.ruleFlip.statFlips', { count: 1 }),
      ],
      best: { value: right, label: t('games.ruleFlip.statSorted', { right, n: total }) },
    });
  });

  const left = binKind(rule, 0);
  const rightKind = binKind(rule, 1);
  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <Animated.View
          key={rule}
          {...(api.reducedMotion ? {} : { entering: FlipInXUp.duration(360) })}
          style={styles.banner}
          accessible
          accessibilityLiveRegion="polite">
          <Text variant="bodyStrong" tone="onLight">
            {t(`games.sortTheStream.rule.${rule}`)}
          </Text>
        </Animated.View>
      </View>
      <View style={styles.stage} {...pan.panHandlers}>
        {card ? (
          <Animated.View
            style={cardStyle}
            accessible
            accessibilityLabel={t('games.ruleFlip.piece', {
              colour: t(`games.ruleFlip.kinds.${card.p.colour}`),
              shape: t(`games.ruleFlip.kinds.${card.p.shape}`),
            })}>
            <SortPiece piece={card.p} size={cardSize} />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.sides}>
        {(
          [
            [0, left],
            [1, rightKind],
          ] as const
        ).map(([side, kind]) => (
          <PressableScale
            key={side}
            testID={`game.sortTheStream.side${side}`}
            accessibilityRole="button"
            accessibilityLabel={t(`games.ruleFlip.kinds.${kind}`)}
            onPress={() => choose(side)}
            style={styles.side}>
            <Text variant="bodyStrong" tone="secondary">
              {side === 0
                ? t('games.sortTheStream.leftLabel', {
                    kind: t(`games.ruleFlip.kinds.${kind}`).toUpperCase(),
                  })
                : t('games.sortTheStream.rightLabel', {
                    kind: t(`games.ruleFlip.kinds.${kind}`).toUpperCase(),
                  })}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { alignItems: 'center', paddingTop: space.sm },
  banner: {
    backgroundColor: color.text.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sides: { flexDirection: 'row', gap: space.md, paddingBottom: space.md },
  side: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.lg,
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
  },
});
