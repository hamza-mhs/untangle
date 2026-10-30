import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design/components';
import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop } from '../../kit';
import { arrowStars, arrowTrials, averageMs, type ArrowTrial, type Dir } from './logic';

const POLL_MS = 40;

const ARROW = { left: '◀', right: '▶' } as const;

export default function MiddleArrowRound({ api, seed }: RoundProps) {
  const t = useT();
  const [trial, setTrial] = useState<ArrowTrial | null>(null);
  const answer = useRef<Dir | null>(null);

  useRoundLoop(api, async () => {
    const trials = arrowTrials(seed);
    const timer = api.timer(40);
    const times: number[] = [];
    let right = 0;
    let streak = 0;
    let i = 0;
    api.combo(0);
    for (; i < trials.length && !timer.done(); i++) {
      api.setRound(t('games.hud.of', { n: i + 1, total: trials.length }));
      setTrial(null);
      await api.wait(250);
      answer.current = null;
      setTrial(trials[i]!);
      const shown = api.clock.now();
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS / 2);
      if (answer.current === null) break;
      const ms = api.clock.now() - shown;
      if (answer.current === trials[i]!.middle) {
        right++;
        streak++;
        times.push(ms);
        const pts = Math.max(5, 30 - Math.round(ms / 50));
        api.addScore(pts);
        api.combo(streak);
        api.fx.float(
          api.board.width / 2,
          api.board.height * 0.3,
          `${Math.round(ms)} ms`,
          color.signal.success,
        );
        api.hint(t('games.middleArrow.right'), 'good');
      } else {
        streak = 0;
        api.combo(0);
        api.fx.oops();
        api.hint(t('games.middleArrow.wrong'), 'bad');
      }
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    const avg = averageMs(times);
    api.finish({
      title: t('games.middleArrow.title'),
      stars: arrowStars(right),
      score: right * 10,
      stats: [
        t('games.middleArrow.statRight', { right, n: Math.max(i, 1) }),
        t('games.middleArrow.statAvg', { ms: avg }),
      ],
      ...(right
        ? { best: { value: avg, label: t('games.middleArrow.statAvg', { ms: avg }) } }
        : {}),
    });
  });

  const press = (d: Dir) => {
    api.haptic('tap');
    api.sound('tap');
    if (answer.current === null) answer.current = d;
  };
  return (
    <View style={styles.fill}>
      <View style={styles.wordBox}>
        {trial ? (
          <View
            style={styles.arrows}
            accessible
            accessibilityLabel={t('games.middleArrow.a11y', {
              dir: t(`games.middleArrow.${trial.middle}`),
            })}>
            {[0, 1, 2, 3, 4].map((k) => (
              <Text key={k} variant="statLg" style={k === 2 ? styles.middle : styles.flank}>
                {ARROW[k === 2 ? trial.middle : trial.flank]}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        {(['left', 'right'] as const).map((d) => (
          <ToyKey
            key={d}
            testID={`game.middleArrow.${d}`}
            tint={color.game.sky}
            accessibilityLabel={t(`games.middleArrow.${d}`)}
            onPress={() => press(d)}
            style={styles.arrowKey}>
            <Text variant="statLg">{ARROW[d]}</Text>
          </ToyKey>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wordBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arrows: { flexDirection: 'row', gap: space.sm },
  middle: { color: color.text.primary },
  flank: { color: color.text.secondary },
  row: { flexDirection: 'row', gap: space.md, paddingBottom: space.md },
  arrowKey: { flex: 1, height: size.touch * 2.6 },
});
