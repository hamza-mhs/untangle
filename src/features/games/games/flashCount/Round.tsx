import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/design/components';
import { color, radius, size, space } from '@/design/tokens';
import { useT } from '@/i18n';

import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop, Well } from '../../kit';
import {
  FLASH_SECONDS,
  FLASH_TRIALS,
  flashMs,
  flashPoints,
  flashStars,
  flashTrials,
  WELL,
  type FlashTrial,
} from './logic';

const POLL_MS = 40;
/** Bead diameter as a fraction of the well width (prototype 26 px in 264). */
const BEAD = 26 / WELL.w;

type Dots = 'hidden' | 'on' | 'ghost';
type KeyState = 'idle' | 'ok' | 'no' | 'dim';

export default function FlashCountRound({ api, seed }: RoundProps) {
  const t = useT();
  const [trial, setTrial] = useState<FlashTrial | null>(null);
  const [dots, setDots] = useState<Dots>('hidden');
  const [cue, setCue] = useState(t('games.flashCount.ready'));
  const [keys, setKeys] = useState<KeyState[]>(['idle', 'idle', 'idle', 'idle']);
  const [well, setWell] = useState({ w: 0, h: 0, y: 0 });
  const keysAt = useRef({ y: 0, xs: [0, 0, 0, 0] });
  const answering = useRef(false);
  const answer = useRef<number | null>(null);

  useRoundLoop(api, async () => {
    const trials = flashTrials(seed);
    const timer = api.timer(FLASH_SECONDS);
    let n = 0;
    let right = 0;
    let slips = 0;
    let streak = 0;
    api.combo(0);
    while (!timer.done() && n < FLASH_TRIALS) {
      const tr = trials[n]!;
      n++;
      api.setRound(t('games.hud.of', { n, total: FLASH_TRIALS }));
      setKeys(['idle', 'idle', 'idle', 'idle']);
      setDots('hidden');
      setTrial(tr);
      setCue(t('games.flashCount.watch'));
      api.hint(t('games.flashCount.count'));
      api.quiet(true);
      await api.wait(500);
      setCue('');
      setDots('on');
      api.sound('beep');
      await api.wait(flashMs(n));
      setDots('hidden');
      api.quiet(false);
      setCue(t('games.flashCount.howMany'));
      api.hint(t('games.flashCount.tap'));
      answer.current = null;
      answering.current = true;
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      answering.current = false;
      const a = answer.current;
      if (a === null) break;
      const count = tr.dots.length;
      const ci = tr.options.indexOf(count);
      setCue('');
      setDots('ghost');
      if (tr.options[a] === count) {
        right++;
        streak++;
        api.combo(streak);
        setKeys(tr.options.map((_, i) => (i === a ? 'ok' : 'dim')));
        const pts = flashPoints(count);
        api.addScore(pts);
        api.fx.hit(keysAt.current.xs[a]!, keysAt.current.y, color.game.sun, pts);
        api.hint(t('games.flashCount.right', { n: count }), 'good');
      } else {
        slips++;
        streak = 0;
        api.combo(0);
        setKeys(tr.options.map((_, i) => (i === a ? 'no' : i === ci ? 'ok' : 'dim')));
        api.fx.oops();
        api.hint(t('games.flashCount.wasN', { n: count }), 'bad');
      }
      await api.wait(900);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const total = Math.max(right + slips, 1);
    api.finish({
      title: t('games.flashCount.title'),
      stars: flashStars(right),
      stats: [
        t('games.flashCount.statRight', { right, n: total }),
        t('games.common.slips', { count: slips }),
      ],
      best: { value: right, label: t('games.flashCount.statRight', { right, n: total }) },
    });
  });

  const onWell = (e: LayoutChangeEvent) => {
    const { width, height, y } = e.nativeEvent.layout;
    setWell({ w: width, h: height, y });
  };
  const bead = BEAD * well.w;

  return (
    <View style={styles.fill}>
      <Well
        style={styles.well}
        onLayout={onWell}
        accessibilityLabel={cue || t('games.flashCount.count')}>
        {trial && dots !== 'hidden'
          ? trial.dots.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.bead,
                  {
                    width: bead,
                    height: bead,
                    left: d.x * well.w - bead / 2,
                    top: d.y * well.h - bead / 2,
                  },
                  dots === 'ghost' ? styles.ghost : null,
                ]}
              />
            ))
          : null}
        {cue ? (
          <View style={styles.cue} pointerEvents="none">
            <Text variant="heading" tone="secondary" align="center">
              {cue}
            </Text>
          </View>
        ) : null}
      </Well>
      <View
        style={styles.keys}
        onLayout={(e) =>
          (keysAt.current.y = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)
        }>
        {(trial?.options ?? [0, 0, 0, 0]).map((v, i) => (
          <View
            key={i}
            style={[styles.keyCell, keys[i] === 'dim' ? styles.dim : null]}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              keysAt.current.xs[i] = x + width / 2;
            }}>
            <ToyKey
              testID={`game.flashCount.key${i}`}
              tint={color.game.sun}
              accessibilityLabel={String(v)}
              onPress={() => {
                if (!answering.current || answer.current !== null) return;
                api.haptic('tap');
                api.sound('tap');
                answer.current = i;
              }}
              style={[
                styles.key,
                keys[i] === 'ok' ? styles.ok : null,
                keys[i] === 'no' ? styles.no : null,
              ]}>
              <Text variant="statLg" tone="onLight">
                {trial ? String(v) : ''}
              </Text>
            </ToyKey>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', gap: space['2xl'] },
  well: { width: '100%', aspectRatio: WELL.w / WELL.h },
  bead: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: color.game.sun,
  },
  ghost: { opacity: 0.22 },
  cue: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  keys: { flexDirection: 'row', gap: space.sm },
  keyCell: { flex: 1 },
  key: { height: size.touch * 1.8 },
  ok: { borderWidth: 3, borderColor: color.signal.success },
  no: { borderWidth: 3, borderColor: color.signal.danger },
  dim: { opacity: 0.45 },
});
