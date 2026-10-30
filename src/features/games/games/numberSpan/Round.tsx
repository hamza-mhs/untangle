import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop, Well } from '../../kit';
import {
  spanMarks,
  spanStars,
  spanStream,
  SPAN_DIGIT_POINTS,
  SPAN_GAP_MS,
  SPAN_LIVES,
  SPAN_MAX,
  SPAN_ON_MS,
  SPAN_PERFECT_POINTS,
  SPAN_SECONDS,
  SPAN_START,
} from './logic';

const POLL_MS = 40;
/** Wells check one by one after ✓ (prototype: they turn mint or red). */
const MARK_MS = 120;
type Key = number | 'del' | 'ok';
const KEYS: Key[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'del', 0, 'ok'];

export default function NumberSpanRound({ api, seed }: RoundProps) {
  const t = useT();
  const [shown, setShown] = useState<string>(t('games.numberSpan.ready'));
  const [big, setBig] = useState(false);
  const [len, setLen] = useState(SPAN_START);
  const [typed, setTyped] = useState<number[]>([]);
  const [marks, setMarks] = useState<(boolean | null)[]>([]);
  const typedRef = useRef<number[]>([]);
  const submitted = useRef(false);
  const open = useRef(false);
  const lenRef = useRef(SPAN_START);
  const wellsAt = useRef({ x: 0, y: 0, w: 0 });

  const type = (next: number[]) => {
    typedRef.current = next;
    setTyped(next);
  };

  useRoundLoop(api, async () => {
    const next = spanStream(seed);
    const timer = api.timer(SPAN_SECONDS);
    const lives = api.lives(SPAN_LIVES);
    let left = SPAN_LIVES;
    let n = SPAN_START;
    let longest = 0;
    while (!timer.done() && n <= SPAN_MAX && left > 0) {
      api.setRound(t('games.numberSpan.digits', { count: n }));
      lenRef.current = n;
      setLen(n);
      type([]);
      setMarks([]);
      const seq = next(n);
      api.hint(t('games.numberSpan.remember'));
      api.quiet(true);
      setBig(false);
      setShown(t('games.numberSpan.watch'));
      await api.wait(500);
      setBig(true);
      for (const d of seq) {
        if (timer.done()) break;
        setShown(String(d));
        api.sound('tick');
        await api.wait(SPAN_ON_MS);
        setShown('');
        await api.wait(SPAN_GAP_MS);
      }
      api.quiet(false);
      setBig(false);
      setShown(t('games.numberSpan.yourTurn'));
      api.hint(t('games.numberSpan.type'));
      submitted.current = false;
      open.current = true;
      while (!submitted.current && !timer.done()) await api.wait(POLL_MS);
      open.current = false;
      if (!submitted.current) break;
      const m = spanMarks(seq, typedRef.current);
      for (let i = 0; i < m.length; i++) {
        setMarks(m.slice(0, i + 1));
        if (m[i]) api.addScore(SPAN_DIGIT_POINTS);
        await api.wait(MARK_MS);
      }
      const { x, y, w } = wellsAt.current;
      if (m.every(Boolean)) {
        api.addScore(SPAN_PERFECT_POINTS);
        api.fx.hit(x + w / 2, y, color.signal.success, SPAN_PERFECT_POINTS);
        api.fx.toast(t('games.numberSpan.gotIt', { count: n }), color.signal.successText);
        api.hint(t('games.numberSpan.perfect'), 'good');
        longest = n;
        n++;
        await api.wait(900);
      } else {
        api.fx.oops();
        left = lives.lose();
        api.hint(t('games.numberSpan.itWas', { digits: seq.join(' ') }), 'bad');
        await api.wait(1400);
      }
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 300);
    api.finish({
      title: t('games.numberSpan.title'),
      stars: spanStars(longest),
      stats: [
        t('games.numberSpan.statLongest', { count: longest }),
        t('games.common.livesLeft', { left, total: SPAN_LIVES }),
      ],
      best: {
        value: longest,
        label: t('games.numberSpan.statLongest', { count: longest }),
      },
    });
  });

  const onKey = (k: Key) => {
    if (!open.current) return;
    api.haptic('tap');
    api.sound('tap');
    const cur = typedRef.current;
    if (k === 'del') type(cur.slice(0, -1));
    else if (k === 'ok') {
      if (cur.length === lenRef.current) submitted.current = true;
    } else if (cur.length < lenRef.current) type([...cur, k]);
  };

  return (
    <View style={styles.fill}>
      <Well style={styles.display} accessibilityLabel={shown}>
        <Text
          variant={big ? 'statXl' : 'heading'}
          tone={big ? 'primary' : 'secondary'}
          align="center"
          accessibilityLiveRegion="polite">
          {shown}
        </Text>
      </Well>
      <View
        style={styles.wells}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          wellsAt.current = { x, y: y + height / 2, w: width };
        }}>
        {Array.from({ length: len }, (_, i) => (
          <View
            key={i}
            style={[
              styles.slot,
              i === typed.length && marks.length === 0 ? styles.cur : null,
              marks[i] === true ? styles.ok : null,
              marks[i] === false ? styles.no : null,
            ]}>
            <Text variant="statMd" align="center">
              {typed[i] === undefined ? '' : String(typed[i])}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.keys}>
        {KEYS.map((k) => (
          <View key={String(k)} style={styles.keyCell}>
            <ToyKey
              testID={`game.numberSpan.key.${k}`}
              tint={
                k === 'ok' ? color.game.mint : k === 'del' ? color.game.coral : color.game.cobalt
              }
              accessibilityLabel={
                k === 'ok'
                  ? t('games.numberSpan.done')
                  : k === 'del'
                    ? t('games.numberSpan.delete')
                    : String(k)
              }
              onPress={() => onKey(k)}
              style={styles.key}>
              {k === 'ok' ? (
                <Icon name="check" size={size.icon.md} color={color.text.primary} />
              ) : k === 'del' ? (
                <Icon name="backspace" size={size.icon.md} color={color.text.primary} />
              ) : (
                <Text variant="statMd">{String(k)}</Text>
              )}
            </ToyKey>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', gap: space.lg },
  display: {
    height: size.touch * 2.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wells: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  slot: {
    width: size.touch,
    height: size.touch * 1.15,
    borderRadius: radius.md,
    backgroundColor: color.surface.card,
    borderWidth: 1,
    borderColor: color.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cur: { borderColor: color.text.secondary },
  ok: { backgroundColor: color.signal.successSoft, borderColor: color.signal.success },
  no: { backgroundColor: color.signal.dangerSoft, borderColor: color.signal.danger },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  keyCell: { width: '31.8%' },
  key: { height: size.touch * 1.15 },
});
