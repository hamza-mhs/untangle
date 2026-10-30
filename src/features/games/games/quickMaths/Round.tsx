import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { Text } from '@/design/components';
import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useFrame, useRoundLoop, Well } from '../../kit';
import { RingTimer } from '../../kit/RingTimer';
import {
  mathsPoints,
  mathsStars,
  mathsTrials,
  MATHS_RING_MS,
  MATHS_SECONDS,
  MATHS_TRIALS,
  type MathsTrial,
} from './logic';

const POLL_MS = 30;
type KeyState = 'idle' | 'ok' | 'no' | 'show' | 'dim';

export default function QuickMathsRound({ api, seed }: RoundProps) {
  const t = useT();
  const [q, setQ] = useState<MathsTrial | null>(null);
  const [keys, setKeys] = useState<KeyState[]>(['idle', 'idle', 'idle', 'idle']);
  const answer = useRef<number | null>(null);
  const open = useRef(false);
  const ringFrom = useRef<number | null>(null);
  const ringLeft = useSharedValue(1);
  const keysTop = useRef(0);
  const keyAt = useRef<{ x: number; y: number }[]>([]);

  // The ring follows the game clock, so it stops while the game is paused.
  useFrame(api, (now) => {
    const from = ringFrom.current;
    ringLeft.set(from === null ? ringLeft.get() : Math.max(0, 1 - (now - from) / MATHS_RING_MS));
  });

  useRoundLoop(api, async () => {
    const trials = mathsTrials(seed);
    const timer = api.timer(MATHS_SECONDS);
    let n = 0;
    let right = 0;
    let wrong = 0;
    let streak = 0;
    let best = 0;
    api.combo(0);
    while (!timer.done() && n < MATHS_TRIALS) {
      const tr = trials[n]!;
      n++;
      api.setRound(t('games.hud.of', { n, total: MATHS_TRIALS }));
      setKeys(['idle', 'idle', 'idle', 'idle']);
      setQ(tr);
      api.hint(t('games.quickMaths.pick'));
      const start = api.clock.now();
      ringFrom.current = start;
      answer.current = null;
      open.current = true;
      while (answer.current === null && !timer.done() && api.clock.now() - start < MATHS_RING_MS)
        await api.wait(POLL_MS);
      open.current = false;
      ringFrom.current = null;
      const a = answer.current;
      if (a === null && timer.done()) break;
      const ci = tr.options.indexOf(tr.answer);
      if (a !== null && tr.options[a] === tr.answer) {
        right++;
        streak++;
        best = Math.max(best, streak);
        api.combo(streak);
        setKeys(tr.options.map((_, i) => (i === a ? 'ok' : 'dim')));
        const pts = mathsPoints(streak);
        api.addScore(pts);
        const k = keyAt.current[a] ?? { x: api.board.width / 2, y: api.board.height / 2 };
        api.fx.hit(k.x, keysTop.current + k.y, color.signal.success, pts);
        api.hint(
          streak >= 3 ? t('games.quickMaths.inARow', { n: streak }) : t('games.quickMaths.right'),
          'good',
        );
      } else {
        wrong++;
        streak = 0;
        api.combo(0);
        setKeys(tr.options.map((_, i) => (i === a ? 'no' : i === ci ? 'show' : 'dim')));
        api.fx.oops();
        api.hint(
          a === null
            ? t('games.quickMaths.tooSlow', { n: tr.answer })
            : t('games.quickMaths.itWas', { n: tr.answer }),
          'bad',
        );
      }
      await api.wait(650);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = right + wrong;
    api.finish({
      title: right >= 8 ? t('games.quickMaths.titleQuick') : t('games.quickMaths.titleNice'),
      stars: mathsStars(right),
      stats: [
        t('games.quickMaths.statRight', { right, n: total }),
        t('games.quickMaths.statStreak', { count: best }),
      ],
      best: { value: right, label: t('games.quickMaths.statRight', { right, n: total }) },
    });
  });

  const press = (i: number) => {
    api.haptic('tap');
    api.sound('tap');
    if (open.current && answer.current === null) answer.current = i;
  };

  return (
    <View style={styles.fill}>
      <View>
        <Well style={styles.card}>
          <Text
            variant="statXl"
            align="center"
            adjustsFontSizeToFit
            numberOfLines={1}
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              q
                ? t('games.quickMaths.a11y', {
                    a: q.a,
                    op: t(`games.quickMaths.ops.${q.op}`),
                    b: q.b,
                  })
                : ''
            }>
            {q ? `${q.a} ${q.op} ${q.b}` : ''}
          </Text>
          <View style={styles.ring}>
            <RingTimer left={ringLeft} size={size.touch * 0.7} />
          </View>
        </Well>
      </View>
      <View style={styles.grid} onLayout={(e) => (keysTop.current = e.nativeEvent.layout.y)}>
        {(q?.options ?? [0, 0, 0, 0]).map((v, i) => (
          <View
            key={i}
            style={[styles.cell, keys[i] === 'dim' ? styles.dim : null]}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              keyAt.current[i] = { x: x + width / 2, y: y + height / 2 };
            }}>
            <ToyKey
              testID={`game.quickMaths.key${i}`}
              tint={
                keys[i] === 'ok' || keys[i] === 'show' ? color.signal.success : color.game.orange
              }
              accessibilityLabel={String(v)}
              onPress={() => press(i)}
              style={[styles.key, keys[i] === 'no' ? styles.no : null]}>
              <Text variant="statLg">{q ? String(v) : ''}</Text>
            </ToyKey>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: space.lg, paddingTop: space.md },
  card: { paddingVertical: space['3xl'], paddingHorizontal: space.lg },
  ring: { position: 'absolute', top: space.md, right: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47.5%' },
  key: { height: size.touch * 2.2 },
  no: { borderWidth: 3, borderColor: color.signal.danger },
  dim: { opacity: 0.45 },
});
