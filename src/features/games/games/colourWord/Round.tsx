import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Text } from '@/design/components';
import { color, size, space } from '@/design/tokens';
import { useT } from '@/i18n';
import type { RoundProps } from '../../engine/types';
import { ToyKey, useRoundLoop } from '../../kit';
import {
  colourStars,
  colourTrials,
  COLOUR_TRIALS,
  INKS,
  type ColourTrial,
  type Ink,
} from './logic';

const INK_COLOR: Record<Ink, string> = {
  red: color.game.coral,
  blue: color.game.sky,
  green: color.game.mint,
  yellow: color.game.sun,
};
const POLL_MS = 40;

type Centers = Record<string, { x: number; y: number }>;

/** Keeps the centre of each laid-out element, in board coordinates. */
function useCenters() {
  const ref = useRef<Centers>({});
  const on =
    (key: string, offset = { x: 0, y: 0 }) =>
    (e: LayoutChangeEvent) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      ref.current[key] = { x: offset.x + x + width / 2, y: offset.y + y + height / 2 };
    };
  return { centers: ref, on };
}

export default function ColourWordRound({ api, seed }: RoundProps) {
  const t = useT();
  const [trial, setTrial] = useState<ColourTrial | null>(null);
  const answer = useRef<Ink | null>(null);
  const keysTop = useRef(0);
  const { centers, on } = useCenters();
  const [n, setN] = useState(0);

  useRoundLoop(api, async () => {
    const trials = colourTrials(seed);
    const timer = api.timer(40);
    let right = 0;
    let slips = 0;
    let streak = 0;
    let i = 0;
    api.combo(0);
    for (; i < trials.length && !timer.done(); i++) {
      api.setRound(t('games.hud.of', { n: i + 1, total: COLOUR_TRIALS }));
      answer.current = null;
      setTrial(trials[i]!);
      setN(i);
      while (answer.current === null && !timer.done()) await api.wait(POLL_MS);
      const a = answer.current;
      if (a === null) break;
      const c = centers.current[a] ?? { x: api.board.width / 2, y: api.board.height / 2 };
      if (a === trials[i]!.ink) {
        right++;
        streak++;
        const pts = 10 + Math.min(streak - 1, 5) * 2;
        api.addScore(pts);
        api.combo(streak);
        api.fx.hit(c.x, c.y + keysTop.current, color.text.primary, pts);
        api.hint(t('games.colourWord.right'), 'good');
      } else {
        slips++;
        streak = 0;
        api.combo(0);
        api.fx.oops();
        api.hint(t('games.colourWord.slip'), 'bad');
      }
      await api.wait(260);
    }
    if (timer.done()) api.fx.toast(t('games.hud.timeUp'), color.signal.danger);
    await api.wait(timer.done() ? 700 : 200);
    api.finish({
      title: right >= 12 ? t('games.colourWord.titleSharp') : t('games.colourWord.titleNice'),
      stars: colourStars(right),
      score: right * 10,
      stats: [
        t('games.colourWord.statRight', { right, n: Math.max(i, 1) }),
        t('games.common.slips', { count: slips }),
      ],
      best: { value: right, label: t('games.colourWord.statRight', { right, n: Math.max(i, 1) }) },
    });
  });

  return (
    <View style={styles.fill}>
      <View style={styles.wordBox}>
        {trial ? (
          <Text
            key={n}
            variant="statXl"
            align="center"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ color: INK_COLOR[trial.ink] }}
            accessibilityLabel={t('games.colourWord.a11y', {
              word: t(`games.colourWord.inks.${trial.word}`),
              ink: t(`games.colourWord.inks.${trial.ink}`),
            })}>
            {t(`games.colourWord.inks.${trial.word}`).toUpperCase()}
          </Text>
        ) : null}
      </View>
      <View style={styles.grid} onLayout={(e) => (keysTop.current = e.nativeEvent.layout.y)}>
        {INKS.map((ink) => (
          <View key={ink} style={styles.cell2} onLayout={on(ink)}>
            <ToyKey
              testID={`game.colourWord.${ink}`}
              tint={INK_COLOR[ink]}
              accessibilityLabel={t(`games.colourWord.inks.${ink}`)}
              onPress={() => {
                api.haptic('tap');
                api.sound('tap');
                if (answer.current === null) answer.current = ink;
              }}
              style={styles.bigKey}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wordBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingBottom: space.md },
  cell2: { width: '47.5%' },
  bigKey: { height: size.touch * 3 },
});
