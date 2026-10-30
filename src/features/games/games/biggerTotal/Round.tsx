import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PressableScale, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { useFrame, useRoundLoop } from '../../kit';
import {
  totalPoints,
  totalStars,
  totalTrials,
  TOTAL_BAR_MS,
  TOTAL_SECONDS,
  TOTAL_TRIALS,
  type TotalTrial,
} from './logic';

const POLL_MS = 30;
const TINT = [color.game.orange, color.game.sky] as const;
type StackState = 'idle' | 'ok' | 'no';

export default function BiggerTotalRound({ api, seed }: RoundProps) {
  const t = useT();
  const [q, setQ] = useState<TotalTrial | null>(null);
  const [shown, setShown] = useState(false);
  const [state, setState] = useState<[StackState, StackState]>(['idle', 'idle']);
  const answer = useRef<0 | 1 | null>(null);
  const open = useRef(false);
  const barFrom = useRef<number | null>(null);
  const bar = useSharedValue(1);
  const stacksAt = useRef<{ x: number; y: number }[]>([]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.get() * 100}%` }));

  useFrame(api, (now) => {
    const from = barFrom.current;
    if (from !== null) bar.set(Math.max(0, 1 - (now - from) / TOTAL_BAR_MS));
  });

  useRoundLoop(api, async () => {
    const trials = totalTrials(seed);
    const timer = api.timer(TOTAL_SECONDS);
    let n = 0;
    let right = 0;
    let wrong = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && n < TOTAL_TRIALS) {
      const tr = trials[n]!;
      n++;
      api.setRound(t('games.hud.of', { n, total: TOTAL_TRIALS }));
      setShown(false);
      setState(['idle', 'idle']);
      setQ(tr);
      api.hint(t('games.biggerTotal.pick'));
      const start = api.clock.now();
      barFrom.current = start;
      bar.set(1);
      answer.current = null;
      open.current = true;
      while (answer.current === null && !timer.done() && api.clock.now() - start < TOTAL_BAR_MS)
        await api.wait(POLL_MS);
      open.current = false;
      barFrom.current = null;
      const a = answer.current;
      if (a === null && timer.done()) break;
      setShown(true);
      const [sa, sb] = tr.sums;
      if (a === tr.bigger) {
        right++;
        streak++;
        api.combo(streak);
        setState(a === 0 ? ['ok', 'idle'] : ['idle', 'ok']);
        const pts = totalPoints(streak);
        api.addScore(pts);
        const c = stacksAt.current[a] ?? { x: api.board.width / 2, y: api.board.height / 2 };
        api.fx.hit(c.x, c.y, color.game.sun, pts);
        api.hint(t('games.biggerTotal.bigger'), 'good');
      } else {
        wrong++;
        streak = 0;
        api.combo(0);
        setState(
          tr.bigger === 0 ? ['ok', a === null ? 'idle' : 'no'] : [a === null ? 'idle' : 'no', 'ok'],
        );
        api.fx.oops();
        api.hint(
          a === null
            ? t('games.biggerTotal.tooSlow')
            : t('games.biggerTotal.beats', { big: Math.max(sa, sb), small: Math.min(sa, sb) }),
          'bad',
        );
      }
      await api.wait(900);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = right + wrong;
    api.finish({
      title: t('games.biggerTotal.title'),
      stars: totalStars(right),
      stats: [
        t('games.biggerTotal.statRight', { right, n: total }),
        t('games.common.slips', { count: wrong }),
      ],
      best: { value: right, label: t('games.biggerTotal.statRight', { right, n: total }) },
    });
  });

  const press = (s: 0 | 1) => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && answer.current === null) answer.current = s;
  };

  return (
    <View style={styles.fill}>
      <View style={styles.row}>
        {([0, 1] as const).map((s) => (
          <View
            key={s}
            style={styles.cell}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              stacksAt.current[s] = { x: x + width / 2, y: y + height / 2 };
            }}>
            <PressableScale
              testID={`game.biggerTotal.stack${s}`}
              accessibilityRole="button"
              accessibilityLabel={
                q
                  ? t('games.biggerTotal.a11y', { tiles: q.stacks[s].join(', ') })
                  : t('games.biggerTotal.pick')
              }
              onPress={() => press(s)}
              style={[
                styles.stack,
                state[s] === 'ok' ? styles.ok : null,
                state[s] === 'no' ? styles.no : null,
              ]}>
              {/* The total flips up over the stack after the pick (design). */}
              <Text variant="statMd" style={[styles.sum, shown ? null : styles.hidden]}>
                {q ? String(q.sums[s]) : ' '}
              </Text>
              {(q?.stacks[s] ?? []).map((v, i) => (
                <View key={i} style={[styles.tile, { backgroundColor: TINT[s] }]}>
                  <Text variant="statMd">{String(v)}</Text>
                </View>
              ))}
            </PressableScale>
          </View>
        ))}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.lg, paddingTop: space.md },
  row: { flexDirection: 'row', gap: space.md },
  cell: { flex: 1 },
  stack: {
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    borderRadius: radius['3xl'],
    backgroundColor: color.surface.card,
    borderWidth: 2,
    borderColor: color.surface.line,
  },
  sum: { marginBottom: space.lg },
  tile: {
    width: '62%',
    height: size.touch,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ok: { borderColor: color.signal.success },
  no: { borderColor: color.signal.danger },
  hidden: { opacity: 0 },
  track: {
    height: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface.track,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: color.game.sun },
});
