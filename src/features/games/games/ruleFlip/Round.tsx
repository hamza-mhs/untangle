import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FlipInXUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useRoundLoop } from '../../kit';
import { binKind, SortBin, SortPiece, SORT_TINT } from '../../kit/SortPiece';
import { ruleAt, sortSide, type SortPiece as Piece, type SortRule } from '../../kit/sortRules';
import {
  flipPieces,
  flipPoints,
  flipStars,
  FLIP_AT,
  FLIP_PAUSE_MS,
  FLIP_PIECES,
  FLIP_SECONDS,
} from './logic';

const POLL_MS = 40;
const MOVE_MS = 380;

export default function RuleFlipRound({ api, seed }: RoundProps) {
  const t = useT();
  const pieceSize = Math.min(api.board.width * 0.32, size.touch * 3);
  const [rule, setRule] = useState<SortRule>('colour');
  const [piece, setPiece] = useState<{ p: Piece; n: number } | null>(null);
  const [bins, setBins] = useState<['idle' | 'good' | 'bad', 'idle' | 'good' | 'bad']>([
    'idle',
    'idle',
  ]);
  const answer = useRef<0 | 1 | null>(null);
  const open = useRef(false);
  const binAt = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const binsTop = useRef(0);
  const centre = useRef({ x: 0, y: 0 });
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sc = useSharedValue(1);
  const op = useSharedValue(1);
  const pieceStyle = useAnimatedStyle(() => ({
    opacity: op.get(),
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: sc.get() }],
  }));

  useRoundLoop(api, async () => {
    const pieces = flipPieces(seed);
    const timer = api.timer(FLIP_SECONDS);
    let n = 0;
    let right = 0;
    let wrong = 0;
    let streak = 0;
    let flips = 0;
    api.combo(0);
    api.setRound(t('games.ruleFlip.ruleRound', { rule: t('games.ruleFlip.rules.colour') }));
    api.hint(t('games.ruleFlip.send'));
    while (!timer.done() && n < FLIP_PIECES) {
      const r = ruleAt(n, FLIP_AT);
      if ((FLIP_AT as readonly number[]).includes(n)) {
        flips++;
        setRule(r);
        api.setRound(t('games.ruleFlip.ruleRound', { rule: t(`games.ruleFlip.rules.${r}`) }));
        api.quiet(true);
        api.fx.toast(t('games.ruleFlip.flip'), color.text.primary);
        api.sound('go');
        await api.wait(FLIP_PAUSE_MS);
        api.quiet(false);
      }
      const p = pieces[n]!;
      n++;
      tx.set(0);
      ty.set(0);
      sc.set(1);
      op.set(1);
      setPiece({ p, n });
      answer.current = null;
      open.current = true;
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      const side = answer.current;
      if (side === null) break;
      const b = binAt.current[side]!;
      const move = { duration: api.reducedMotion ? 0 : MOVE_MS };
      tx.set(withTiming(b.x - centre.current.x, move));
      ty.set(withTiming(b.y - centre.current.y, move));
      sc.set(withTiming(0.45, move));
      await api.wait(MOVE_MS);
      if (side === sortSide(p, r)) {
        right++;
        streak++;
        const pts = flipPoints(streak);
        api.addScore(pts);
        api.fx.hit(b.x, b.y, SORT_TINT[p.colour], pts);
        setBins(side === 0 ? ['good', 'idle'] : ['idle', 'good']);
        api.hint(
          streak >= 4 ? t('games.ruleFlip.inARow', { n: streak }) : t('games.ruleFlip.right'),
          'good',
        );
      } else {
        wrong++;
        streak = 0;
        api.fx.oops();
        setBins(side === 0 ? ['bad', 'idle'] : ['idle', 'bad']);
        api.hint(
          (FLIP_AT as readonly number[]).includes(n - 1)
            ? t('games.ruleFlip.newRule', { rule: t(`games.ruleFlip.rules.${r}`) })
            : t('games.ruleFlip.wrong'),
          'bad',
        );
      }
      api.combo(streak);
      op.set(withTiming(0, { duration: 200 }));
      await api.wait(260);
      setBins(['idle', 'idle']);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = Math.max(right + wrong, 1);
    api.finish({
      title: t('games.ruleFlip.title'),
      stars: flipStars(right),
      stats: [
        t('games.ruleFlip.statSorted', { right, n: total }),
        t('games.ruleFlip.statFlips', { count: flips }),
      ],
      best: { value: right, label: t('games.ruleFlip.statSorted', { right, n: total }) },
    });
  });

  const send = (side: 0 | 1) => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && answer.current === null) answer.current = side;
  };
  const onBin = (side: 0 | 1) => (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    binAt.current[side] = { x: x + width / 2, y: binsTop.current + y + height / 2 };
  };

  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <Animated.View
          key={rule}
          {...(api.reducedMotion ? {} : { entering: FlipInXUp.duration(360) })}
          style={styles.badge}
          accessible
          accessibilityLiveRegion="polite">
          <Text variant="bodyStrong" tone="onLight">
            {t(`games.ruleFlip.sortBy.${rule}`)}
          </Text>
        </Animated.View>
      </View>
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          centre.current = { x: x + width / 2, y: y + height / 2 };
        }}>
        {piece ? (
          <Animated.View
            style={pieceStyle}
            accessible
            accessibilityLabel={t('games.ruleFlip.piece', {
              colour: t(`games.ruleFlip.kinds.${piece.p.colour}`),
              shape: t(`games.ruleFlip.kinds.${piece.p.shape}`),
            })}>
            <SortPiece piece={piece.p} size={pieceSize} />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.bins} onLayout={(e) => (binsTop.current = e.nativeEvent.layout.y)}>
        {([0, 1] as const).map((side) => {
          const kind = binKind(rule, side);
          return (
            <View key={side} style={styles.binCell} onLayout={onBin(side)}>
              <SortBin
                testID={`game.ruleFlip.bin${side}`}
                kind={kind}
                label={t(`games.ruleFlip.kinds.${kind}`)}
                state={bins[side]}
                onPress={() => send(side)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { alignItems: 'center', paddingTop: space.sm },
  badge: {
    backgroundColor: color.text.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bins: { flexDirection: 'row', gap: space.md, paddingBottom: space.md },
  binCell: { flex: 1 },
});
